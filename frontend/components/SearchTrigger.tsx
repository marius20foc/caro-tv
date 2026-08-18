'use client';

/**
 * Buton care deschide fereastra globala de cautare (Ctrl+K).
 * Trimite un CustomEvent catre SearchModal.
 */
export default function SearchTrigger({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent('caro:open-search'))}
      aria-label="Deschide căutarea (Ctrl+K)"
      title="Ctrl+K"
    >
      <span aria-hidden="true">⌕</span>
      {children ?? <span className="hidden lg:inline">Căutare</span>}
    </button>
  );
}
