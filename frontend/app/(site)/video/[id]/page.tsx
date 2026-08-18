import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { attachContextualLinks, getRelatedVideos, getVideoWithContext } from '@/lib/db';
import {
  breadcrumbJsonLd,
  formatDate,
  formatDuration,
  formatViews,
  videoMetadata,
  videoObjectJsonLd,
} from '@/lib/seo';
import { CLEANX_HOME, SITE_URL, categoryAccent, youtubeThumb } from '@/lib/constants';
import VideoEmbed from '@/components/VideoEmbed';
import VideoCard from '@/components/VideoCard';
import BannerCleanX from '@/components/BannerCleanX';
import Reveal from '@/components/Reveal';
import ChaptersList from '@/components/ChaptersList';
import MiniPlayer from '@/components/MiniPlayer';
import VideoTracker from '@/components/VideoTracker';
import FavoriteButton from '@/components/FavoriteButton';
import ShareButton from '@/components/ShareButton';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** Linkify URL-uri in text (descriere). */
function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-neon-cyan underline underline-offset-2 transition-colors hover:text-neon-pink"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Render flashy: paragrafe, timestamps evidentiate, linkuri active. */
function renderDescription(text: string) {
  const timeRegex = /^(\s*)(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–|:]?\s*(.*)$/;
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <div key={i} className="space-y-1.5">
          {p.split('\n').map((line, j) => {
            const timeMatch = line.match(timeRegex);
            if (timeMatch) {
              return (
                <p key={j} className="flex flex-wrap items-baseline gap-2 text-sm leading-relaxed">
                  <span className="rounded bg-neon-cyan/10 px-1.5 py-0.5 font-orbitron text-[11px] font-bold tabular-nums text-neon-cyan">
                    {timeMatch[2]}
                  </span>
                  <span className="text-ink-muted">{linkify(timeMatch[3] ?? '')}</span>
                </p>
              );
            }
            return (
              <p key={j} className="text-sm leading-relaxed text-ink-muted">
                {linkify(line)}
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { video } = await getVideoWithContext(id);
  if (!video) return {};
  return videoMetadata(video);
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { video, link } = await getVideoWithContext(id);
  if (!video) notFound();

  const related = await attachContextualLinks(
    await getRelatedVideos(video.category_slug, video.youtube_id, video.channel_id, 6),
  );

  const accent = categoryAccent(video.category_slug, video.category_accent);
  const thumb = video.thumbnail_url ?? youtubeThumb(video.youtube_id);
  const pageUrl = `${SITE_URL}/video/${video.youtube_id}`;

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Acasă', path: '/' },
    { name: video.category_name ?? 'Categorii', path: `/category/${video.category_slug}` },
    { name: video.title, path: `/video/${video.youtube_id}` },
  ]);

  const videoObject = videoObjectJsonLd(video);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {/* Breadcrumb vizual */}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            <li>
              <Link href="/" className="transition-colors hover:text-neon-cyan">
                Acasă
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/category/${video.category_slug}`}
                className="transition-colors hover:text-neon-cyan"
              >
                {video.category_name ?? 'Categorie'}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="line-clamp-1 max-w-[16rem]" style={{ color: accent }}>
              {video.title}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
          {/* ---------- Coloana principala ---------- */}
          <article>
            <Reveal>
              <VideoEmbed
                youtubeId={video.youtube_id}
                title={video.title}
                thumbnailUrl={video.thumbnail_url}
              />
            </Reveal>

            <h1 className="mt-6 text-balance font-orbitron text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
              {video.title}
            </h1>

            {/* actiuni utilizator */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <FavoriteButton youtubeId={video.youtube_id} />
              <ShareButton url={pageUrl} title={video.title} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
              <span className="flex items-center gap-2">
                <span
                  className="grid h-8 w-8 place-items-center rounded-full border bg-void2 font-orbitron text-xs font-black"
                  style={{ borderColor: `${accent}66`, color: accent }}
                >
                  {video.channel_title?.charAt(0) ?? 'Y'}
                </span>
                <span className="font-semibold text-ink">{video.channel_title ?? 'YouTube'}</span>
              </span>
              <span aria-hidden="true">•</span>
              <span>{formatViews(video.views)} vizualizări</span>
              {video.duration ? (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{formatDuration(video.duration)}</span>
                </>
              ) : null}
              <span aria-hidden="true">•</span>
              <time dateTime={video.published_at ?? undefined}>{formatDate(video.published_at)}</time>
            </div>

            {/* Capitole (parsate din descriere, seek fara cost API) */}
            <div className="mt-6">
              <ChaptersList youtubeId={video.youtube_id} description={video.description} accent={accent} />
            </div>

            {/* Link contextual CleanX (doar dacă regula îl rezolvă) */}
            {link ? (
              <div className="banner-neon card-lift mt-8 flex flex-col items-start justify-between gap-4 rounded-xl p-6 sm:flex-row sm:items-center">
                <div>
                  <p className="font-orbitron text-[11px] font-bold uppercase tracking-[0.3em] text-neon-pink">
                    ◤ Produs asociat ◢
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                    Acest videoclip este asociat cu un produs din magazinul partener CleanX.ro.
                  </p>
                </div>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon btn-neon-pink shrink-0"
                >
                  {link.label} →
                </a>
              </div>
            ) : null}

            {video.description_ro || video.description ? (
              <div className="glass mt-8 rounded-xl p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.25em] text-neon-cyan">
                    Descriere
                  </h2>
                  {video.description_ro ? (
                    <span className="rounded bg-neon-violet/15 px-2 py-0.5 font-orbitron text-[9px] font-bold uppercase tracking-wider text-neon-violet">
                      tradusă automat în română
                    </span>
                  ) : null}
                </div>
                <div className="mt-4">{renderDescription(video.description_ro ?? video.description ?? '')}</div>
                <a
                  href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint transition-colors hover:text-neon-cyan"
                >
                  Vezi pe YouTube ↗
                </a>

                {/* banner CleanX in descriere (exceptie de linkuire: banner -> home) */}
                <a
                  href={CLEANX_HOME}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="banner-neon card-lift mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-neon-pink">
                      🛒 Produse de detailing
                    </span>
                    <span className="block text-xs text-ink-muted">
                      Tot arsenalul pentru detailing auto – pe magazinul partener.
                    </span>
                  </span>
                  <span className="btn-neon btn-neon-pink shrink-0 !px-3 !py-1.5 text-[9px]">
                    CleanX.ro →
                  </span>
                </a>
              </div>
            ) : null}
          </article>

          {/* ---------- Sidebar ---------- */}
          <aside className="space-y-6">
            <BannerCleanX
              variant="sidebar"
              title="CleanX.ro"
              text="Toate produsele de detailing – livrare rapidă în România."
            />

            <div className="glass hud-corners rounded-xl p-5">
              <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.25em] text-neon-violet">
                Despre categorie
              </h2>
              <p className="mt-3 text-sm text-ink-muted">
                {video.category_name ?? 'Detailing auto'} — explorează mai multe videoclipuri din
                această categorie:
              </p>
              <Link
                href={`/category/${video.category_slug}`}
                className="btn-neon btn-neon-violet mt-4 w-full"
              >
                Toate videoclipurile →
              </Link>
              <a
                href={CLEANX_HOME}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint transition-colors hover:text-neon-pink"
              >
                cleanx.ro ↗
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* ---------- Videoclipuri similare ---------- */}
      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="section-heading neon-cyan">Videoclipuri similare</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((v, i) => (
              <Reveal key={v.youtube_id} delay={i * 70}>
                <VideoCard video={v} link={v.contextualLink} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* experienta de vizionare: tracker + mini-player */}
      <VideoTracker
        youtubeId={video.youtube_id}
        title={video.title}
        thumbnailUrl={thumb}
        categorySlug={video.category_slug}
      />
      <MiniPlayer youtubeId={video.youtube_id} title={video.title} thumbnailUrl={thumb} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObject) }}
      />
    </>
  );
}
