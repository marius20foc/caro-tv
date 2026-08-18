/**
 * Aurora / nebula – fundal animat premium (CSS-only) + noise overlay.
 * Componenta server; fara JavaScript.
 */
export default function AuroraBackground() {
  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <div className="noise-overlay pointer-events-none fixed inset-0 z-[4]" aria-hidden="true" />
    </>
  );
}
