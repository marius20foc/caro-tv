'use client';

import { useEffect, useState } from 'react';
import { CLEANX_HOME, POPUP_DELAY_MS } from '@/lib/constants';

/**
 * Popup CleanX – UNICA exceptie care trimite la https://cleanx.ro (home).
 * Apare la 10–15 secunde SAU la exit-intent (mouse parasesc pagina).
 * Se afiseaza o singura data per sesiune de navigare.
 */
export default function PopupCleanX() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const KEY = 'caro_cleanx_popup_seen';
    if (typeof window === 'undefined') return;

    const shown = () => {
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* storage indisponibil – ignoram */
      }
      setOpen(true);
    };

    const timer = window.setTimeout(shown, POPUP_DELAY_MS);

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        window.clearTimeout(timer);
        shown();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="popup-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="CleanX.ro – magazinul partener"
    >
      <div className="popup-card glass-strong hud-corners relative w-full max-w-md rounded-xl p-8 text-center">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Închide popup-ul"
          className="absolute right-4 top-3 text-2xl leading-none text-ink-muted transition-colors hover:text-neon-pink"
        >
          ×
        </button>

        <p className="font-orbitron text-xs font-bold uppercase tracking-[0.3em] text-neon-cyan">
          ◤ CleanX.ro ◢
        </p>
        <h2 className="mt-4 font-orbitron text-2xl font-black uppercase leading-tight text-ink">
          Detailing auto la nivel de <span className="neon-pink">profesionist</span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Prosoape microfibra, protectii ceramice, fibra carbon și tot arsenalul de detailing –
          direct de la magazinul partener.
        </p>

        <a
          href={CLEANX_HOME}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-neon btn-neon-pink mt-6 w-full"
        >
          Vizitează CleanX.ro →
        </a>
        <p className="mt-4 text-[11px] uppercase tracking-widest text-ink-faint">
          oferta dedicata cititorilor CARO.TV
        </p>
      </div>
    </div>
  );
}
