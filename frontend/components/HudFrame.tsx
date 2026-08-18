'use client';

import { useEffect, useState } from 'react';

/**
 * HUD frame premium: colturi neon pe marginile viewport-ului +
 * bara de status cu data/ora live (stil cockpit).
 */
export default function HudFrame() {
  const [now, setNow] = useState('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNow(
        `${d.toLocaleTimeString('ro-RO', { hour12: false })} · ${d.toLocaleDateString('ro-RO')}`,
      );
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div aria-hidden="true">
      <span className="hud-frame-corner hud-tl hidden sm:block" />
      <span className="hud-frame-corner hud-tr hidden sm:block" />
      <span className="hud-frame-corner hud-bl hidden sm:block" />
      <span className="hud-frame-corner hud-br hidden sm:block" />
      <div className="hud-status hidden font-orbitron text-[10px] font-semibold uppercase tracking-[0.3em] text-ink-faint/70 md:block">
        {now} · CARO.TV <span className="neon-cyan">// ONLINE</span>
      </div>
    </div>
  );
}
