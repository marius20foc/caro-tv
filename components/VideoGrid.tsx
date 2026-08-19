import VideoCard from './VideoCard';
import type { VideoWithLink } from '@/lib/db';

/**
 * Grid masonry (CSS columns) de carduri video, cu linkuri contextuale
 * deja rezolvate pe server (regula de linkuire CleanX).
 */
export default function VideoGrid({
  videos,
  className = 'masonry columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
}: {
  videos: VideoWithLink[];
  className?: string;
}) {
  if (!videos.length) {
    return (
      <p className="rounded-xl border border-dashed border-neon-cyan/25 p-10 text-center text-sm text-ink-muted">
        Nicio înregistrare disponibilă încă. Reveniți curând.
      </p>
    );
  }

  return (
    <div className={className}>
      {videos.map((video) => (
        <VideoCard key={video.youtube_id} video={video} link={video.contextualLink} />
      ))}
    </div>
  );
}
