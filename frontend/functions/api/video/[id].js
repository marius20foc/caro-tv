import { getRelatedVideos, getVideoWithContext } from '../../_lib/db.js';

/** GET /api/video/:youtubeId (Pages Functions) */
export async function onRequestGet(context) {
  const { env } = context;
  const youtubeId = context.params.id;
  try {
    const { video, link } = await getVideoWithContext(env, youtubeId);
    if (!video) {
      return Response.json({ error: 'Video negasit' }, { status: 404 });
    }
    const related = await getRelatedVideos(env, video.category_slug, video.youtube_id, 6);
    return Response.json(
      { video: { ...video, contextualLink: link }, related },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}
