import { attachContextualLinks, listVideos } from '../_lib/db.js';

/** GET /api/videos?category&limit&offset&q&featured (Pages Functions) */
export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') ?? undefined;
    const q = url.searchParams.get('q') ?? undefined;
    const featured = url.searchParams.get('featured') === '1';
    const limit = Number(url.searchParams.get('limit') ?? 24);
    const offset = Number(url.searchParams.get('offset') ?? 0);

    const { videos, total } = await listVideos(env, {
      category,
      limit,
      offset,
      featuredOnly: featured,
      q,
    });
    const withLinks = await attachContextualLinks(env, videos);

    return Response.json(
      { videos: withLinks, total, limit, offset },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}
