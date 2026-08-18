/**
 * Ticker marquee – banda orizontala infinita (CSS animation).
 * Copiaza continutul (aria-hidden) pentru bucla continua.
 */
export default function TickerMarquee({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="ticker-track">
        <div className="flex shrink-0 items-center gap-10 pr-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
