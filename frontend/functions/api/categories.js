import { listCategories } from '../_lib/db.js';

/** GET /api/categories (Pages Functions) */
export async function onRequestGet(context) {
  const { env } = context;
  try {
    const categories = await listCategories(env);
    return Response.json(categories, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}
