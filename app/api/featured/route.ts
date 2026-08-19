import { attachContextualLinks, getFeatured } from '@/lib/db';
import { FEATURED_LIMIT } from '@/lib/constants';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** GET /api/featured – videoclipurile recomandate (is_featured = 1). */
export async function GET() {
  try {
    const featured = await getFeatured(FEATURED_LIMIT);
    const withLinks = await attachContextualLinks(featured);
    return Response.json(
      { videos: withLinks },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare interna';
    return Response.json({ error: message }, { status: 500 });
  }
}
