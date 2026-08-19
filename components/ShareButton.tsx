'use client';

import { useState } from 'react';

/**
 * Buton de share: copiază linkul în clipboard sau deschide
 * meniul nativ de share (mobil). Feedback inline, fără toast global.
 */
export default function ShareButton({
  url,
  title,
  className = '',
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');

  const share = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        setState('done');
      } catch {
        /* utilizatorul a anulat – ignoram */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setState('done');
    } catch {
      setState('error');
    }
    window.setTimeout(() => setState('idle'), 1800);
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Distribuie videoclipul"
      title="Distribuie"
      className={`rounded-md border border-white/10 px-3 py-2 font-orbitron text-xs text-ink-muted transition-all hover:border-neon-cyan/40 hover:text-neon-cyan ${className}`}
    >
      {state === 'done' ? 'Link copiat ✓' : state === 'error' ? 'Eroare ✗' : '↗ Distribuie'}
    </button>
  );
}
