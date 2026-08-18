import { isAuthorized, unauthorizedResponse } from '../../_lib/auth.js';

/** GET + PATCH /api/admin/categories (Pages Functions pure) */
export async function onRequestGet(context) {
  if (!isAuthorized(context.request, context.env)) return unauthorizedResponse();
  try {
    const { results } = await context.env.DB.prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM videos v WHERE v.category_slug = c.slug) AS video_count
       FROM categories c ORDER BY c.sort_order ASC`,
    ).all();
    return Response.json({ categories: results ?? [] });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}

export async function onRequestPatch(context) {
  if (!isAuthorized(context.request, context.env)) return unauthorizedResponse();
  try {
    const body = await context.request.json();
    const slug = String(body?.slug ?? '');
    if (!slug) return Response.json({ error: 'slug lipseste' }, { status: 400 });

    const allowed = ['playlist_id', 'accent', 'seo_title', 'seo_description'];
    const sets = [];
    const params = [];
    for (const field of allowed) {
      if (field in body) {
        sets.push(`${field} = ?`);
        params.push(body[field] === '' || body[field] == null ? null : String(body[field]));
      }
    }
    if (!sets.length) return Response.json({ error: 'Niciun camp de actualizat' }, { status: 400 });

    params.push(slug);
    await context.env.DB.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE slug = ?`)
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
