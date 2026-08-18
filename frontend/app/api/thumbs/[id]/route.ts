import { getRequestContext } from '@cloudflare/next-on-pages';
import { youtubeThumb } from '@/lib/constants';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/thumbs/:youtubeId.jpg
 * Serveste thumbnail-ul din cache-ul R2 (daca exista binding-ul THUMBS
 * si cron-ul a cache-uit imaginile); altfel redirecteaza la YouTube.
 * Zero cost YouTube API – este doar un proxy de imagine.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const youtubeId = (id ?? '').replace(/\.jpg$/, '');

  if (!/^[\w-]{6,20}$/.test(youtubeId)) {
    return new Response('Invalid', { status: 400 });
  }

  try {
    const env = getRequestContext().env as unknown as CloudflareEnv;
    const bucket = env.THUMBS;
    if (bucket) {
      const object = await bucket.get(`thumbs/${youtubeId}.jpg`);
      if (object) {
        const bytes = await object.arrayBuffer();
        return new Response(bytes, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            ETag: object.httpEtag,
          },
        });
      }
    }
  } catch {
    /* R2 indisponibil – folosim direct YouTube */
  }

  return Response.redirect(youtubeThumb(youtubeId), 302);
}
