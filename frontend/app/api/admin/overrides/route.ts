import { getDb } from '@/lib/db';
import { isAuthorized, unauthorizedResponse } from '@/lib/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function jsonError(err: unknown, status = 500): Response {
  return Response.json(
    { error: err instanceof Error ? err.message : 'Eroare interna' },
    { status },
  );
}

/** GET /api/admin/overrides – override-uri + titlurile video-urilor. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const { results } = await getDb()
      .prepare(
        `SELECT o.*, v.youtube_id, v.title AS video_title
         FROM video_product_overrides o
         LEFT JOIN videos v ON v.id = o.video_id
         ORDER BY o.updated_at DESC`,
      )
      .all<any>();
    return Response.json({ overrides: results ?? [] });
  } catch (err) {
    return jsonError(err);
  }
}

/** PUT /api/admin/overrides – upsert override pentru un video (dupa youtube_id). */
export async function PUT(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const youtubeId = String(body?.youtube_id ?? '').trim();
    const categoryUrl = String(body?.cleanx_category_url ?? '');
    if (!youtubeId || !categoryUrl) {
      return Response.json(
        { error: 'youtube_id si cleanx_category_url sunt obligatorii' },
        { status: 400 },
      );
    }

    const db = getDb();
    const video = await db
      .prepare(`SELECT id FROM videos WHERE youtube_id = ?`)
      .bind(youtubeId)
      .first<any>();
    if (!video) {
      return Response.json({ error: 'Video negasit in baza de date' }, { status: 404 });
    }

    await db
      .prepare(
        `INSERT INTO video_product_overrides
           (video_id, cleanx_product_url, cleanx_category_url, cleanx_product_name, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(video_id) DO UPDATE SET
           cleanx_product_url = excluded.cleanx_product_url,
           cleanx_category_url = excluded.cleanx_category_url,
           cleanx_product_name = excluded.cleanx_product_name,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        video.id,
        body?.cleanx_product_url ? String(body.cleanx_product_url) : null,
        categoryUrl,
        body?.cleanx_product_name ? String(body.cleanx_product_name) : null,
      )
      .run();

    return Response.json({ ok: true, video_id: video.id });
  } catch (err) {
    return jsonError(err);
  }
}

/** DELETE /api/admin/overrides – sterge override-ul unui video. */
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const videoId = Number(body?.video_id ?? 0);
    if (!videoId) return Response.json({ error: 'video_id lipseste' }, { status: 400 });
    await getDb()
      .prepare(`DELETE FROM video_product_overrides WHERE video_id = ?`)
      .bind(videoId)
      .run();
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
