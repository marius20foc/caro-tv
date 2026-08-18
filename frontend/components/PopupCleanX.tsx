'use client';

import { useEffect, useState } from 'react';
import { CLEANX_HOME, POPUP_DELAY_MS } from '@/lib/constants';

/**
 * Popup CleanX – UNICA exceptie care trimite la https://cleanx.ro (home).
 *
 * GARANTII DE AFISARE (dublu sistem):
 *   1. localStorage  – se afiseaza MAXIM O DATA la 24 de ore (chiar si
 *                      dupa ce utilizatorul inchide popup-ul sau navigheaza).
 *   2. sessionStorage – fallback: daca localStorage e indisponibil
 *                      (ex: mod privat), se afiseaza maxim o data pe sesiune.
 *
 * Verificarea se face INAINTE de a programa timer-ul, deci daca popup-ul
 * s-a afisat deja azi, NU se mai programeaza nimic (zero deranj).
 */
export default function PopupCleanX() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const LAST_KEY = 'caro_cleanx_popup_last';
    const SESSION_KEY = 'caro_cleanx_popup_session';
    const DAY_MS = 24 * 60 * 60 * 1000;

    // ---- GARDA 1: o singura data per sesiune (fallback sigur) ----
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return;
    } catch {
      /* sessionStorage indisponibil – trecem la garda 2 */
    }

    // ---- GARDA 2: o singura data la 24 de ore ----
    try {
      const raw = window.localStorage.getItem(LAST_KEY);
      const last = raw ? Number(raw) : 0;
      if (Number.isFinite(last) && last > 0 && Date.now() - last < DAY_MS) return;
    } catch {
      /* localStorage indisponibil – afisam o data pe sesiune (garda 1) */
    }

    // ---- Afisare: inregistram INAINTE de a deschide ----
    let shown = false;
    const show = () => {
      if (shown) return; // niciodata de doua ori in acelasi mount
      shown = true;
      try {
        window.localStorage.setItem(LAST_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
      setOpen(true);
    };

    // 1) timer 10-15s
    const timer = window.setTimeout(show, POPUP_DELAY_MS);

    // 2) exit-intent (mouse paraseste fereastra in sus)
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        window.clearTimeout(timer);
        show();
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
