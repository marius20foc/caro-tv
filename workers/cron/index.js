// ============================================================
// CARO.TV v4pro – Worker CRON: sincronizare zilnica YouTube -> D1
// ------------------------------------------------------------
// Trigger: "0 3 * * *" (03:00 UTC, zilnic) – vezi wrangler.toml
// Reguli cota YouTube (10.000 unitati/zi):
//   - DOAR playlistItems.list, videos.list (1 unitate fiecare)
//   - NU /search (100 unitati)
// Buget: 10 categorii x (max 5 pagini playlistItems + 1 videos) = 60 unitati/zi
// v4pro: paginare playlist (pana la 250 video/categorie), durata,
//        channel_id, cache thumbnails in R2 (optional), is_active.
// ============================================================

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const PLAYLIST_MAX = 50;
const PLAYLIST_MAX_PAGES = 5; // 250 videoclipuri / categorie max

// ------------------------------------------------------------
// YouTube API (self-contained – nu depinde de frontend)
// ------------------------------------------------------------

async function apiGet(apiKey, endpoint, params) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set('key', apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  const data = await res.json().catch(() => null);

  if (!res.ok || data?.error) {
    const code = data?.error?.code ?? res.status;
    const msg = data?.error?.message ?? res.statusText;
    if (code === 403) {
      throw new Error(`YouTube API: cota depasita sau acces interzis (${msg})`);
    }
    throw new Error(`YouTube API ${endpoint} esuat: ${code} ${msg}`);
  }
  return data;
}

/** playlistItems.list (1 unitate/pagina) – cu paginare completa. */
async function fetchPlaylistVideoIds(apiKey, playlistId) {
  const items = [];
  let pageToken = null;

  for (let page = 0; page < PLAYLIST_MAX_PAGES; page++) {
    const params = {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: String(PLAYLIST_MAX),
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await apiGet(apiKey, 'playlistItems', params);
    for (const it of data.items ?? []) {
      if (!it?.contentDetails?.videoId) continue;
      items.push({
        youtube_id: it.contentDetails.videoId,
        title: it.snippet?.title ?? '',
        published_at: it.snippet?.publishedAt ?? '',
      });
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return items;
}

/** videos.list (1 unitate, batch de 50) -> detalii + statistici + durata. */
async function fetchVideosDetails(apiKey, videoIds) {
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50));

  const out = [];
  for (const chunk of chunks) {
    const data = await apiGet(apiKey, 'videos', {
      part: 'snippet,contentDetails,statistics',
      id: chunk.join(','),
    });
    for (const it of data.items ?? []) {
      const st = it.statistics ?? {};
      const durationIso = it.contentDetails?.duration ?? '';
      out.push({
        youtube_id: it.id,
        title: it.snippet?.title ?? '',
        description: it.snippet?.description ?? '',
        thumbnail_url:
          it.snippet?.thumbnails?.maxres?.url ||
          it.snippet?.thumbnails?.high?.url ||
          it.snippet?.thumbnails?.medium?.url ||
          '',
        channel_title: it.snippet?.channelTitle ?? '',
        channel_id: it.snippet?.channelId ?? '',
        published_at: it.snippet?.publishedAt ?? '',
        duration: durationIso,
        duration_seconds: parseDurationSeconds(durationIso),
        views: Number(st.viewCount ?? 0),
        likes: Number(st.likeCount ?? 0),
      });
    }
  }
  return out;
}

/** ISO 8601 (PT12M34S) -> secunde (pentru filtrare rapida in SQL). */
function parseDurationSeconds(iso) {
  const match = String(iso).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

// ------------------------------------------------------------
// Mapare produse (aceeasi regula de linkuire ca frontend)
// ------------------------------------------------------------

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function keywordsMatch(title, description, keywords) {
  if (!keywords) return false;
  const haystack = normalizeText(`${title} ${description ?? ''}`);
  return String(keywords)
    .split(',')
    .map(normalizeText)
    .filter(Boolean)
    .some((kw) => haystack.includes(kw));
}

/**
 * Precompute product_url/product_name (produs EXACT) – doar daca exista
 * keyword-match; altfel ramane NULL (fallback-ul pe categorie se aplica
 * la citire). Override-urile manuale au prioritate la citire si nu
 * sunt suprascrise aici.
 */
function resolveProduct(mappings, video) {
  for (const m of mappings) {
    if (m.cleanx_product_url && keywordsMatch(video.title, video.description, m.keywords)) {
      return { product_url: m.cleanx_product_url, product_name: m.cleanx_product_name ?? null };
    }
  }
  return { product_url: null, product_name: null };
}

// ------------------------------------------------------------
// Sincronizare
// ------------------------------------------------------------

async function syncCategory(env, category, report) {
  if (!category.playlist_id) {
    report.skipped.push(category.slug);
    return;
  }

  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY lipseste (secret)');

  // 1) playlistItems.list (pagini, 1 unitate/pagina)
  const playlistItems = await fetchPlaylistVideoIds(apiKey, category.playlist_id);
  const ids = playlistItems.map((p) => p.youtube_id);

  // 2) videos.list (detalii + statistici + durata)
  const details = await fetchVideosDetails(apiKey, ids);
  const byId = new Map(details.map((d) => [d.youtube_id, d]));

  // 3) mapping-uri pentru linkuri contextuale
  const { results: mappings } = await env.DB.prepare(
    `SELECT * FROM product_mapping WHERE category_slug = ? AND is_active = 1 ORDER BY id ASC`,
  )
    .bind(category.slug)
    .all();

  const upsert = env.DB.prepare(
    `INSERT INTO videos
       (category_slug, youtube_id, title, description, thumbnail_url, channel_title,
        channel_id, published_at, duration, duration_seconds, views, likes, product_url,
        product_name, last_updated, is_active)
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
  );

  const statements = [];
  for (const item of playlistItems) {
    const d = byId.get(item.youtube_id) ?? {
      youtube_id: item.youtube_id,
      title: item.title,
      description: '',
      thumbnail_url: null,
      channel_title: null,
      channel_id: null,
      published_at: item.published_at,
      duration: '',
      duration_seconds: 0,
      views: 0,
      likes: 0,
    };
    const { product_url, product_name } = resolveProduct(mappings, d);
    statements.push(
      upsert.bind(
        category.slug,
        d.youtube_id,
        d.title,
        d.description,
        d.thumbnail_url,
        d.channel_title,
        d.channel_id,
        d.published_at,
        d.duration,
        d.duration_seconds,
        d.views,
        d.likes,
        product_url,
        product_name,
      ),
    );
  }

  if (statements.length) {
    await env.DB.batch(statements);
  }

  // (Optional) cache thumbnails in R2
  await cacheThumbnails(env, details.filter((d) => d.thumbnail_url));

  report.categories.push({
    slug: category.slug,
    playlist_id: category.playlist_id,
    fetched: playlistItems.length,
    upserted: statements.length,
  });
}

/** Marcheaza featured: top 8 dupa views, dintre videoclipurile actualizate in ultimele 30 zile. */
async function refreshFeatured(env) {
  await env.DB.prepare(`UPDATE videos SET is_featured = 0 WHERE is_featured = 1`).run();
  await env.DB.prepare(
    `UPDATE videos SET is_featured = 1
     WHERE youtube_id IN (
       SELECT youtube_id FROM videos
       WHERE last_updated > datetime('now', '-30 days') AND is_active = 1
       ORDER BY views DESC LIMIT 8
     )`,
  ).run();
}

/**
 * (Optional) Copiaza thumbnail-urile in R2 (binding THUMBS).
 * Activ doar daca variabila CACHE_THUMBS === '1'.
 */
async function cacheThumbnails(env, details) {
  if (!env.THUMBS || env.CACHE_THUMBS !== '1') return;
  const tasks = [];
  for (const d of details) {
    if (!d.thumbnail_url) continue;
    const key = `thumbs/${d.youtube_id}.jpg`;
    tasks.push(
      (async () => {
        try {
          const existing = await env.THUMBS.get(key);
          if (existing) return;
          const res = await fetch(d.thumbnail_url);
          if (!res.ok) return;
          const bytes = await res.arrayBuffer();
          await env.THUMBS.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
        } catch {
          /* thumbnail caching este best-effort */
        }
      })(),
    );
  }
  await Promise.allSettled(tasks);
}

async function syncAll(env) {
  const report = {
    started_at: new Date().toISOString(),
    categories: [],
    skipped: [],
    errors: [],
  };

  const { results: categories } = await env.DB.prepare(
    `SELECT slug, playlist_id FROM categories ORDER BY sort_order ASC`,
  ).all();

  for (const category of categories) {
    try {
      await syncCategory(env, category, report);
    } catch (err) {
      report.errors.push({
        category: category.slug,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    await refreshFeatured(env);
  } catch (err) {
    report.errors.push({
      category: 'featured',
      message: err instanceof Error ? err.message : String(err),
    });
  }

  report.finished_at = new Date().toISOString();
  return report;
}

// ------------------------------------------------------------
// Handlers Worker
// ------------------------------------------------------------

export default {
  /** Cron zilnic 03:00 UTC */
  async scheduled(_event, env, _ctx) {
    const report = await syncAll(env);
    console.log('CARO.TV cron report:', JSON.stringify(report));
  },

  /** Trigger manual: curl -X POST -H "Authorization: Bearer <MANUAL_TOKEN>" https://caro-tv-cron.<account>.workers.dev/ */
  async fetch(request, env) {
    const token = env.MANUAL_TOKEN;
    if (!token) return new Response('Manual trigger dezactivat', { status: 403 });
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${token}`) return new Response('Neautorizat', { status: 401 });

    const report = await syncAll(env);
    console.log('CARO.TV manual sync:', JSON.stringify(report));
    return Response.json(report);
  },
};
