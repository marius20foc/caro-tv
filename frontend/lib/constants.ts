// ============================================================
// CARO.TV v43prov2 – constante globale de site
// ============================================================

export const SITE_NAME = 'CARO.TV';

export const SITE_TAGLINE =
  'Universul sci-fi al detailing-ului auto: videoclipuri, ghiduri și testuri, organizate pe categorii.';

export const SITE_URL = (process.env.SITE_URL as string) || 'https://caro.tv';

export const CLEANX_HOME = (process.env.CLEANX_HOME as string) || 'https://cleanx.ro';

export const CLEANX_EMAIL = 'contact@caro.tv';

export const CLEANX_LOCATION = 'ROMÂNIA';

/** Videoclipuri pe pagină (paginare clasică) */
export const PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 60;

/** Numărul de videoclipuri featured */
export const FEATURED_LIMIT = 8;

/** Trending: câte videoclipuri + fereastra de timp (zile) */
export const TRENDING_LIMIT = 10;
export const TRENDING_WINDOW_DAYS = 90;

/** Popup CleanX: întârziere până la afișare (ms) */
export const POPUP_DELAY_MS = 12_000;

/** Baza iframe player YouTube (fără cookie-uri de tracking) */
export const YOUTUBE_EMBED_BASE = 'https://www.youtube-nocookie.com/embed/';

/** Fallback thumbnail YouTube */
export function youtubeThumb(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

/** Fallback thumbnails maxres (best-effort; 404 dacă nu există) */
export function youtubeThumbMax(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;
}

/**
 * Accente neon implicite per categorie (folosite ca fallback
 * când coloana `accent` din D1 nu este setată).
 */
export const CATEGORY_ACCENTS: Record<string, string> = {
  'garage-equipment': '#4cc9e6',
  'garage-lighting': '#e0b45f',
  'detailing-products': '#7a6ad8',
  microfiber: '#57c98a',
  'carbon-fiber': '#8d9de0',
  'forged-carbon': '#d96aa5',
  'ceramic-coating': '#4cc9e6',
  interior: '#e0a35c',
  exterior: '#7a6ad8',
  unboxing: '#d96aa5',
};

export function categoryAccent(slug: string, fallback?: string | null): string {
  return fallback || CATEGORY_ACCENTS[slug] || '#4cc9e6';
}

// ---------------- Sortare & filtre (URL params, zero cost API) ----------------

export type SortKey = 'newest' | 'views' | 'trending';

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: 'Cele mai noi' },
  { value: 'views', label: 'Cele mai vizualizate' },
  { value: 'trending', label: 'În trend' },
];

export function isSortKey(v: string): v is SortKey {
  return SORT_OPTIONS.some((o) => o.value === v);
}

export interface DurationFilter {
  value: string;
  label: string;
  minSeconds?: number;
  maxSeconds?: number;
}

export const DURATION_FILTERS: DurationFilter[] = [
  { value: '', label: 'Orice durată' },
  { value: 'short', label: 'Sub 4 min', maxSeconds: 240 },
  { value: 'medium', label: '4–20 min', minSeconds: 240, maxSeconds: 1200 },
  { value: 'long', label: 'Peste 20 min', minSeconds: 1200 },
];

export function getDurationFilter(value: string): DurationFilter | undefined {
  return DURATION_FILTERS.find((f) => f.value === value);
}

// ---------------- Storage client (localStorage) ----------------

export const THEME_KEY = 'caro_theme';
export const FAVORITES_KEY = 'caro_favorites';
export const HISTORY_KEY = 'caro_history';
export const PROGRESS_KEY = 'caro_progress';

/** Cloudflare Web Analytics (optional) */
export const CF_BEACON_TOKEN = (process.env.CF_BEACON_TOKEN as string) || '';
