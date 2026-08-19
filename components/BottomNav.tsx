'use client';

import Link from 'next/link';
import SearchTrigger from './SearchTrigger';

/**
 * Navigație de jos pentru mobil (pattern clasic de aplicație).
 */
export default function BottomNav() {
  const itemClass =
    'flex flex-1 flex-col items-center gap-0.5 py-2.5 font-orbitron text-[9px] font-bold uppercase tracking-[0.15em] text-ink-muted transition-colors hover:text-neon-cyan';

  return (
    <nav
      className="glass-strong fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-neon-cyan/20 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navigație mobilă"
    >
      <Link href="/" className={itemClass}>
        <span aria-hidden="true" className="text-base leading-none">⌂</span>
        <span>Acasă</span>
      </Link>
      <Link href="/#categorii" className={itemClass}>
        <span aria-hidden="true" className="text-base leading-none">▦</span>
        <span>Categorii</span>
      </Link>
      <SearchTrigger className={itemClass}>
        <span aria-hidden="true" className="text-base leading-none">⌕</span>
        <span>Căutare</span>
      </SearchTrigger>
      <Link href="/contact" className={itemClass}>
        <span aria-hidden="true" className="text-base leading-none">✉</span>
        <span>Contact</span>
      </Link>
    </nav>
  );
}
