'use client';

import { useEffect, useState } from 'react';

/** Buton „Înapoi sus” – apare după scroll. */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Înapoi sus"
      className="glass-strong hud-corners fixed bottom-24 right-4 z-40 grid h-11 w-11 place-items-center rounded-lg font-orbitron text-lg text-neon-cyan transition-transform hover:-translate-y-1 md:bottom-6"
    >
      ↑
    </button>
  );
}
