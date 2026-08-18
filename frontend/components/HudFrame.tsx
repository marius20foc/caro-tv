'use client';

/**
 * HUD frame minimalist: doar colturile subtile de pe marginile
 * viewport-ului (fara bara de status cu data/ora).
 */
export default function HudFrame() {
  return (
    <div aria-hidden="true">
      <span className="hud-frame-corner hud-tl hidden sm:block" />
      <span className="hud-frame-corner hud-tr hidden sm:block" />
      <span className="hud-frame-corner hud-bl hidden sm:block" />
      <span className="hud-frame-corner hud-br hidden sm:block" />
    </div>
  );
}
