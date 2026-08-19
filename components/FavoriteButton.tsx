'use client';

import { useEffect, useState } from 'react';
import { isFavorite, onFavoritesChanged, toggleFavorite } from '@/lib/client-storage';

/**
 * Buton de favorite (inima) – salvare locală, sincronizat între componente.
 */
export default function FavoriteButton({
  youtubeId,
  className = '',
}: {
  youtubeId: string;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  const [hint, setHint] = useState('');

  useEffect(() => {
    setActive(isFavorite(youtubeId));
    return onFavoritesChanged(() => setActive(isFavorite(youtubeId)));
  }, [youtubeId]);

  const onClick = () => {
    const nowActive = toggleFavorite(youtubeId);
    setActive(nowActive);
    setHint(nowActive ? 'Salvat ✓' : 'Șters');
    window.setTimeout(() => setHint(''), 1600);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? 'Șterge din favorite' : 'Adaugă la favorite'}
      title={active ? 'Șterge din favorite' : 'Adaugă la favorite'}
      className={`relative rounded-md border px-3 py-2 font-orbitron text-xs transition-all ${className} ${
        active
          ? 'border-neon-pink/60 text-neon-pink'
          : 'border-white/10 text-ink-muted hover:border-neon-pink/40 hover:text-neon-pink'
      }`}
    >
      {active ? '♥' : '♡'}
      <span className="ml-1 hidden sm:inline">Favorit</span>
      {hint ? (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-neon-cyan">
          {hint}
        </span>
      ) : null}
    </button>
  );
}
