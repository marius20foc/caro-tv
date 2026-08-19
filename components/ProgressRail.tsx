'use client';

import { useEffect, useState } from 'react';
import { getProgressPct } from '@/lib/client-storage';
import { categoryAccent } from '@/lib/constants';

/**
 * Bara de progres a vizionării, suprapusă pe thumbnail-ul cardului.
 * (stil YouTube: „ai văzut 40% din acest video”)
 */
export default function ProgressRail({
  youtubeId,
  accent,
}: {
  youtubeId: string;
  accent: string;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => setPct(getProgressPct(youtubeId));
    update();
    window.addEventListener('caro:progress-changed', update);
    return () => window.removeEventListener('caro:progress-changed', update);
  }, [youtubeId]);

  if (pct <= 0) return null;

  return (
    <span className="absolute bottom-0 left-0 right-0 h-1 bg-void/70" aria-hidden="true">
      <span
        className="block h-full"
        style={{ width: `${Math.round(pct * 100)}%`, background: accent, boxShadow: `0 0 6px ${accent}` }}
      />
    </span>
  );
}
