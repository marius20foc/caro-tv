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

/** GET /api/admin/mappings – mapari + lista categorii (pentru formular). */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const db = getDb();
    const [mappingRes, catRes] = await Promise.all([
      db
        .prepare(
          `SELECT m.*, c.name AS category_name
           FROM product_mapping m LEFT JOIN categories c ON c.slug = m.category_slug
           ORDER BY m.id ASC`,
        )
        .all<any>(),
      db.prepare(`SELECT slug, name FROM categories ORDER BY sort_order ASC`).all<any>(),
    ]);
    return Response.json({
      mappings: mappingRes.results ?? [],
      categories: catRes.results ?? [],
    });
  } catch (err) {
    return jsonError(err);
  }
}

/** POST /api/admin/mappings – adauga mapare. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const categorySlug = String(body?.category_slug ?? '');
    const categoryUrl = String(body?.cleanx_category_url ?? '');
    if (!categorySlug || !categoryUrl) {
      return Response.json({ error: 'category_slug si cleanx_category_url sunt obligatorii' }, { status: 400 });
    }
    const res = await getDb()
      .prepare(
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

/** PATCH /api/admin/mappings – actualizeaza campuri (ex: is_active toggle). */
export async function PATCH(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const id = Number(body?.id ?? 0);
    if (!id) return Response.json({ error: 'id lipseste' }, { status: 400 });

    const allowed = [
      'category_slug',
      'cleanx_product_url',
      'cleanx_category_url',
      'cleanx_product_name',
      'keywords',
      'is_active',
    ] as const;
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const field of allowed) {
      if (field in body) {
        sets.push(`${field} = ?`);
        params.push(body[field] === '' ? null : body[field]);
      }
    }
    if (!sets.length) {
      return Response.json({ error: 'Niciun camp de actualizat' }, { status: 400 });
    }
    params.push(id);
    await getDb()
      .prepare(`UPDATE product_mapping SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(...params)
      .run();
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

/** DELETE /api/admin/mappings – sterge mapare. */
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const body = await request.json();
    const id = Number(body?.id ?? 0);
    if (!id) return Response.json({ error: 'id lipseste' }, { status: 400 });
    await getDb().prepare(`DELETE FROM product_mapping WHERE id = ?`).bind(id).run();
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
