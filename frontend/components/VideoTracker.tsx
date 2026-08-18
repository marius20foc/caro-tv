'use client';

import { useEffect, useRef } from 'react';
import { pushHistory, setProgress } from '@/lib/client-storage';

/**
 * Tracker invizibil: salvează progresul vizionării (local, throttled)
 * și adaugă videoclipul în istoric („Continuă vizionarea”).
 * Zero cost de API – datele rămân în browserul utilizatorului.
 */
export default function VideoTracker({
  youtubeId,
  title,
  thumbnailUrl,
  categorySlug,
}: {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  categorySlug: string;
}) {
  const lastSave = useRef(0);
  const pushed = useRef(false);

  useEffect(() => {
    const onTime = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.youtubeId !== youtubeId || !detail.duration) return;

      if (!pushed.current) {
        pushed.current = true;
        pushHistory({
          youtube_id: youtubeId,
          title,
          thumbnail_url: thumbnailUrl,
          category_slug: categorySlug,
          watchedAt: Date.now(),
        });
      }

      const now = Date.now();
      if (now - lastSave.current > 5000) {
        lastSave.current = now;
        setProgress(youtubeId, detail.currentTime, detail.duration);
      }
    };

    window.addEventListener('caro:player-time', onTime);
    return () => window.removeEventListener('caro:player-time', onTime);
  }, [youtubeId, title, thumbnailUrl, categorySlug]);

  return null;
}
