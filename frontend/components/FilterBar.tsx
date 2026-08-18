import Link from 'next/link';
import { DURATION_FILTERS, SORT_OPTIONS, isSortKey } from '@/lib/constants';

/**
 * Bara de filtre + sortare (clasic, URL-params, SEO-friendly).
 * Form GET -> pagina se re-randeaza server-side cu noile filtre.
 */
export default function FilterBar({
  sort,
  duration,
  baseParams,
}: {
  sort: string;
  duration: string;
  baseParams: Record<string, string>;
}) {
  const currentSort = isSortKey(sort) ? sort : 'newest';

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(baseParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  return (
    <div className="glass flex flex-wrap items-center gap-3 rounded-xl p-3">
      {/* Sortare */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sortare">
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildHref({ sort: opt.value === 'newest' ? undefined : opt.value, page: undefined })}
            aria-current={currentSort === opt.value ? 'true' : undefined}
            className={`rounded-md px-3 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
              currentSort === opt.value
                ? 'bg-neon-cyan/15 text-neon-cyan'
                : 'text-ink-muted hover:text-neon-cyan'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <span className="hidden h-5 w-px bg-white/10 sm:block" aria-hidden="true" />

      {/* Filtru durată */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Durată">
        {DURATION_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={buildHref({ duration: f.value || undefined, page: undefined })}
            aria-current={duration === f.value ? 'true' : undefined}
            className={`rounded-md px-3 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
              duration === f.value
                ? 'bg-neon-violet/20 text-neon-violet'
                : 'text-ink-muted hover:text-neon-violet'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
