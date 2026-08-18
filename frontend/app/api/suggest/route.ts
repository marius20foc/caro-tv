import { suggestVideos } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** GET /api/suggest?q=… – autocomplete instant pentru cautare (max 8 sugestii). */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    if (q.trim().length < 2) {
      return Response.json({ suggestions: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const suggestions = await suggestVideos(q, 8);
    return Response.json(
      { suggestions },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare interna';
    return Response.json({ error: message }, { status: 500 });
  }
}
