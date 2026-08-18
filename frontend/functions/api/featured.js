import { attachContextualLinks, getFeatured } from '../_lib/db.js';

/** GET /api/featured (Pages Functions) */
export async function onRequestGet(context) {
  const { env } = context;
  try {
    const featured = await getFeatured(env, 8);
    const withLinks = await attachContextualLinks(env, featured);
    return Response.json(
      { videos: withLinks },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}
