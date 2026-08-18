import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { attachContextualLinks, getCategoryBySlug, listVideos, parseFaq } from '@/lib/db';
import { breadcrumbJsonLd, categoryMetadata, faqJsonLd, itemListJsonLd } from '@/lib/seo';
import { PAGE_SIZE, categoryAccent, getDurationFilter, isSortKey } from '@/lib/constants';
import VideoGrid from '@/components/VideoGrid';
import BannerCleanX from '@/components/BannerCleanX';
import FaqAccordion from '@/components/FaqAccordion';
import Reveal from '@/components/Reveal';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface SearchParams {
  sort?: string;
  duration?: string;
  page?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return categoryMetadata(category);
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sortParam = sp.sort ?? '';
  const sort = isSortKey(sortParam) ? sortParam : 'newest';
  const durFilter = getDurationFilter(sp.duration ?? '');
  const page = Math.max(Number(sp.page ?? 1) || 1, 1);

  const result = await listVideos({
    category: category.slug,
    sort,
    minSeconds: durFilter?.minSeconds,
    maxSeconds: durFilter?.maxSeconds,
    page,
    perPage: PAGE_SIZE,
  });
  const withLinks = await attachContextualLinks(result.videos);

  const accent = categoryAccent(category.slug, category.accent);
  const faq = parseFaq(category.faq_json);

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Acasă', path: '/' },
    { name: category.name, path: `/category/${category.slug}` },
  ]);

  const itemList = itemListJsonLd(
    withLinks.map((v) => ({ name: v.title, url: `/video/${v.youtube_id}` })),
  );

  const faqSchema = faq.length ? faqJsonLd(faq, `/category/${category.slug}`) : null;

  const firstHalf = withLinks.slice(0, 6);
  const secondHalf = withLinks.slice(6);

  // parametrii pe care ii pastreaza filtrele si paginarea
  const baseParams: Record<string, string> = {};
  if (sp.sort && sort !== 'newest') baseParams.sort = sort;
  if (sp.duration) baseParams.duration = sp.duration;

  return (
    <>
      {/* Breadcrumb vizual */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
          <li>
            <Link href="/" className="transition-colors hover:text-neon-cyan">
              Acasă
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li style={{ color: accent }}>{category.name}</li>
        </ol>
      </nav>

      {/* Header categorie */}
      <section
        className="relative overflow-hidden border-y bg-void2/60"
        style={{ borderColor: `${accent}26` }}
      >
        <div className="cyber-grid absolute inset-0" aria-hidden="true" />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 20% 50%, ${accent}14, transparent 70%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Reveal>
            <p
              className="font-orbitron text-[11px] font-bold uppercase tracking-[0.35em]"
              style={{ color: accent }}
            >
              {category.icon ?? '▸'} Categorie
            </p>
            <h1 className="mt-3 font-orbitron text-3xl font-black uppercase tracking-tight sm:text-5xl">
              <span className="neon-gradient-text">{category.name}</span>
            </h1>
            {category.description ? (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted sm:text-base">
                {category.description}
              </p>
            ) : null}
            <p
              className="mt-5 font-orbitron text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {result.total} videoclipuri în această categorie
            </p>
          </Reveal>
        </div>
      </section>

      {/* Video-uri */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {result.total > 0 ? (
          <>
            <FilterBar sort={sort} duration={sp.duration ?? ''} baseParams={baseParams} />

            <div className="mt-8">
              <VideoGrid videos={firstHalf} />
            </div>

            <div className="mt-6">
              <BannerCleanX
                variant="inline"
                title={`Produse: ${category.name}`}
                text={`Vezi toate produsele din categoria ${category.name} direct pe CleanX.ro – magazinul partener CARO.TV.`}
              />
            </div>

            <div className="mt-6">
              <VideoGrid videos={secondHalf} />
            </div>

            <Pagination page={result.page} totalPages={result.totalPages} baseParams={baseParams} />

            {/* FAQ premium (doar daca exista faq_json in D1) */}
            {faq.length ? (
              <Reveal>
                <section className="mt-16">
                  <h2 className="section-heading neon-violet">Întrebări frecvente</h2>
                  <div className="mt-6 max-w-3xl">
                    <FaqAccordion faq={faq} />
                  </div>
                </section>
              </Reveal>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={category.icon ?? '🛰️'}
            title="Această categorie este goală"
            text="Videoclipurile apar automat după ce administratorul adaugă playlist-ul YouTube al categoriei."
            actionHref="/"
            actionLabel="Înapoi la categorii"
          />
        )}
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      ) : null}
    </>
  );
}
