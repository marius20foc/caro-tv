import Link from 'next/link';
import type { VideoWithCategory } from '@/lib/db';
import type { ContextualLink } from '@/lib/productMapper';
import { formatDate, formatDuration, formatViewsCompact } from '@/lib/seo';
import { categoryAccent, youtubeThumb } from '@/lib/constants';
import TiltCard from './TiltCard';
import ProgressRail from './ProgressRail';
import FavoriteButton from './FavoriteButton';

/**
 * Card video v3: tilt 3D, durata, accent per categorie, bara de progres
 * a vizionării, buton de favorite, link contextual CleanX.
 */
export default function VideoCard({
  video,
  link,
  eager = false,
}: {
  video: VideoWithCategory;
  link: ContextualLink | null;
  eager?: boolean;
}) {
  const href = `/video/${video.youtube_id}`;
  const thumb = video.thumbnail_url ?? youtubeThumb(video.youtube_id);
  const accent = categoryAccent(video.category_slug, video.category_accent);

  return (
    <TiltCard max={5} className="h-full">
      <article
        className="glass hud-corners group flex h-full flex-col overflow-hidden rounded-xl"
        style={{ borderColor: `${accent}33` }}
      >
        <Link href={href} className="chromatic relative block aspect-video overflow-hidden" tabIndex={-1}>
          <img
            src={thumb}
            alt={video.title}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            width={480}
            height={270}
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />
          <span
            className="absolute bottom-2 left-3 flex items-center gap-2 font-orbitron text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: accent }}
          >
            <span aria-hidden="true">▶</span> {video.category_name ?? 'Detailing'}
          </span>
          {video.duration ? (
            <span className="absolute right-2 top-2 rounded bg-void/80 px-2 py-0.5 font-orbitron text-[10px] font-bold tracking-wider text-ink backdrop-blur-sm">
              {formatDuration(video.duration)}
            </span>
          ) : null}
          <ProgressRail youtubeId={video.youtube_id} accent={accent} />
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 flex-1 font-space text-base font-semibold leading-snug">
              <Link href={href} className="transition-colors hover:text-neon-cyan">
                {video.title}
              </Link>
            </h3>
            <FavoriteButton youtubeId={video.youtube_id} className="!px-2 !py-1.5 !text-[10px] shrink-0" />
          </div>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
            <span>{video.channel_title ?? 'YouTube'}</span>
            <span aria-hidden="true">•</span>
            <span>{formatViewsCompact(video.views)} vizualizări</span>
            <span aria-hidden="true">•</span>
            <time dateTime={video.published_at ?? undefined}>{formatDate(video.published_at)}</time>
          </p>

          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <Link
              href={href}
              className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted transition-colors hover:text-neon-cyan"
            >
              Vezi video →
            </Link>
            {link ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-neon btn-neon-pink !px-3 !py-1.5 text-[9px]"
              >
                {link.label}
              </a>
            ) : null}
          </div>
        </div>
      </article>
    </TiltCard>
  );
}
