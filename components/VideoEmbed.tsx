'use client';

import { useEffect, useRef, useState } from 'react';
import { YOUTUBE_EMBED_BASE, youtubeThumb } from '@/lib/constants';
import { commandPlayer, listenPlayer } from '@/lib/youtube-messages';
import { getProgress } from '@/lib/client-storage';

/**
 * Player YouTube lazy + inteligent (v43prov2):
 * - iframe youtube-nocookie cu enablejsapi (zero cost API)
 * - reia de unde ai rămas (progres salvat local)
 * - expune timpul curent (capitole, mini-player, progres) prin evenimente
 * - acceptă comenzi seek/play/pause din alte componente
 */
export default function VideoEmbed({
  youtubeId,
  title,
  thumbnailUrl,
}: {
  youtubeId: string;
  title: string;
  thumbnailUrl?: string | null;
}) {
  const [active, setActive] = useState(false);
  const [startSeconds, setStartSeconds] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const thumb = thumbnailUrl ?? youtubeThumb(youtubeId);

  const activate = () => {
    const progress = getProgress(youtubeId);
    if (progress && progress.duration > 10) {
      const pct = progress.current / progress.duration;
      if (pct > 0.03 && pct < 0.97) setStartSeconds(Math.floor(progress.current));
    }
    setActive(true);
  };

  // raportare stare + comenzi din alte componente
  useEffect(() => {
    if (!active) return;

    const stop = listenPlayer(iframeRef.current, (state) => {
      window.dispatchEvent(
        new CustomEvent('caro:player-time', {
          detail: {
            youtubeId,
            currentTime: state.currentTime,
            duration: state.duration,
            playerState: state.playerState,
          },
        }),
      );
    });

    const onCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.youtubeId === youtubeId && detail.func) {
        commandPlayer(iframeRef.current, detail.func, detail.args ?? []);
      }
    };
    window.addEventListener('caro:command', onCommand);

    return () => {
      stop();
      window.removeEventListener('caro:command', onCommand);
    };
  }, [active, youtubeId]);

  if (active) {
    return (
      <div
        id="caro-player"
        className="relative aspect-video w-full overflow-hidden rounded-xl border border-neon-cyan/30 shadow-neon-cyan"
      >
        <iframe
          ref={iframeRef}
          src={`${YOUTUBE_EMBED_BASE}${youtubeId}?autoplay=1&rel=0&enablejsapi=1${startSeconds ? `&start=${startSeconds}` : ''}&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <div
      id="caro-player"
      className="group relative aspect-video w-full overflow-hidden rounded-xl border border-neon-cyan/30 shadow-neon-cyan"
    >
      <img
        src={thumb}
        alt={title}
        width={1280}
        height={720}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-void/70 via-void/10 to-transparent" />

      <button
        type="button"
        onClick={activate}
        aria-label={`Redă videoclipul: ${title}`}
        className="absolute inset-0 grid place-items-center"
      >
        <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-neon-cyan/70 bg-void/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-neon-pink group-hover:shadow-neon-pink">
          <span className="play-triangle" aria-hidden="true" />
        </span>
      </button>

      <a
        href={`https://www.youtube.com/watch?v=${youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 rounded-md border border-white/10 bg-void/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted backdrop-blur-sm transition-colors hover:text-neon-cyan"
      >
        Vezi pe YouTube ↗
      </a>
    </div>
  );
}
