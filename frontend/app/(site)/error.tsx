'use client';

import Link from 'next/link';

/**
 * Error boundary global – afiseaza o eroare neon eleganta
 * cu optiunea de reincarcare.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-orbitron text-[11px] font-bold uppercase tracking-[0.4em] text-neon-pink animate-flicker">
        ◤ EROARE SISTEM ◢
      </p>
      <h1 className="mt-6 font-orbitron text-4xl font-black uppercase tracking-tight sm:text-6xl">
        <span className="neon-gradient-text">Semnat pierdut</span>
      </h1>
      <p className="mt-6 max-w-md text-balance text-base leading-relaxed text-ink-muted">
        A apărut o defecțiune în matrice. Încearcă să reinițializezi legătura sau întoarce-te în
        spațiul sigur.
      </p>
      <p className="mt-4 max-w-md truncate font-mono text-xs text-ink-faint">
        {error.digest ? `ref: ${error.digest}` : 'ref: necunoscută'}
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={reset} className="btn-neon btn-neon-cyan">
          ↻ Reîncearcă
        </button>
        <Link href="/" className="btn-neon btn-neon-violet">
          ← Acasă
        </Link>
      </div>
    </div>
  );
}
