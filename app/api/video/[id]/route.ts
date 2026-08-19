import { getRelatedVideos, getVideoWithContext } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** GET /api/video/:youtubeId – detaliu video + link contextual + similare. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { video, link } = await getVideoWithContext(id);
    if (!video) {
      return Response.json({ error: 'Video negasit' }, { status: 404 });
    }

    const related = await getRelatedVideos(video.category_slug, video.youtube_id, video.channel_id, 6);

    return Response.json(
      { video: { ...video, contextualLink: link }, related },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare interna';
    return Response.json({ error: message }, { status: 500 });
  }
}
