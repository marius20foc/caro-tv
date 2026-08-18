// ============================================================
// CARO.TV v43prov2 – storage client (localStorage) + temă
// Folosit DOAR din client components. Zero cost de API: toate
// preferințele (favorite, istoric, progres, temă) stau local.
// ============================================================

import {
  FAVORITES_KEY,
  HISTORY_KEY,
  PROGRESS_KEY,
  THEME_KEY,
} from './constants';

export type Theme = 'dark' | 'light';

const hasWindow = typeof window !== 'undefined';

function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode – ignoram */
  }
}

// ---------------- Tema ----------------

export function getInitialTheme(): Theme {
  if (!hasWindow) return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
  if (hasWindow) document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: Theme): void {
  applyTheme(theme);
  if (hasWindow) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }
}

// ---------------- Favorite ----------------

export interface FavoriteItem {
  youtube_id: string;
  savedAt: number;
}

export function getFavorites(): FavoriteItem[] {
  return readJson<FavoriteItem[]>(FAVORITES_KEY, []);
}

export function isFavorite(youtubeId: string): boolean {
  return getFavorites().some((f) => f.youtube_id === youtubeId);
}

/** Adaugă/scoate din favorite; returnează noua stare. */
export function toggleFavorite(youtubeId: string): boolean {
  const list = getFavorites();
  const exists = list.some((f) => f.youtube_id === youtubeId);
  const next = exists
    ? list.filter((f) => f.youtube_id !== youtubeId)
    : [...list, { youtube_id: youtubeId, savedAt: Date.now() }];
  writeJson(FAVORITES_KEY, next);
  if (hasWindow) {
    window.dispatchEvent(new CustomEvent('caro:favorites-changed'));
  }
  return !exists;
}

// ---------------- Istoric („Continuă vizionarea”) ----------------

export interface HistoryItem {
  youtube_id: string;
  title: string;
  thumbnail_url: string;
  category_slug: string;
  watchedAt: number;
}

const HISTORY_CAP = 50;

export function pushHistory(item: HistoryItem): void {
  const list = getHistory().filter((h) => h.youtube_id !== item.youtube_id);
  list.unshift(item);
  writeJson(HISTORY_KEY, list.slice(0, HISTORY_CAP));
  if (hasWindow) {
    window.dispatchEvent(new CustomEvent('caro:history-changed'));
  }
}

export function getHistory(): HistoryItem[] {
  return readJson<HistoryItem[]>(HISTORY_KEY, []);
}

// ---------------- Progres vizionare ----------------

export interface ProgressItem {
  /** secunda curentă */
  current: number;
  /** durata totală în secunde */
  duration: number;
  updatedAt: number;
}

export function setProgress(youtubeId: string, current: number, duration: number): void {
  if (!hasWindow || !duration) return;
  const all = readJson<Record<string, ProgressItem>>(PROGRESS_KEY, {});
  all[youtubeId] = { current, duration, updatedAt: Date.now() };
  // curățenie periodică: păstrăm max 200 de intrări
  const keys = Object.keys(all);
  if (keys.length > 200) {
    keys
      .sort((a, b) => (all[b].updatedAt ?? 0) - (all[a].updatedAt ?? 0))
      .slice(200)
      .forEach((k) => delete all[k]);
  }
  writeJson(PROGRESS_KEY, all);
  if (hasWindow) {
    window.dispatchEvent(new CustomEvent('caro:progress-changed'));
  }
}

export function getProgress(youtubeId: string): ProgressItem | null {
  const all = readJson<Record<string, ProgressItem>>(PROGRESS_KEY, {});
  return all[youtubeId] ?? null;
}

/** Procent vizionat (0..1). Sub 3% sau peste 97% = „finalizat” (nu mai afișăm). */
export function getProgressPct(youtubeId: string): number {
  const p = getProgress(youtubeId);
  if (!p || !p.duration) return 0;
  const pct = Math.min(p.current / p.duration, 1);
  if (pct < 0.03 || pct > 0.97) return 0;
  return pct;
}

// ---------------- Evenimente cross-component ----------------

export const FAVORITES_EVENT = 'caro:favorites-changed';

export function onFavoritesChanged(cb: () => void): () => void {
  if (!hasWindow) return () => {};
  window.addEventListener(FAVORITES_EVENT, cb);
  return () => window.removeEventListener(FAVORITES_EVENT, cb);
}
