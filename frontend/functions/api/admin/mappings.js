import { isAuthorized, unauthorizedResponse } from '../../_lib/auth.js';

function jsonError(err, status = 500) {
  return Response.json({ error: err instanceof Error ? err.message : 'Eroare interna' }, { status });
}

/** GET /api/admin/mappings (Pages Functions pure) */
export async function onRequestGet(context) {
  if (!isAuthorized(context.request, context.env)) return unauthorizedResponse();
  try {
    const [mappingRes, catRes] = await Promise.all([
      context.env.DB.prepare(
        `SELECT m.*, c.name AS category_name
         FROM product_mapping m LEFT JOIN categories c ON c.slug = m.category_slug
         ORDER BY m.id ASC`,
      ).all(),
      context.env.DB.prepare(`SELECT slug, name FROM categories ORDER BY sort_order ASC`).all(),
    ]);
    return Response.json({ mappings: mappingRes.results ?? [], categories: catRes.results ?? [] });
  } catch (err) {
    return jsonError(err);
  }
}

/** POST /api/admin/mappings */
export async function onRequestPost(context) {
  if (!isAuthorized(context.request, context.env)) return unauthorizedResponse();
  try {
    const body = await context.request.json();
    const categorySlug = String(body?.category_slug ?? '');
    const categoryUrl = String(body?.cleanx_category_url ?? '');
    if (!categorySlug || !categoryUrl) {
      return Response.json(
        { error: 'category_slug si cleanx_category_url sunt obligatorii' },
        { status: 400 },
      );
    }
    await context.env.DB.prepare(
      `INSERT INTO product_mapping
         (category_slug, cleanx_product_url, cleanx_category_url, cleanx_product_name, keywords, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
    )
      .bind(
        categorySlug,
        body?.cleanx_product_url ? String(body.cleanx_product_url) : null,
        categoryUrl,
        body?.cleanx_product_name ? String(body.cleanx_product_name) : null,
        body?.keywords ? String(body.keywords) : null,
      )
      .run();
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

/** PATCH /api/admin/mappings */
export async function onRequestPatch(context) {
  if (!isAuthorized(context.request, context.env)) return unauthorizedResponse();
  try {
    const body = await context.request.json();
    const id = Number(body?.id ?? 0);
    if (!id) return Response.json({ error: 'id lipseste' }, { status: 400 });

    const allowed = [
      'category_slug',
      'cleanx_product_url',
      'cleanx_category_url',
      'cleanx_product_name',
      'keywords',
      'is_active',
    ];
    const sets = [];
    const params = [];
    for (const field of allowed) {
      if (field in body) {
        sets.push(`${field} = ?`);
        params.push(body[field] === '' ? null : body[field]);
      }
    }
    if (!sets.length) return Response.json({ error: 'Niciun camp de actualizat' }, { status: 400 });

    params.push(id);
    await context.env.DB.prepare(
      `UPDATE product_mapping SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
      .bind(...params)
      .run();
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

/** DELETE /api/admin/mappings */
export async function onRequestDelete(context) {
  if (!isAuthorized(context.request, context.env)) return unauthorizedResponse();
  try {
    const body = await context.request.json();
    const id = Number(body?.id ?? 0);
    if (!id) return Response.json({ error: 'id lipseste' }, { status: 400 });
    await context.env.DB.prepare(`DELETE FROM product_mapping WHERE id = ?`).bind(id).run();
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
