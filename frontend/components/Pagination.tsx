import Link from 'next/link';

/**
 * Paginare numerotată clasică – păstrează parametrii din URL.
 */
export default function Pagination({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  baseParams: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (target: number) => {
    const params = new URLSearchParams(baseParams);
    if (target > 1) params.set('page', String(target));
    else params.delete('page');
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Paginare">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          rel="prev"
          className="glass rounded-md px-3 py-2 font-orbitron text-[10px] font-bold uppercase tracking-wider text-ink-muted transition-colors hover:text-neon-cyan"
        >
          ← Înapoi
        </Link>
      ) : null}

      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`grid h-9 w-9 place-items-center rounded-md font-orbitron text-xs font-bold transition-colors ${
            p === page
              ? 'bg-neon-cyan/15 text-neon-cyan shadow-glow-sm'
              : 'glass text-ink-muted hover:text-neon-cyan'
          }`}
        >
          {p}
        </Link>
      ))}

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          rel="next"
          className="glass rounded-md px-3 py-2 font-orbitron text-[10px] font-bold uppercase tracking-wider text-ink-muted transition-colors hover:text-neon-cyan"
        >
          Înainte →
        </Link>
      ) : null}
    </nav>
  );
}
