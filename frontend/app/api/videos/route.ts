import { attachContextualLinks, listVideos, searchVideos } from '@/lib/db';
import { isSortKey } from '@/lib/constants';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/videos
 * Query params:
 *   category (slug) | q (cautare full-text FTS5) | sort (newest|views|trending)
 *   duration (short|medium|long) | page | perPage
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') ?? undefined;
    const q = url.searchParams.get('q') ?? undefined;
    const featured = url.searchParams.get('featured') === '1';

    const sortParam = url.searchParams.get('sort') ?? 'newest';
    const sort = isSortKey(sortParam) ? sortParam : 'newest';

    const duration = url.searchParams.get('duration') ?? '';
    let minSeconds: number | undefined;
    let maxSeconds: number | undefined;
    if (duration === 'short') maxSeconds = 240;
    if (duration === 'medium') {
      minSeconds = 240;
      maxSeconds = 1200;
    }
    if (duration === 'long') minSeconds = 1200;

    const page = Math.max(Number(url.searchParams.get('page') ?? 1) || 1, 1);
    const perPage = Math.min(
      Math.max(Number(url.searchParams.get('perPage') ?? 24) || 24, 1),
      60,
    );

    const opts = { category, sort, minSeconds, maxSeconds, featuredOnly: featured, page, perPage };
    const result = q && q.trim() ? await searchVideos({ ...opts, q }) : await listVideos(opts);
    const withLinks = await attachContextualLinks(result.videos);

    return Response.json(
      { ...result, videos: withLinks },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare interna';
    return Response.json({ error: message }, { status: 500 });
  }
}
