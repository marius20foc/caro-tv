import { ensureSchema, getDb } from '@/lib/db';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { isAuthorized, unauthorizedResponse } from '@/lib/auth';
import { keywordsMatch } from '@/lib/productMapper';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** Extrage ID-ul YouTube din link (watch, youtu.be, shorts, embed) sau ID direct. */
function extractYoutubeId(input: string): string | null {
  const value = String(input ?? '').trim();
  if (!value) return null;
  if (/^[\w-]{11}$/.test(value)) return value;
  const match = value.match(
    /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? match[1] : null;
}

function parseDurationSeconds(iso: string): number {
  const match = String(iso).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

/**
 * POST /api/admin/videos – adauga manual un videoclip intr-o categorie.
 * Cost YouTube: 1 unitate (videos.list) – la fel ca cron-ul.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const youtubeId = extractYoutubeId(body?.youtube_id ?? '');
    const categorySlug = String(body?.category_slug ?? '').trim();

    if (!youtubeId) {
      return Response.json({ error: 'Link/ID YouTube invalid' }, { status: 400 });
    }
    if (!categorySlug) {
      return Response.json({ error: 'Alege categoria' }, { status: 400 });
    }

    const db = getDb();

    // auto-reparare schema: daca baza legata nu are coloanele noi, le adaugam acum
    await ensureSchema();

    const category = await db
      .prepare(`SELECT slug FROM categories WHERE slug = ?`)
      .bind(categorySlug)
      .first<any>();
    if (!category) {
      return Response.json({ error: 'Categoria nu exista' }, { status: 404 });
    }

    const env = getRequestContext().env as unknown as CloudflareEnv;
    const apiKey = env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'YOUTUBE_API_KEY lipseste pe proiectul Pages (Settings → Variables and Secrets).' },
        { status: 500 },
      );
    }

    // 1 unitate de cota – detalii video de la YouTube
    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    apiUrl.searchParams.set('part', 'snippet,contentDetails,statistics');
    apiUrl.searchParams.set('id', youtubeId);
    apiUrl.searchParams.set('key', apiKey);

    const res = await fetch(apiUrl.toString());
    const data: any = await res.json().catch(() => null);
    if (!res.ok || data?.error) {
      return Response.json(
        { error: `YouTube: ${data?.error?.message ?? res.statusText}` },
        { status: 502 },
      );
    }
    const item = (data?.items ?? [])[0];
    if (!item) {
      return Response.json({ error: 'Videoclipul nu a fost gasit pe YouTube' }, { status: 404 });
    }

    const snippet = item.snippet ?? {};
    const st = item.statistics ?? {};
    const title = snippet.title ?? '';
    const description = snippet.description ?? '';
    const durationIso = item.contentDetails?.duration ?? '';

    // mapare produs (keywords) – regula de linkuire contextuala
    const { results: mappings } = await db
      .prepare(`SELECT * FROM product_mapping WHERE category_slug = ? AND is_active = 1 ORDER BY id ASC`)
      .bind(categorySlug)
      .all<any>();
    let productUrl: string | null = null;
    let productName: string | null = null;
    for (const m of mappings ?? []) {
      if (m.cleanx_product_url && keywordsMatch(title, description, m.keywords)) {
        productUrl = m.cleanx_product_url;
        productName = m.cleanx_product_name ?? null;
        break;
      }
    }

    await db
      .prepare(
        `INSERT INTO videos
           (category_slug, youtube_id, title, description, thumbnail_url, channel_title,
            channel_id, published_at, duration, duration_seconds, views, likes,
            product_url, product_name, last_updated, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
         ON CONFLICT(youtube_id) DO UPDATE SET
           category_slug = excluded.category_slug,
           title = excluded.title,
           description = excluded.description,
           thumbnail_url = excluded.thumbnail_url,
           channel_title = excluded.channel_title,
           channel_id = excluded.channel_id,
           published_at = excluded.published_at,
           duration = excluded.duration,
           duration_seconds = excluded.duration_seconds,
           views = excluded.views,
           likes = excluded.likes,
           product_url = excluded.product_url,
           product_name = excluded.product_name,
           is_active = 1,
           last_updated = CURRENT_TIMESTAMP`,
      )
      .bind(
        categorySlug,
        youtubeId,
        title,
        description,
        snippet.thumbnails?.maxres?.url ||
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          '',
        snippet.channelTitle ?? '',
        snippet.channelId ?? '',
        snippet.publishedAt ?? '',
        durationIso,
        parseDurationSeconds(durationIso),
        Number(st.viewCount ?? 0),
        Number(st.likeCount ?? 0),
        productUrl,
        productName,
      )
      .run();

    // traducere imediata a descrierii (daca Pages are binding Workers AI)
    if (env.AI) {
      try {
        const text = description.replace(/\s+/g, ' ').trim().slice(0, 1500);
        if (text && !/[ăâîșțĂÂÎȘȚ]/.test(text)) {
          const resp = (await env.AI.run('@cf/meta/m2m100-1.2b', {
            text,
            source_lang: 'english',
            target_lang: 'romanian',
          })) as string | { translated_text?: string };
          const out = typeof resp === 'string' ? resp : resp?.translated_text ?? '';
          if (out && out.trim()) {
            await db
              .prepare(
                `UPDATE videos SET description_ro = ?, translated_at = CURRENT_TIMESTAMP WHERE youtube_id = ?`,
              )
              .bind(String(out).trim(), youtubeId)
              .run();
          }
        }
      } catch {
        /* AI indisponibil – cron-ul va traduce mai tarziu */
      }
    }

    return Response.json({ ok: true, video: { youtube_id: youtubeId, title } });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}
