import Link from 'next/link';
import {
  attachContextualLinks,
  getFeatured,
  getStats,
  getTrending,
  listCategories,
  listVideos,
} from '@/lib/db';
import {
  CLEANX_HOME,
  FEATURED_LIMIT,
  SITE_NAME,
  TRENDING_LIMIT,
  categoryAccent,
} from '@/lib/constants';
import { formatViewsCompact, itemListJsonLd } from '@/lib/seo';
import VideoCard from '@/components/VideoCard';
import VideoGrid from '@/components/VideoGrid';
import CategoryCard from '@/components/CategoryCard';
import BannerCleanX from '@/components/BannerCleanX';
import SectionHeading from '@/components/SectionHeading';
import Reveal from '@/components/Reveal';
import TiltCard from '@/components/TiltCard';
import StatCounter from '@/components/StatCounter';
import ContinueWatching from '@/components/ContinueWatching';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, featured, trending, latest, stats] = await Promise.all([
    listCategories(),
    getFeatured(FEATURED_LIMIT),
    getTrending(TRENDING_LIMIT),
    listVideos({ page: 1, perPage: 12, sort: 'newest' }),
    getStats(),
  ]);

  const [featuredWithLinks, trendingWithLinks, latestWithLinks] = await Promise.all([
    attachContextualLinks(featured),
    attachContextualLinks(trending),
    attachContextualLinks(latest.videos),
  ]);

  const itemList = itemListJsonLd(
    featuredWithLinks.map((v) => ({ name: v.title, url: `/video/${v.youtube_id}` })),
  );

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero-scan cyber-grid relative overflow-hidden">
        <div
          className="orbit-ring pointer-events-none left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
        <div
          className="orbit-ring pointer-events-none left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 opacity-60"
          style={{ animationDirection: 'reverse', animationDuration: '38s' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
          <p className="font-orbitron text-[11px] font-bold uppercase tracking-[0.4em] text-neon-cyan animate-pulseGlow">
            ◤ UNIVERS DETALING · 2027 ◢
          </p>

          <h1
            className="glitch-hover mt-6 max-w-4xl text-balance font-orbitron text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl md:text-6xl"
            data-text="VIDEO detailing auto, organizat pe categorii"
          >
            <span className="neon-gradient-text">VIDEO</span>{' '}
            <span className="text-ink">detailing auto,</span>
            <br />
            <span className="neon-cyan">organizat pe categorii</span>
          </h1>

          <p className="terminal-caret mt-4 font-mono text-xs tracking-widest text-ink-faint">
            boot sequence: {SITE_NAME} // agregator premium online
          </p>

          <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-ink-muted sm:text-lg">
            {SITE_NAME} agregă cele mai bune videoclipuri despre echipament garaje, produse
            detailing, protecții ceramice, fibră carbon și multe altele — cu linkuri directe către
            produsele de pe CleanX.ro.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a href="#categorii" className="btn-neon btn-neon-cyan !px-8 !py-4 !text-sm">
              Explorează categoriile
            </a>
            <a href="#trending" className="btn-neon btn-neon-pink !px-8 !py-4 !text-sm">
              🔥 În trend
            </a>
            <a
              href={CLEANX_HOME}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon btn-neon-violet !px-8 !py-4 !text-sm"
            >
              Magazinul CleanX.ro
            </a>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Categorii', value: stats.categories },
              { label: 'Videoclipuri', value: stats.videos },
              { label: 'Vizualizări totale', value: stats.views },
              { label: 'Canale', value: stats.channels },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div className="glass hud-corners min-w-[8.5rem] rounded-lg px-4 py-3">
                  <dd className="font-orbitron text-2xl font-black text-neon-cyan sm:text-3xl">
                    <StatCounter value={s.value} />
                  </dd>
                  <dt className="mt-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
                    {s.label}
                  </dt>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ================= CONTINUA VIZIONAREA (istoric local) ================= */}
      <ContinueWatching />

      {/* ================= TRENDING ================= */}
      <section id="trending" className="cv-auto mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionHeading accent="pink">🔥 În trend acum</SectionHeading>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {trendingWithLinks.slice(0, 10).map((video, i) => {
            const accent = categoryAccent(video.category_slug, video.category_accent);
            return (
              <Reveal key={video.youtube_id} delay={(i % 2) * 80}>
                <Link
                  href={`/video/${video.youtube_id}`}
                  className="glass card-lift flex items-center gap-4 rounded-xl p-3 transition-colors hover:border-neon-cyan/40"
                >
                  <span
                    className="w-8 shrink-0 text-center font-orbitron text-2xl font-black"
                    style={{ color: accent }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <img
                    src={video.thumbnail_url ?? `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`}
                    alt={video.title}
                    loading="lazy"
                    decoding="async"
                    width={120}
                    height={68}
                    className="h-16 w-28 shrink-0 rounded-md object-cover"
                  />
                  <span className="min-w-0">
                    <span className="line-clamp-2 block text-sm font-semibold leading-snug text-ink">
                      {video.title}
                    </span>
                    <span className="mt-1 block text-xs text-ink-faint">
                      {formatViewsCompact(video.views)} vizualizări · {video.category_name ?? 'Detailing'}
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================= FEATURED ================= */}
      <section id="featured" className="cv-auto mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionHeading accent="violet">Featured · Recomandate</SectionHeading>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredWithLinks.slice(0, 8).map((video, i) => (
            <Reveal key={video.youtube_id} delay={i * 70}>
              <VideoCard video={video} link={video.contextualLink} eager={i < 4} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= CATEGORII ================= */}
      <section id="categorii" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionHeading accent="cyan">Cele 10 categorii</SectionHeading>
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 3) * 80}>
              <TiltCard max={6} className="h-full">
                <Link
                  href={`/category/${c.slug}`}
                  className="category-chip hud-corners flex h-full items-center"
                  style={{ borderColor: `${categoryAccent(c.slug, c.accent)}44` }}
                >
                  <span aria-hidden="true" className="text-2xl">
                    {c.icon ?? '▸'}
                  </span>
                  <span className="flex-1">
                    <span className="block" style={{ color: categoryAccent(c.slug, c.accent) }}>
                      {c.name}
                    </span>
                    <span className="block font-space text-[10px] font-normal normal-case tracking-normal text-ink-faint">
                      {c.video_count} videoclipuri
                    </span>
                  </span>
                  <span aria-hidden="true" style={{ color: categoryAccent(c.slug, c.accent) }}>
                    →
                  </span>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= ULTIMELE ================= */}
      <section className="cv-auto mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionHeading accent="violet">Ultimele videoclipuri</SectionHeading>
        </Reveal>
        <div className="mt-8">
          <VideoGrid videos={latestWithLinks.slice(0, 6)} />
        </div>

        <Reveal>
          <div className="mt-6">
            <BannerCleanX
              variant="inline"
              title="Ai nevoie de produse? CleanX.ro"
              text="De la prosoape microfibra 500gsm până la protectii ceramice și folii carbon – toate produsele din videoclipuri sunt pe CleanX.ro."
            />
          </div>
        </Reveal>

        <div className="mt-6">
          <VideoGrid videos={latestWithLinks.slice(6)} />
        </div>

        <div className="mt-10 text-center">
          <Link href="#categorii" className="btn-neon btn-neon-violet">
            Alege o categorie ↑
          </Link>
        </div>
      </section>

      {/* JSON-LD ItemList (featured) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}
