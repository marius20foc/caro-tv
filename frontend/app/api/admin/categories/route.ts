import { getDb } from '@/lib/db';
import { isAuthorized, unauthorizedResponse } from '@/lib/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** GET /api/admin/categories – lista completa (inclusiv playlist_id, accent, SEO). */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const { results } = await getDb()
      .prepare(
        `SELECT c.*, (SELECT COUNT(*) FROM videos v WHERE v.category_slug = c.slug) AS video_count
         FROM categories c ORDER BY c.sort_order ASC`,
      )
      .all<any>();
    return Response.json({ categories: results ?? [] });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/categories – actualizeaza playlist_id / accent / SEO. */
export async function PATCH(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const slug = String(body?.slug ?? '');
    if (!slug) return Response.json({ error: 'slug lipseste' }, { status: 400 });

    const allowed = ['playlist_id', 'accent', 'seo_title', 'seo_description'] as const;
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const field of allowed) {
      if (field in body) {
        sets.push(`${field} = ?`);
        params.push(body[field] === '' || body[field] == null ? null : String(body[field]));
      }
    }
    if (!sets.length) {
      return Response.json({ error: 'Niciun camp de actualizat' }, { status: 400 });
    }

    params.push(slug);
    await getDb()
      .prepare(`UPDATE categories SET ${sets.join(', ')} WHERE slug = ?`)
      .bind(...params)
      .run();

    return Response.json({ ok: true, slug });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}
