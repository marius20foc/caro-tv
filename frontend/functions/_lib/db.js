// ============================================================
// CARO.TV v4pro – acces D1 (varianta Pages Functions pure)
// Aceleasi interogari ca frontend/lib/db.ts, fara Next.js.
// v2: durata, channel_id, accent, is_active.
// ============================================================

import { resolveContextualLink } from './mapper.js';

const VIDEO_SELECT = `
  SELECT v.*, c.name AS category_name, c.icon AS category_icon,
         c.accent AS category_accent,
         c.default_product_url AS category_default_url
  FROM videos v
  LEFT JOIN categories c ON c.slug = v.category_slug
`;

function rowToVideo(row) {
  return {
    id: Number(row.id),
    category_slug: row.category_slug,
    youtube_id: row.youtube_id,
    title: row.title,
    description: row.description ?? null,
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

function rowToCategory(row) {
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

export async function listCategories(env) {
  const { results } = await env.DB.prepare(
    `SELECT c.*, (SELECT COUNT(*) FROM videos v WHERE v.category_slug = c.slug AND v.is_active = 1) AS video_count
     FROM categories c ORDER BY c.sort_order ASC`,
  ).all();
  return (results ?? []).map(rowToCategory);
}

export async function getCategoryBySlug(env, slug) {
  const row = await env.DB.prepare(
    `SELECT c.*, (SELECT COUNT(*) FROM videos v WHERE v.category_slug = c.slug AND v.is_active = 1) AS video_count
     FROM categories c WHERE c.slug = ?`,
  )
    .bind(slug)
    .first();
  return row ? rowToCategory(row) : null;
}

export async function listVideos(env, { category, limit = 24, offset = 0, featuredOnly = false, q } = {}) {
  const where = ['v.is_active = 1'];
  const params = [];

  if (category) {
    where.push('v.category_slug = ?');
    params.push(category);
  }
  if (featuredOnly) where.push('v.is_featured = 1');
  if (q && String(q).trim()) {
    where.push('(v.title LIKE ? OR v.description LIKE ? OR v.channel_title LIKE ?)');
    const like = `%${String(q).trim()}%`;
    params.push(like, like, like);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const cappedLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const cappedOffset = Math.max(Math.trunc(offset), 0);

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM videos v ${whereSql}`,
  )
    .bind(...params)
    .first();

  const { results } = await env.DB.prepare(
    `${VIDEO_SELECT} ${whereSql}
     ORDER BY v.published_at DESC, v.id DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(...params, cappedLimit, cappedOffset)
    .all();

  return {
    videos: (results ?? []).map(rowToVideo),
    total: Number(totalRow?.total ?? 0),
  };
}

export async function getVideoByYouTubeId(env, youtubeId) {
  const row = await env.DB.prepare(`${VIDEO_SELECT} WHERE v.youtube_id = ? AND v.is_active = 1`)
    .bind(youtubeId)
    .first();
  return row ? rowToVideo(row) : null;
}

export async function getFeatured(env, limit = 8) {
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const { results } = await env.DB.prepare(
    `${VIDEO_SELECT} WHERE v.is_featured = 1 AND v.is_active = 1
     ORDER BY v.views DESC, v.published_at DESC
     LIMIT ?`,
  )
    .bind(capped)
    .all();
  return (results ?? []).map(rowToVideo);
}

export async function getRelatedVideos(env, categorySlug, excludeYoutubeId, sameChannelId = null, limit = 6) {
  const capped = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const { results } = await env.DB.prepare(
    `${VIDEO_SELECT}
     WHERE v.category_slug = ? AND v.youtube_id <> ? AND v.is_active = 1
     ORDER BY (v.channel_id = ?) DESC, v.views DESC, v.published_at DESC
     LIMIT ?`,
  )
    .bind(categorySlug, excludeYoutubeId, sameChannelId ?? '', capped)
    .all();
  return (results ?? []).map(rowToVideo);
}

export async function getProductOverride(env, videoId) {
  const row = await env.DB.prepare(
    `SELECT * FROM video_product_overrides WHERE video_id = ?`,
  )
    .bind(videoId)
    .first();
  return row ?? null;
}

export async function listMappingsByCategory(env, categorySlug) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM product_mapping WHERE category_slug = ? AND is_active = 1 ORDER BY id ASC`,
  )
    .bind(categorySlug)
    .all();
  return results ?? [];
}

/** Ataseaza linkul contextual rezolvat fiecarui video (batch). */
export async function attachContextualLinks(env, videos) {
  if (!videos.length) return [];

  const ids = videos.map((v) => v.id);
  const idPh = ids.map(() => '?').join(',');
  const overrideRes = await env.DB.prepare(
    `SELECT * FROM video_product_overrides WHERE video_id IN (${idPh})`,
  )
    .bind(...ids)
    .all();
  const overrides = new Map();
  for (const r of overrideRes.results ?? []) overrides.set(Number(r.video_id), r);

  const slugs = [...new Set(videos.map((v) => v.category_slug))];
  const slugPh = slugs.map(() => '?').join(',');
  const mapRes = await env.DB.prepare(
    `SELECT * FROM product_mapping WHERE category_slug IN (${slugPh}) AND is_active = 1 ORDER BY id ASC`,
  )
    .bind(...slugs)
    .all();
  const mappingsByCat = new Map();
  for (const r of mapRes.results ?? []) {
    const arr = mappingsByCat.get(r.category_slug) ?? [];
    arr.push(r);
    mappingsByCat.set(r.category_slug, arr);
  }

  return videos.map((v) => ({
    ...v,
    contextualLink: resolveContextualLink({
      video: v,
      overrides: overrides.get(v.id) ?? null,
      mappings: mappingsByCat.get(v.category_slug) ?? [],
      defaultProductUrl: v.category_default_url,
    }),
  }));
}

export async function getVideoWithContext(env, youtubeId) {
  const video = await getVideoByYouTubeId(env, youtubeId);
  if (!video) return { video: null, link: null };
  const [overrides, mappings] = await Promise.all([
    getProductOverride(env, video.id),
    listMappingsByCategory(env, video.category_slug),
  ]);
  const link = resolveContextualLink({
    video,
    overrides,
    mappings,
    defaultProductUrl: video.category_default_url,
  });
  return { video, link };
}
