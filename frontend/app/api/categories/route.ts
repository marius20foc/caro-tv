import { listCategories } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** GET /api/categories – lista categoriilor cu numar de videoclipuri. */
export async function GET() {
  try {
    const categories = await listCategories();
    return Response.json(
      { categories },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare interna';
    return Response.json({ error: message }, { status: 500 });
  }
}
