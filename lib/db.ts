// ============================================================
// CARO.TV v43prov2 – strat de acces la Cloudflare D1
// Folosit de Server Components, Route Handlers si generateMetadata.
// Necesita `export const runtime = 'edge'` + `dynamic = 'force-dynamic'`
// pe paginile/rutele care importa functiile de aici.
// v3: cautare full-text FTS5 (zero cost YouTube), trending, sortare,
//     filtrare dupa durata, paginare clasica.
// ============================================================

import { getRequestContext } from '@cloudflare/next-on-pages';
import { resolveContextualLink, type ContextualLink } from './productMapper';
import type { SortKey } from './constants';

// ---------------- Tipuri ----------------

export interface CategoryRow {
  slug: string;
  name: string;
  description: string | null;
  playlist_id: string | null;
  icon: string | null;
  sort_order: number;
  default_product_url: string | null;
  accent: string | null;
  seo_title: string | null;
  seo_description: string | null;
  faq_json: string | null;
}

export interface CategoryWithCount extends CategoryRow {
  video_count: number;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface VideoRow {
  id: number;
  category_slug: string;
  youtube_id: string;
  title: string;
  description: string | null;
  description_ro: string | null;
  thumbnail_url: string | null;
  channel_title: string | null;
  channel_id: string | null;
  published_at: string | null;
  duration: string | null;
  duration_seconds: number;
  views: number;
  likes: number;
  last_updated: string;
  is_featured: number;
  is_active: number;
  product_url: string | null;
  product_name: string | null;
}

export interface VideoWithCategory extends VideoRow {
  category_name: string | null;
  category_icon: string | null;
  category_accent: string | null;
  category_default_url: string | null;
}

export interface VideoWithLink extends VideoWithCategory {
  contextualLink: ContextualLink | null;
}

export interface ProductMappingRow {
  id: number;
  category_slug: string;
  cleanx_product_url: string | null;
  cleanx_category_url: string;
  cleanx_product_name: string | null;
  keywords: string | null;
  is_active: number;
}

export interface ProductOverrideRow {
  video_id: number;
  cleanx_product_url: string | null;
  cleanx_category_url: string;
  cleanx_product_name: string | null;
}

export interface VideoPage {
  videos: VideoWithCategory[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface Suggestion {
  youtube_id: string;
  title: string;
  channel_title: string | null;
}

export interface YoutubeTrendingRow {
  youtube_id: string;
  title: string;
  thumbnail_url: string | null;
  channel_title: string | null;
  views: number;
  published_at: string | null;
  rank: number;
}

// ---------------- Acces DB ----------------

function getEnv(): CloudflareEnv {
  return getRequestContext().env as unknown as CloudflareEnv;
}

export function getDb(): D1Database {
  return getEnv().DB;
}

export function getSiteUrlFromEnv(): string {
  return getEnv().SITE_URL || 'https://caro.tv';
}

/**
 * Migrare AUTOMATA de schema (idempotenta): orice baza la care este
 * legat site-ul se auto-repara la prima folosire. Daca o coloana/tabel
 * exista deja, eroarea e ignorata – zero risc.
 */
export async function ensureSchema(): Promise<void> {
  const db = getDb();
  const statements = [
    `ALTER TABLE videos ADD COLUMN duration_seconds INTEGER DEFAULT 0`,
    `ALTER TABLE videos ADD COLUMN description_ro TEXT`,
    `ALTER TABLE videos ADD COLUMN translated_at DATETIME`,
    `CREATE TABLE IF NOT EXISTS yt_trending (
       youtube_id TEXT PRIMARY KEY,
       title TEXT NOT NULL,
       thumbnail_url TEXT,
       channel_title TEXT,
       views INTEGER DEFAULT 0,
       published_at DATETIME,
       rank INTEGER DEFAULT 0,
       fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE VIRTUAL TABLE IF NOT EXISTS video_fts USING fts5(
       title, description, channel_title,
       tokenize = 'unicode61 remove_diacritics 2',
       content = 'videos',
       content_rowid = 'id'
     )`,
    `CREATE TRIGGER IF NOT EXISTS videos_ai AFTER INSERT ON videos BEGIN
       INSERT INTO video_fts(rowid, title, description, channel_title)
       VALUES (new.id, new.title, COALESCE(new.description, ''), COALESCE(new.channel_title, ''));
     END`,
    `CREATE TRIGGER IF NOT EXISTS videos_ad AFTER DELETE ON videos BEGIN
       INSERT INTO video_fts(video_fts, rowid, title, description, channel_title)
       VALUES ('delete', old.id, old.title, COALESCE(old.description, ''), COALESCE(old.channel_title, ''));
     END`,
    `CREATE TRIGGER IF NOT EXISTS videos_au AFTER UPDATE ON videos BEGIN
       INSERT INTO video_fts(video_fts, rowid, title, description, channel_title)
       VALUES ('delete', old.id, old.title, COALESCE(old.description, ''), COALESCE(old.channel_title, ''));
       INSERT INTO video_fts(rowid, title, description, channel_title)
       VALUES (new.id, new.title, COALESCE(new.description, ''), COALESCE(new.channel_title, ''));
     END`,
  ];

  for (const sql of statements) {
    try {
      await db.exec(sql);
    } catch {
      /* deja exista – schema este idempotenta, ignoram */
    }
  }
}

const VIDEO_COLUMNS = `
  v.*, c.name AS category_name, c.icon AS category_icon,
  c.accent AS category_accent,
  c.default_product_url AS category_default_url
`;

const VIDEO_FROM = `
  FROM videos v
  LEFT JOIN categories c ON c.slug = v.category_slug
`;

function rowToVideo(row: any): VideoWithCategory {
  return {
    id: Number(row.id),
    category_slug: row.category_slug,
    youtube_id: row.youtube_id,
    title: row.title,
    description: row.description ?? null,
    description_ro: row.description_ro ?? null,
    thumbnail_url: row.thumbnail_url ?? null,
    channel_title: row.channel_title ?? null,
    channel_id: row.channel_id ?? null,
    published_at: row.published_at ?? null,
    duration: row.duration ?? null,
    duration_seconds: Number(row.duration_seconds ?? 0),
    views: Number(row.views ?? 0),
    likes: Number(row.likes ?? 0),
    last_updated: row.last_updated ?? '',
    is_featured: Number(row.is_featured ?? 0),
    is_active: Number(row.is_active ?? 1),
    product_url: row.product_url ?? null,
    product_name: row.product_name ?? null,
    category_name: row.category_name ?? null,
    category_icon: row.category_icon ?? null,
    category_accent: row.category_accent ?? null,
    category_default_url: row.category_default_url ?? null,
  };
}

function rowToCategory(row: any): CategoryWithCount {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    playlist_id: row.playlist_id ?? null,
    icon: row.icon ?? null,
    sort_order: Number(row.sort_order ?? 0),
    default_product_url: row.default_product_url ?? null,
    accent: row.accent ?? null,
    seo_title: row.seo_title ?? null,
    seo_description: row.seo_description ?? null,
    faq_json: row.faq_json ?? null,
    video_count: Number(row.video_count ?? 0),
  };
}

function orderByForSort(sort?: SortKey): string {
  switch (sort) {
    case 'views':
      return 'v.views DESC, v.published_at DESC';
    case 'trending':
      // views raportate la vechime – „viteza” de popularitate, zero cost API
      return '(v.views * 1.0 / MAX(julianday(\'now\') - julianday(v.published_at), 1)) DESC, v.published_at DESC';
    case 'newest':
    default:
      return 'v.published_at DESC, v.id DESC';
  }
}

// ---------------- Categorii ----------------

export async function listCategories(): Promise<CategoryWithCount[]> {
  const { results } = await getDb()
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM videos v WHERE v.category_slug = c.slug AND v.is_active = 1) AS video_count
       FROM categories c ORDER BY c.sort_order ASC`,
    )
    .all<any>();
  return (results ?? []).map(rowToCategory);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryWithCount | null> {
  const row = await getDb()
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM videos v WHERE v.category_slug = c.slug AND v.is_active = 1) AS video_count
       FROM categories c WHERE c.slug = ?`,
    )
    .bind(slug)
    .first<any>();
  return row ? rowToCategory(row) : null;
}

/** Parseaza faq_json (string JSON) intr-o lista sigura de intrebari/raspunsuri. */
export function parseFaq(faqJson: string | null | undefined): FaqItem[] {
  if (!faqJson) return [];
  try {
    const parsed = JSON.parse(faqJson);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((it) => it && typeof it.q === 'string' && typeof it.a === 'string')
      .map((it) => ({ q: it.q, a: it.a }));
  } catch {
    return [];
  }
}

// ---------------- Videoclipuri (listare + filtre + sortare + paginare) ----------------

export interface ListVideosOptions {
  category?: string;
  q?: string;
  sort?: SortKey;
  minSeconds?: number;
  maxSeconds?: number;
  featuredOnly?: boolean;
  page?: number;
  perPage?: number;
  /** compatibilitate: limit/offset directe */
  limit?: number;
  offset?: number;
}

export async function listVideos(opts: ListVideosOptions = {}): Promise<VideoPage> {
  const db = getDb();
  const perPage = Math.min(Math.max(Math.trunc(opts.perPage ?? opts.limit ?? 24), 1), 100);
  const page = Math.max(Math.trunc(opts.page ?? 1), 1);
  const offset = opts.offset ?? (page - 1) * perPage;

  const where: string[] = ['v.is_active = 1'];
  const params: unknown[] = [];

  if (opts.category) {
    where.push('v.category_slug = ?');
    params.push(opts.category);
  }
  if (opts.featuredOnly) where.push('v.is_featured = 1');
  if (opts.minSeconds != null) {
    where.push('v.duration_seconds >= ?');
    params.push(opts.minSeconds);
  }
  if (opts.maxSeconds != null) {
    where.push('v.duration_seconds < ?');
    params.push(opts.maxSeconds);
  }
  if (opts.q && opts.q.trim()) {
    where.push('(v.title LIKE ? OR v.description LIKE ? OR v.channel_title LIKE ?)');
    const like = `%${opts.q.trim()}%`;
    params.push(like, like, like);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const orderSql = orderByForSort(opts.sort);

  const totalRow = await db
    .prepare(`SELECT COUNT(*) AS total FROM videos v ${whereSql}`)
    .bind(...params)
    .first<any>();

  const rows = await db
    .prepare(
      `SELECT ${VIDEO_COLUMNS} ${VIDEO_FROM} ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`,
    )
    .bind(...params, perPage, offset)
    .all<any>();

  const total = Number(totalRow?.total ?? 0);
  return {
    videos: (rows.results ?? []).map(rowToVideo),
    total,
    page,
    perPage,
    totalPages: Math.max(Math.ceil(total / perPage), 1),
  };
}

// ---------------- Cautare full-text FTS5 (zero cost YouTube) ----------------

/** Construieste un query FTS5 sigur: ultimul token devine prefix (coating -> coating*). */
function buildFtsQuery(q: string): string {
  const tokens = q
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]+/gu, ''))
    .filter(Boolean)
    .slice(0, 8);
  if (!tokens.length) return '';
  return tokens
    .map((t, i) => (i === tokens.length - 1 ? `"${t}"*` : `"${t}"`))
    .join(' ');
}

export async function searchVideos(opts: ListVideosOptions = {}): Promise<VideoPage> {
  const q = (opts.q ?? '').trim();
  if (!q) return listVideos(opts);

  const db = getDb();
  const perPage = Math.min(Math.max(Math.trunc(opts.perPage ?? opts.limit ?? 24), 1), 100);
  const page = Math.max(Math.trunc(opts.page ?? 1), 1);
  const offset = opts.offset ?? (page - 1) * perPage;

  const where: string[] = ['v.is_active = 1'];
  const params: unknown[] = [];

  if (opts.category) {
    where.push('v.category_slug = ?');
    params.push(opts.category);
  }
  if (opts.minSeconds != null) {
    where.push('v.duration_seconds >= ?');
    params.push(opts.minSeconds);
  }
  if (opts.maxSeconds != null) {
    where.push('v.duration_seconds < ?');
    params.push(opts.maxSeconds);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const ftsQuery = buildFtsQuery(q);
  const orderSql = orderByForSort(opts.sort);

  const run = async (): Promise<{ total: number; results: any[] }> => {
    const totalRes = await db
      .prepare(
        `SELECT COUNT(*) AS total FROM video_fts f JOIN videos v ON v.id = f.rowid ${whereSql} AND video_fts MATCH ?`,
      )
      .bind(...params, ftsQuery)
      .first<any>();

    const rows = await db
      .prepare(
        `SELECT ${VIDEO_COLUMNS}
         FROM video_fts f
         JOIN videos v ON v.id = f.rowid
         LEFT JOIN categories c ON c.slug = v.category_slug
         ${whereSql} AND video_fts MATCH ?
         ORDER BY ${opts.sort && opts.sort !== 'newest' ? orderSql : 'bm25(video_fts), v.views DESC'}
         LIMIT ? OFFSET ?`,
      )
      .bind(...params, ftsQuery, perPage, offset)
      .all<any>();

    return { total: Number(totalRes?.total ?? 0), results: rows.results ?? [] };
  };

  let data: { total: number; results: any[] };
  try {
    data = await run();
  } catch {
    // FTS indisponibil (ex: baza veche fara tabelul fts) -> fallback LIKE
    return listVideos(opts);
  }

  return {
    videos: data.results.map(rowToVideo),
    total: data.total,
    page,
    perPage,
    totalPages: Math.max(Math.ceil(data.total / perPage), 1),
  };
}

/** Sugestii instant pentru cautare (autocomplete) – max 8 rezultate. */
export async function suggestVideos(q: string, limit = 8): Promise<Suggestion[]> {
  const query = q.trim();
  if (!query) return [];

  const db = getDb();
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 10);
  const ftsQuery = `${buildFtsQuery(query) || `"${query.replace(/"/g, '')}"`}`;

  try {
    const { results } = await db
      .prepare(
        `SELECT v.youtube_id, v.title, v.channel_title
         FROM video_fts f JOIN videos v ON v.id = f.rowid
         WHERE video_fts MATCH ? AND v.is_active = 1
         ORDER BY bm25(video_fts), v.views DESC
         LIMIT ?`,
      )
      .bind(ftsQuery, capped)
      .all<any>();
    return (results ?? []).map((r: any) => ({
      youtube_id: r.youtube_id,
      title: r.title,
      channel_title: r.channel_title ?? null,
    }));
  } catch {
    const like = `%${query}%`;
    const { results } = await db
      .prepare(
        `SELECT youtube_id, title, channel_title FROM videos
         WHERE is_active = 1 AND (title LIKE ? OR channel_title LIKE ?)
         ORDER BY views DESC LIMIT ?`,
      )
      .bind(like, like, capped)
      .all<any>();
    return (results ?? []).map((r: any) => ({
      youtube_id: r.youtube_id,
      title: r.title,
      channel_title: r.channel_title ?? null,
    }));
  }
}

// ---------------- Trending YouTube (stats directe de la YouTube) ----------------

/**
 * Trending-ul oficial YouTube pentru România, categoria Autos & Vehicles –
 * preluat de cron cu videos.list chart=mostPopular (1 unitate/zi) si stocat
 * in tabela yt_trending. Este 100% statistici YouTube, nu estimari locale.
 */
export async function getYoutubeTrending(limit = 12): Promise<YoutubeTrendingRow[]> {
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 30);
  const { results } = await getDb()
    .prepare(
      `SELECT youtube_id, title, thumbnail_url, channel_title, views, published_at, rank
       FROM yt_trending ORDER BY rank ASC LIMIT ?`,
    )
    .bind(capped)
    .all<any>();
  return (results ?? []).map((r: any) => ({
    youtube_id: r.youtube_id,
    title: r.title,
    thumbnail_url: r.thumbnail_url ?? null,
    channel_title: r.channel_title ?? null,
    views: Number(r.views ?? 0),
    published_at: r.published_at ?? null,
    rank: Number(r.rank ?? 0),
  }));
}

// ---------------- Videoclipuri individuale / featured / trending ----------------

export async function getVideoByYouTubeId(youtubeId: string): Promise<VideoWithCategory | null> {
  const row = await getDb()
    .prepare(`SELECT ${VIDEO_COLUMNS} ${VIDEO_FROM} WHERE v.youtube_id = ? AND v.is_active = 1`)
    .bind(youtubeId)
    .first<any>();
  return row ? rowToVideo(row) : null;
}

export async function getFeatured(limit = 8): Promise<VideoWithCategory[]> {
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const rows = await getDb()
    .prepare(
      `SELECT ${VIDEO_COLUMNS} ${VIDEO_FROM} WHERE v.is_featured = 1 AND v.is_active = 1
       ORDER BY v.views DESC, v.published_at DESC
       LIMIT ?`,
    )
    .bind(capped)
    .all<any>();
  return (rows.results ?? []).map(rowToVideo);
}

/** Trending = vizualizari raportate la vechime (ultimele 90 de zile). */
export async function getTrending(limit = 10, windowDays = 90): Promise<VideoWithCategory[]> {
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const rows = await getDb()
    .prepare(
      `SELECT ${VIDEO_COLUMNS} ${VIDEO_FROM}
       WHERE v.is_active = 1 AND v.published_at > datetime('now', ?)
       ORDER BY (v.views * 1.0 / MAX(julianday('now') - julianday(v.published_at), 1)) DESC, v.published_at DESC
       LIMIT ?`,
    )
    .bind(`-${windowDays} days`, capped)
    .all<any>();
  return (rows.results ?? []).map(rowToVideo);
}

/** Videoclipuri similare: mai intai acelasi canal, apoi aceeasi categorie, dupa popularitate. */
export async function getRelatedVideos(
  categorySlug: string,
  excludeYoutubeId: string,
  sameChannelId?: string | null,
  limit = 6,
): Promise<VideoWithCategory[]> {
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const rows = await getDb()
    .prepare(
      `SELECT ${VIDEO_COLUMNS} ${VIDEO_FROM}
       WHERE v.category_slug = ? AND v.youtube_id <> ? AND v.is_active = 1
       ORDER BY (v.channel_id = ?) DESC, v.views DESC, v.published_at DESC
       LIMIT ?`,
    )
    .bind(categorySlug, excludeYoutubeId, sameChannelId ?? '', capped)
    .all<any>();
  return (rows.results ?? []).map(rowToVideo);
}

// ---------------- Statistici (hero / ticker) ----------------

export async function getStats(): Promise<{
  videos: number;
  views: number;
  channels: number;
  categories: number;
}> {
  const db = getDb();
  const row = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM videos WHERE is_active = 1) AS videos,
         (SELECT COALESCE(SUM(views), 0) FROM videos WHERE is_active = 1) AS views,
         (SELECT COUNT(DISTINCT channel_id) FROM videos WHERE is_active = 1 AND channel_id IS NOT NULL) AS channels,
         (SELECT COUNT(*) FROM categories) AS categories`,
    )
    .first<any>();
  return {
    videos: Number(row?.videos ?? 0),
    views: Number(row?.views ?? 0),
    channels: Number(row?.channels ?? 0),
    categories: Number(row?.categories ?? 0),
  };
}

// ---------------- Linkuri contextuale (mapare produse) ----------------

export async function getProductOverride(videoId: number): Promise<ProductOverrideRow | null> {
  const row = await getDb()
    .prepare(`SELECT * FROM video_product_overrides WHERE video_id = ?`)
    .bind(videoId)
    .first<any>();
  return (row as ProductOverrideRow) ?? null;
}

export async function listMappingsByCategory(categorySlug: string): Promise<ProductMappingRow[]> {
  const { results } = await getDb()
    .prepare(
      `SELECT * FROM product_mapping WHERE category_slug = ? AND is_active = 1 ORDER BY id ASC`,
    )
    .bind(categorySlug)
    .all<any>();
  return (results ?? []) as ProductMappingRow[];
}

export async function attachContextualLinks(
  videos: VideoWithCategory[],
): Promise<VideoWithLink[]> {
  if (!videos.length) return [];

  const db = getDb();
  const ids = videos.map((v) => v.id);
  const idPlaceholders = ids.map(() => '?').join(',');

  const overrideRes = await db
    .prepare(`SELECT * FROM video_product_overrides WHERE video_id IN (${idPlaceholders})`)
    .bind(...ids)
    .all<any>();

  const overrides = new Map<number, ProductOverrideRow>();
  for (const r of overrideRes.results ?? []) {
    const row = r as ProductOverrideRow;
    overrides.set(Number(row.video_id), row);
  }

  const slugs = [...new Set(videos.map((v) => v.category_slug))];
  const slugPlaceholders = slugs.map(() => '?').join(',');

  const mapRes = await db
    .prepare(
      `SELECT * FROM product_mapping WHERE category_slug IN (${slugPlaceholders}) AND is_active = 1 ORDER BY id ASC`,
    )
    .bind(...slugs)
    .all<any>();

  const mappingsByCat = new Map<string, ProductMappingRow[]>();
  for (const r of mapRes.results ?? []) {
    const m = r as ProductMappingRow;
    const arr = mappingsByCat.get(m.category_slug) ?? [];
    arr.push(m);
    mappingsByCat.set(m.category_slug, arr);
  }

  return videos.map((v) => ({
    ...v,
    contextualLink: resolveContextualLink({
      video: v,
      categorySlug: v.category_slug,
      overrides: overrides.get(v.id) ?? null,
      mappings: mappingsByCat.get(v.category_slug) ?? [],
      defaultProductUrl: v.category_default_url,
    }),
  }));
}

export async function getVideoWithContext(youtubeId: string): Promise<{
  video: VideoWithCategory | null;
  link: ContextualLink | null;
}> {
  const video = await getVideoByYouTubeId(youtubeId);
  if (!video) return { video: null, link: null };
  const [overrides, mappings] = await Promise.all([
    getProductOverride(video.id),
    listMappingsByCategory(video.category_slug),
  ]);
  const link = resolveContextualLink({
    video,
    categorySlug: video.category_slug,
    overrides,
    mappings,
    defaultProductUrl: video.category_default_url,
  });
  return { video, link };
}

// ---------------- Sitemap ----------------

export async function listCategorySlugsForSitemap(): Promise<
  Array<{ slug: string; updated_at: string | null }>
> {
  const { results } = await getDb()
    .prepare(
      `SELECT c.slug, MAX(v.published_at) AS updated_at
       FROM categories c LEFT JOIN videos v ON v.category_slug = c.slug
       GROUP BY c.slug`,
    )
    .all<any>();
  return (results ?? []).map((r: any) => ({
    slug: r.slug,
    updated_at: r.updated_at ?? null,
  }));
}

export async function listVideosForSitemap(): Promise<
  Array<{
    youtube_id: string;
    published_at: string | null;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    duration: string | null;
    category_slug: string;
  }>
> {
  const { results } = await getDb()
    .prepare(
      `SELECT youtube_id, published_at, title, description, thumbnail_url, duration, category_slug
       FROM videos WHERE is_active = 1 ORDER BY published_at DESC`,
    )
    .all<any>();
  return (results ?? []).map((r: any) => ({
    youtube_id: r.youtube_id,
    published_at: r.published_at ?? null,
    title: r.title,
    description: r.description ?? null,
    thumbnail_url: r.thumbnail_url ?? null,
    duration: r.duration ?? null,
    category_slug: r.category_slug,
  }));
}
