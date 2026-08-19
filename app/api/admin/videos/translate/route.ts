import { getDb } from '@/lib/db';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { isAuthorized, unauthorizedResponse } from '@/lib/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/videos/translate – traduce descrierea UNUI videoclip
 * la cerere (Workers AI pe Pages). Folositor pentru videoclipurile care
 * n-au fost prinse in transele zilnice ale cron-ului.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const id = Number(body?.id ?? 0);
    if (!id) return Response.json({ error: 'id lipseste' }, { status: 400 });

    const db = getDb();
    const row = await db
      .prepare(`SELECT id, youtube_id, description, description_ro FROM videos WHERE id = ?`)
      .bind(id)
      .first<any>();
    if (!row) return Response.json({ error: 'Videoclip negasit' }, { status: 404 });

    const text = String(row.description ?? '')
      .split('\n')
      .filter((line) => !/https?:\/\/|www\./i.test(line))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);

    if (!text) {
      return Response.json({ ok: true, skipped: true, reason: 'Descrierea este goala.' });
    }
    if (/[ăâîșțĂÂÎȘȚ]/.test(text)) {
      return Response.json({ ok: true, skipped: true, reason: 'Descrierea este deja in romana.' });
    }

    const env = getRequestContext().env as unknown as CloudflareEnv;
    if (!env.AI) {
      return Response.json(
        { error: 'Binding-ul Workers AI lipseste pe proiectul Pages (Settings → Bindings → AI).' },
        { status: 500 },
      );
    }

    const resp = (await env.AI.run('@cf/meta/m2m100-1.2b', {
      text,
      source_lang: 'english',
      target_lang: 'romanian',
    })) as string | { translated_text?: string };
    const out = typeof resp === 'string' ? resp : resp?.translated_text ?? '';
    if (!out || !out.trim()) {
      return Response.json({ error: 'Traducerea a esuat (raspuns gol de la modelul AI).' }, { status: 502 });
    }

    await db
      .prepare(`UPDATE videos SET description_ro = ?, translated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(String(out).trim(), id)
      .run();

    return Response.json({ ok: true, translated: true, preview: String(out).trim().slice(0, 200) });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}
