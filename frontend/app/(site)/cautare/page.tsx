import type { Metadata } from 'next';
import { attachContextualLinks, searchVideos } from '@/lib/db';
import { searchMetadata } from '@/lib/seo';
import { PAGE_SIZE, getDurationFilter, isSortKey } from '@/lib/constants';
import VideoGrid from '@/components/VideoGrid';
import Reveal from '@/components/Reveal';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  sort?: string;
  duration?: string;
  page?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  return searchMetadata(sp.q);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? '').trim();

  const sortParam = sp.sort ?? '';
  const sort = isSortKey(sortParam) ? sortParam : 'newest';
  const durFilter = getDurationFilter(sp.duration ?? '');
  const page = Math.max(Number(sp.page ?? 1) || 1, 1);

  let result;
  if (query) {
    result = await searchVideos({
      q: query,
      sort,
      minSeconds: durFilter?.minSeconds,
      maxSeconds: durFilter?.maxSeconds,
      page,
      perPage: PAGE_SIZE,
    });
  } else {
    result = { videos: [], total: 0, page: 1, perPage: PAGE_SIZE, totalPages: 1 };
  }
  const withLinks = await attachContextualLinks(result.videos);

  const baseParams: Record<string, string> = { q: query };
  if (sp.sort && sort !== 'newest') baseParams.sort = sort;
  if (sp.duration) baseParams.duration = sp.duration;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Reveal>
        <form
          action="/cautare"
          method="get"
          className="glass hud-corners mx-auto flex max-w-2xl items-center gap-3 rounded-xl p-3"
        >
          <span className="pl-2 font-orbitron text-xl text-neon-cyan" aria-hidden="true">
            ⌕
          </span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Caută videoclipuri, produse, tehnici…"
            aria-label="Caută videoclipuri"
            className="flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-ink-faint"
          />
          <button type="submit" className="btn-neon btn-neon-cyan !px-4 !py-2 text-[10px]">
            Caută
          </button>
        </form>
      </Reveal>

      {query ? (
        <>
          <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="section-heading neon-cyan">
              Rezultate pentru „{query}”
            </h1>
            <p className="text-sm text-ink-muted">
              {result.total} videoclipuri găsite
            </p>
          </div>

          {result.total > 0 ? (
            <>
              <div className="mt-6">
                <FilterBar sort={sort} duration={sp.duration ?? ''} baseParams={baseParams} />
              </div>
              <div className="mt-8">
                <VideoGrid videos={withLinks} />
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} baseParams={baseParams} />
            </>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon="🔍"
                title="Niciun rezultat"
                text={`Nu am găsit nimic pentru „${query}”. Încearcă alt cuvânt (ex: „coating”, „microfibra”, „polish”).`}
                actionHref="/cautare"
                actionLabel="Nouă căutare"
              />
            </div>
          )}
        </>
      ) : (
        <div className="mt-16 text-center">
          <p className="font-orbitron text-2xl font-black uppercase tracking-widest text-ink-faint">
            Începe o căutare
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Tastează un produs, o tehnică sau un canal — ex: „coating”, „microfibra”, „polish”.
          </p>
          <p className="mt-6 font-orbitron text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            Sfat: apasă Ctrl+K oriunde pe site
          </p>
        </div>
      )}
    </div>
  );
}
