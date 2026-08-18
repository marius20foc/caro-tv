'use client';

import { useEffect, useState } from 'react';
import { getProgressPct } from '@/lib/client-storage';

interface MiniProps {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
}

/**
 * Mini-player sticky: apare cand player-ul principal iese din viewport.
 * Arata titlul, progresul si butoane: reia/continua (scroll la player) + play/pause.
 */
export default function MiniPlayer({ youtubeId, title, thumbnailUrl }: MiniProps) {
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const player = document.getElementById('caro-player');
    if (!player) return;

    const onScroll = () => {
      const rect = player.getBoundingClientRect();
      setVisible(rect.bottom < 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onTime = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.youtubeId !== youtubeId) return;
      setPlaying(detail.playerState === 1);
      if (detail.duration) setPct(Math.min(detail.currentTime / detail.duration, 1));
    };
    window.addEventListener('caro:player-time', onTime);
    return () => window.removeEventListener('caro:player-time', onTime);
  }, [youtubeId]);

  useEffect(() => {
    setPct(getProgressPct(youtubeId));
  }, [youtubeId]);

  if (!visible) return null;

  const command = (func: string) =>
    window.dispatchEvent(
      new CustomEvent('caro:command', { detail: { youtubeId, func, args: [] } }),
    );

  return (
    <div className="glass-strong fixed inset-x-0 bottom-14 z-40 border-t border-neon-cyan/30 md:bottom-0">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2">
        <button
          type="button"
          onClick={() =>
            document.getElementById('caro-player')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden="true"
            width={88}
            height={50}
            className="h-12 w-20 shrink-0 rounded object-cover"
          />
          <span className="min-w-0">
            <span className="line-clamp-1 block text-sm font-semibold text-ink">{title}</span>
            <span className="mt-1 block h-1 w-full overflow-hidden rounded bg-void3">
              <span
                className="block h-full bg-neon-cyan"
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => command(playing ? 'pauseVideo' : 'playVideo')}
          aria-label={playing ? 'Pauză' : 'Redă'}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neon-cyan/50 text-neon-cyan transition-colors hover:bg-neon-cyan/10"
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <button
          type="button"
          onClick={() =>
            document.getElementById('caro-player')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          className="shrink-0 font-orbitron text-[10px] font-bold uppercase tracking-wider text-ink-muted transition-colors hover:text-neon-cyan"
        >
          ↑ La player
        </button>
      </div>
    </div>
  );
}
