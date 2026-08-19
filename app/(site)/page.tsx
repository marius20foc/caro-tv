import Link from 'next/link';
import {
  attachContextualLinks,
  getFeatured,
  getTrending,
  getYoutubeTrending,
  listCategories,
  listVideos,
} from '@/lib/db';
import {
  FEATURED_LIMIT,
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
import ContinueWatching from '@/components/ContinueWatching';
import HeroBackdrop from '@/components/HeroBackdrop';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, featured, trending, latest, ytTrending] = await Promise.all([
    listCategories(),
    getFeatured(FEATURED_LIMIT),
    getTrending(TRENDING_LIMIT),
    listVideos({ page: 1, perPage: 12, sort: 'newest' }),
    getYoutubeTrending(12),
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
        <HeroBackdrop />
        <div
          className="orbit-ring pointer-events-none left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 opacity-70"
          style={{ animationDuration: '60s' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <h1
            className="glitch-hover mt-2 max-w-4xl text-balance font-orbitron text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl md:text-6xl"
            data-text="VIDEO detailing auto!"
          >
            <span className="neon-gradient-text">VIDEO</span>{' '}
            <span className="text-ink">detailing auto!</span>
          </h1>
        </div>
      </section>

      {/* ================= CONTINUA VIZIONAREA (istoric local) ================= */}
      <ContinueWatching />

      {/* ================= TRENDING YOUTUBE (statistici oficiale) ================= */}
      {ytTrending.length > 0 ? (
        <section className="cv-auto mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-label="Trending YouTube">
          <Reveal>
            <SectionHeading accent="pink">🔥 Trending pe YouTube · Auto · România</SectionHeading>
          </Reveal>
          <p className="mt-2 text-xs text-ink-faint">
            Statistici oficiale YouTube (categoria Autos &amp; Vehicles), actualizate zilnic.
          </p>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {ytTrending.map((item) => (
              <a
                key={item.youtube_id}
                href={`https://www.youtube.com/watch?v=${item.youtube_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass card-lift w-64 shrink-0 overflow-hidden rounded-xl"
              >
                <span className="relative block aspect-video overflow-hidden">
                  <img
                    src={item.thumbnail_url ?? ''}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    width={320}
                    height={180}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded bg-void/80 px-2 py-0.5 font-orbitron text-[10px] font-bold text-neon-pink">
                    #{item.rank}
                  </span>
                </span>
                <span className="block p-3">
                  <span className="line-clamp-2 block text-sm font-semibold leading-snug text-ink">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-ink-faint">
                    {item.channel_title ?? 'YouTube'} · {formatViewsCompact(item.views)} vizualizări
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* ================= TRENDING ================= */}
      <section id="trending" className="cv-auto mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionHeading accent="pink">🔥 În trend acum</SectionHeading>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {trendingWithLinks.slice(0, TRENDING_LIMIT).map((video, i) => {
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
          {featuredWithLinks.slice(0, FEATURED_LIMIT).map((video, i) => (
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
              title="Ai nevoie de produse?"
              text="De la prosoape microfibra 500gsm până la protectii ceramice și folii carbon."
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
