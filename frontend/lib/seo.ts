// ============================================================
// CARO.TV v4pro – SEO: metadata dinamice + JSON-LD (VideoObject,
// BreadcrumbList, ItemList, WebSite, Organization, FAQPage)
// ============================================================

import type { Metadata } from 'next';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from './constants';
import type { CategoryWithCount, FaqItem, VideoWithCategory } from './db';

export function absoluteUrl(path = ''): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildTitle(...parts: Array<string | undefined | null>): string {
  const clean = parts.filter(Boolean).join(' | ');
  return clean || SITE_NAME;
}

export function formatViews(views: number): string {
  return new Intl.NumberFormat('ro-RO').format(views);
}

/** Format compact: 12.400 → „12,4 k” */
export function formatViewsCompact(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)} M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)} k`;
  return formatViews(views);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

/** ISO 8601 duration (PT12M34S) -> „12:34” / „1:02:03” */
export function formatDuration(iso: string | null | undefined): string {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = Number(match[1] ?? 0);
  const m = Number(match[2] ?? 0);
  const s = Number(match[3] ?? 0);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** ISO 8601 duration -> secunde (pentru sitemap video <video:duration> este nefolosit; pastrat pentru tooling) */
export function durationToSeconds(iso: string | null | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

// ---------------- JSON-LD ----------------

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'ro-RO',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/cautare?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg'),
    description: SITE_TAGLINE,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'office@cleanx.ro',
      contactType: 'customer support',
      areaServed: 'RO',
      availableLanguage: ['Romanian'],
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function itemListJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}

/** FAQPage JSON-LD – folosit pe paginile de categorie care au faq_json în D1. */
export function faqJsonLd(faq: FaqItem[], url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url,
    mainEntity: faq.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function videoObjectJsonLd(video: VideoWithCategory) {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.youtube_id}`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: (video.description ?? '').slice(0, 2000),
    thumbnailUrl: video.thumbnail_url ?? `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`,
    uploadDate: video.published_at ?? new Date().toISOString(),
    duration: video.duration ?? undefined,
    embedUrl,
    contentUrl: watchUrl,
    url: absoluteUrl(`/video/${video.youtube_id}`),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: video.views,
    },
    publisher: {
      '@type': 'Organization',
      name: video.channel_title ?? 'YouTube',
      url: watchUrl,
    },
  };
}

// ---------------- Metadata dinamice ----------------

export function categoryMetadata(cat: CategoryWithCount): Metadata {
  const title = cat.seo_title || buildTitle(cat.name);
  const description =
    cat.seo_description ||
    cat.description ||
    `Videoclipuri cu ${cat.name} – ghiduri, testuri și inspirație pentru detailing auto.`;
  const url = absoluteUrl(`/category/${cat.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'ro_RO',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export function videoMetadata(video: VideoWithCategory): Metadata {
  const title = buildTitle(video.title);
  const description =
    (video.description ?? '').replace(/\s+/g, ' ').slice(0, 160) ||
    `Videoclip din categoria ${video.category_name ?? 'detailing auto'}.`;
  const url = absoluteUrl(`/video/${video.youtube_id}`);
  const image = video.thumbnail_url ?? `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: video.title,
      description,
      url,
      type: 'video.other',
      siteName: SITE_NAME,
      locale: 'ro_RO',
      images: [{ url: image, width: 1280, height: 720, alt: video.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description,
      images: [image],
    },
  };
}

export function contactMetadata(): Metadata {
  const title = buildTitle('Contact');
  const description = 'Contact CARO.TV: office@cleanx.ro · ROMÂNIA. Fără formular – doar email.';
  const url = absoluteUrl('/contact');
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'ro_RO',
    },
    robots: { index: true, follow: true },
  };
}

/** Pagina de cautare – noindex (rezultate dinamice, fara valoare de indexare). */
export function searchMetadata(q?: string): Metadata {
  const title = q ? buildTitle(`Căutare: ${q}`) : buildTitle('Căutare');
  const description = 'Caută în toate videoclipurile CARO.TV: detalii, produse, tehnici de detailing auto.';
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: absoluteUrl('/cautare') },
    openGraph: { title, description, type: 'website', siteName: SITE_NAME, locale: 'ro_RO' },
  };
}
