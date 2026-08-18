/**
 * Titlu de sectiune HUD cu accent neon.
 */
export default function SectionHeading({
  children,
  accent = 'cyan',
  className = '',
}: {
  children: React.ReactNode;
  accent?: 'cyan' | 'violet' | 'pink';
  className?: string;
}) {
  const accentClass =
    accent === 'violet' ? 'neon-violet' : accent === 'pink' ? 'neon-pink' : 'neon-cyan';

  return (
    <h2 className={`section-heading ${accentClass} ${className}`}>
      <span aria-hidden="true" className="hidden sm:inline">
        ▸
      </span>
      {children}
    </h2>
  );
}
