'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHistory, getProgressPct, type HistoryItem } from '@/lib/client-storage';

/**
 * Raft „Continuă vizionarea” – istoricul local al utilizatorului.
 * Apare doar dacă există videoclipuri începute. Zero cost server.
 */
export default function ContinueWatching() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const load = () => {
      const history = getHistory();
      // păstrăm doar videoclipurile cu progres între 3% și 97%
      const withProgress = history
        .map((h) => ({ item: h, pct: getProgressPct(h.youtube_id) }))
        .filter((e) => e.pct > 0);
      setItems(withProgress.slice(0, 8).map((e) => e.item));
    };
    load();
    const onChanged = () => {
      load();
      forceUpdate((n) => n + 1);
    };
    window.addEventListener('caro:history-changed', onChanged);
    window.addEventListener('caro:progress-changed', onChanged);
    return () => {
      window.removeEventListener('caro:history-changed', onChanged);
      window.removeEventListener('caro:progress-changed', onChanged);
    };
  }, []);

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-label="Continuă vizionarea">
      <h2 className="section-heading neon-cyan">Continuă vizionarea</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((h) => (
          <Link
            key={h.youtube_id}
            href={`/video/${h.youtube_id}`}
            className="glass card-lift group flex items-center gap-3 overflow-hidden rounded-xl p-3"
          >
            <img
              src={h.thumbnail_url}
              alt={h.title}
              loading="lazy"
              decoding="async"
              width={160}
              height={90}
              className="h-16 w-28 shrink-0 rounded-md object-cover"
            />
            <span className="min-w-0">
              <span className="line-clamp-2 block text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-neon-cyan">
                {h.title}
              </span>
              <span className="mt-1 block font-orbitron text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                ▶ Reia vizionarea
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
