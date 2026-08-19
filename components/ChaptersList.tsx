'use client';

import { useEffect, useMemo, useState } from 'react';

export interface Chapter {
  seconds: number;
  label: string;
}

/** Parseaza timestamps din descriere: linii de forma „0:00 Intro” / „MM:SS Titlu”. */
export function parseChapters(description: string | null | undefined): Chapter[] {
  if (!description) return [];
  const regex = /(?:^|\n)\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–|]?\s*([^\n]{2,80})/g;
  const out: Chapter[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(description)) !== null) {
    const parts = match[1].split(':').map(Number);
    const seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
    out.push({ seconds, label: match[2].trim() });
  }
  // doar daca avem macar 2 capitole si primul e aproape de 0
  return out.length >= 2 && out[0].seconds <= 60 ? out.slice(0, 24) : [];
}

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Lista de capitole – click = seek în player (postMessage, zero cost API).
 */
export default function ChaptersList({
  youtubeId,
  description,
  accent = '#00f0ff',
}: {
  youtubeId: string;
  description: string | null | undefined;
  accent?: string;
}) {
  const chapters = useMemo(() => parseChapters(description), [description]);
  const [active, setActive] = useState(-1);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const onTime = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.youtubeId !== youtubeId) return;
      setTime(detail.currentTime ?? 0);
    };
    window.addEventListener('caro:player-time', onTime);
    return () => window.removeEventListener('caro:player-time', onTime);
  }, [youtubeId]);

  useEffect(() => {
    let idx = -1;
    for (let i = 0; i < chapters.length; i++) {
      if (time >= chapters[i].seconds) idx = i;
    }
    setActive(idx);
  }, [time, chapters]);

  if (!chapters.length) return null;

  const seek = (seconds: number) =>
    window.dispatchEvent(
      new CustomEvent('caro:command', { detail: { youtubeId, func: 'seekTo', args: [seconds, true] } }),
    );

  return (
    <div className="glass rounded-xl p-4">
      <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.25em] text-neon-cyan">
        Capitole
      </h2>
      <ol className="mt-3 space-y-0.5">
        {chapters.map((ch, i) => {
          const isActive = i === active;
          return (
            <li key={ch.seconds}>
              <button
                type="button"
                onClick={() => seek(ch.seconds)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  isActive ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-ink-muted hover:bg-white/5 hover:text-ink'
                }`}
              >
                <span className="shrink-0 font-orbitron text-[11px] tabular-nums" style={{ color: isActive ? accent : undefined }}>
                  {fmt(ch.seconds)}
                </span>
                <span className="line-clamp-1 flex-1">{ch.label}</span>
                {isActive ? (
                  <span className="font-orbitron text-[9px] font-bold uppercase tracking-wider" style={{ color: accent }}>
                    ▶ acum
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
