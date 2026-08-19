// ============================================================
// CARO.TV v4pro – Worker CRON: sincronizare zilnica YouTube -> D1
// ------------------------------------------------------------
// Trigger: "0 3 * * *" (03:00 UTC, zilnic) – vezi wrangler.toml
// Reguli cota YouTube (10.000 unitati/zi):
//   - DOAR playlistItems.list, videos.list (1 unitate fiecare)
//   - NU /search (100 unitati)
// Buget: 10 categorii x (max 5 pagini playlistItems + 1 videos) = 60 unitati/zi
// v4pro: paginare playlist (pana la 250 video/categorie), durata,
//        channel_id, cache thumbnails in R2 (optional), is_active.
// ============================================================

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const PLAYLIST_MAX = 50;
const PLAYLIST_MAX_PAGES = 5; // 250 videoclipuri / categorie max

// ------------------------------------------------------------
// YouTube API (self-contained – nu depinde de frontend)
// ------------------------------------------------------------

async function apiGet(apiKey, endpoint, params) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set('key', apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  const data = await res.json().catch(() => null);

  if (!res.ok || data?.error) {
    const code = data?.error?.code ?? res.status;
    const msg = data?.error?.message ?? res.statusText;
    if (code === 403) {
      throw new Error(`YouTube API: cota depasita sau acces interzis (${msg})`);
    }
    throw new Error(`YouTube API ${endpoint} esuat: ${code} ${msg}`);
  }
  return data;
}

/** playlistItems.list (1 unitate/pagina) – cu paginare completa. */
async function fetchPlaylistVideoIds(apiKey, playlistId) {
  const items = [];
  let pageToken = null;

  for (let page = 0; page < PLAYLIST_MAX_PAGES; page++) {
    const params = {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: String(PLAYLIST_MAX),
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await apiGet(apiKey, 'playlistItems', params);
    for (const it of data.items ?? []) {
      if (!it?.contentDetails?.videoId) continue;
      items.push({
        youtube_id: it.contentDetails.videoId,
        title: it.snippet?.title ?? '',
        published_at: it.snippet?.publishedAt ?? '',
      });
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return items;
}

/** videos.list (1 unitate, batch de 50) -> detalii + statistici + durata. */
async function fetchVideosDetails(apiKey, videoIds) {
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50));

  const out = [];
  for (const chunk of chunks) {
    const data = await apiGet(apiKey, 'videos', {
      part: 'snippet,contentDetails,statistics',
      id: chunk.join(','),
    });
    for (const it of data.items ?? []) {
      const st = it.statistics ?? {};
      const durationIso = it.contentDetails?.duration ?? '';
      out.push({
        youtube_id: it.id,
        title: it.snippet?.title ?? '',
        description: it.snippet?.description ?? '',
        thumbnail_url:
          it.snippet?.thumbnails?.maxres?.url ||
          it.snippet?.thumbnails?.high?.url ||
          it.snippet?.thumbnails?.medium?.url ||
          '',
        channel_title: it.snippet?.channelTitle ?? '',
        channel_id: it.snippet?.channelId ?? '',
        published_at: it.snippet?.publishedAt ?? '',
        duration: durationIso,
        duration_seconds: parseDurationSeconds(durationIso),
        views: Number(st.viewCount ?? 0),
        likes: Number(st.likeCount ?? 0),
      });
    }
  }
  return out;
}

/** ISO 8601 (PT12M34S) -> secunde (pentru filtrare rapida in SQL). */
function parseDurationSeconds(iso) {
  const match = String(iso).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

// ------------------------------------------------------------
// Mapare produse (aceeasi regula de linkuire ca frontend)
// ------------------------------------------------------------

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Curata descrierea: elimina ORICE rand care contine un link
 * (advertising catre alte magazine/pagini) + randuri goale excesive.
 */
function sanitizeDescription(description) {
  const lines = String(description ?? '')
    .split('\n')
    .filter((line) => !/https?:\/\/|www\./i.test(line));

  const out = [];
  let blank = 0;
  for (const line of lines) {
    if (!line.trim()) {
      blank++;
      if (blank > 2) continue;
    } else {
      blank = 0;
    }
    out.push(line);
  }
  return out.join('\n').trim();
}

/**
 * Relevantă = titlul + descrierea contin minim 2 termeni de detailing.
 * Folosita ca featured-ul sa arate DOAR continut pe subiect
 * (nu relaxing music / piano music / alte videoclipuri straine de nisa).
 */
const RELEVANCE_TERMS = [
  'detailing', 'detail', 'wash', 'spalat', 'spalare', 'polish', 'polishing',
  'ceramic', 'coating', 'microfiber', 'microfibra', 'prosop', 'laveta',
  'garage', 'garaj', 'car', 'auto', 'masina', 'carnauba', 'wax', 'ceara',
  'sealant', 'pad', 'protectie', 'vopsea', 'paint', 'foam', 'spuma',
  'buffing', 'glaze', 'tire', 'anvelopa', 'led', 'lampa', 'aspirator',
  'extractor', 'piele', 'plastic', 'geam', 'janta', 'unboxing', 'review',
  'test', 'folie', 'carbon', 'interior', 'exterior', 'degresant', 'sampon',
];

/** Termeni care EXCLUD automat videoclipul (imobiliare, muzica, alte nise). */
const NEGATIVE_TERMS = [
  'imobiliar', 'imobiliare', 'apartament', 'penthouse', 'vila', 'casa de vanzare',
  'house tour', 'real estate', 'property', 'home tour', 'de inchiriat', 'casa la',
  'muzica', 'music', 'piano', 'ambient', 'relaxing', 'asmr', 'meditation',
  'song', 'remix', 'lyrics', 'cover', 'melodie', 'relaxare', 'concert',
  'trap', 'hip hop', 'lofi', 'instrumental', 'mix 202', 'playlist de',
  'audiobook', 'podcast', 'travel vlog', 'reteta', 'cooking', 'gaming',
  'gameplay', 'minecraft', 'fortnite', 'fotbal', 'football', 'politica',
  'stiri', 'news', 'nunta', 'botez', 'vacanta',
];

/**
 * Verificare video 1 cu 1 la import:
 *  1) orice termen negativ (imobiliare/muzica/etc.) -> EXCLUS
 *  2) minim 2 termeni de detailing -> relevant
 */
function isRelevantVideo(title, description) {
  const hay = normalizeText(`${title} ${String(description ?? '').slice(0, 600)}`);
  for (const kw of NEGATIVE_TERMS) {
    if (hay.includes(kw)) return false;
  }
  let hits = 0;
  for (const kw of RELEVANCE_TERMS) {
    if (hay.includes(kw)) hits++;
    if (hits >= 2) return true;
  }
  return false;
}

function keywordsMatch(title, description, keywords) {
  if (!keywords) return false;
  const haystack = normalizeText(`${title} ${description ?? ''}`);
  return String(keywords)
    .split(',')
    .map(normalizeText)
    .filter(Boolean)
    .some((kw) => haystack.includes(kw));
}

/**
 * Precompute product_url/product_name (produs EXACT) – doar daca exista
 * keyword-match; altfel ramane NULL (fallback-ul pe categorie se aplica
 * la citire). Override-urile manuale au prioritate la citire si nu
 * sunt suprascrise aici.
 */
function resolveProduct(mappings, video) {
  for (const m of mappings) {
    if (m.cleanx_product_url && keywordsMatch(video.title, video.description, m.keywords)) {
      return { product_url: m.cleanx_product_url, product_name: m.cleanx_product_name ?? null };
    }
  }
  return { product_url: null, product_name: null };
}

// ------------------------------------------------------------
// Sincronizare
// ------------------------------------------------------------

async function syncCategory(env, category, report) {
  if (!category.playlist_id) {
    report.skipped.push(category.slug);
    return;
  }

  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY lipseste (secret)');

  // 1) playlistItems.list (pagini, 1 unitate/pagina)
  const playlistItems = await fetchPlaylistVideoIds(apiKey, category.playlist_id);
  const ids = playlistItems.map((p) => p.youtube_id);

  // 2) videos.list (detalii + statistici + durata)
  const details = await fetchVideosDetails(apiKey, ids);
  const byId = new Map(details.map((d) => [d.youtube_id, d]));

  // 2b) Videoclipuri STERSE/private pe YouTube: videos.list nu le mai
  //     returneaza -> le stergem automat din baza, fara confirmare.
  const deletedStmt = env.DB.prepare(`DELETE FROM videos WHERE youtube_id = ?`);
  const deletedBatch = [];
  for (const id of ids) {
    if (!byId.has(id)) deletedBatch.push(deletedStmt.bind(id));
  }
  if (deletedBatch.length) {
    await env.DB.batch(deletedBatch);
  }
  report.deleted = (report.deleted ?? 0) + deletedBatch.length;

  // 3) mapping-uri pentru linkuri contextuale
  const { results: mappings } = await env.DB.prepare(
    `SELECT * FROM product_mapping WHERE category_slug = ? AND is_active = 1 ORDER BY id ASC`,
  )
    .bind(category.slug)
    .all();

  const upsert = env.DB.prepare(
    `INSERT INTO videos
       (category_slug, youtube_id, title, description, thumbnail_url, channel_title,
        channel_id, published_at, duration, duration_seconds, views, likes, product_url,
        product_name, last_updated, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
     ON CONFLICT(youtube_id) DO UPDATE SET
       category_slug = excluded.category_slug,
       title = excluded.title,
       description = excluded.description,
       thumbnail_url = excluded.thumbnail_url,
       channel_title = excluded.channel_title,
       channel_id = excluded.channel_id,
       published_at = excluded.published_at,
       duration = excluded.duration,
       duration_seconds = excluded.duration_seconds,
       views = excluded.views,
       likes = excluded.likes,
       product_url = excluded.product_url,
       product_name = excluded.product_name,
       is_active = excluded.is_active,
       last_updated = CURRENT_TIMESTAMP`,
  );

  const statements = [];
  for (const item of playlistItems) {
    const d = byId.get(item.youtube_id);
    // videoclip sters/privat -> nu il inseram (deja sters mai sus daca exista)
    if (!d) continue;

    // verificare 1 cu 1: relevant pentru nisa de detailing?
    const relevant = isRelevantVideo(d.title, d.description);
    if (!relevant) report.irrelevant = (report.irrelevant ?? 0) + 1;

    // descriere curatata: fara randuri cu linkuri (advertising)
    const cleanDescription = sanitizeDescription(d.description);
    const { product_url, product_name } = resolveProduct(mappings, { ...d, description: cleanDescription });
    statements.push(
      upsert.bind(
        category.slug,
        d.youtube_id,
        d.title,
        cleanDescription,
        d.thumbnail_url,
        d.channel_title,
        d.channel_id,
        d.published_at,
        d.duration,
        d.duration_seconds,
        d.views,
        d.likes,
        product_url,
        product_name,
        relevant ? 1 : 0,
      ),
    );
  }

  if (statements.length) {
    await env.DB.batch(statements);
  }

  // (Optional) cache thumbnails in R2
  await cacheThumbnails(env, details.filter((d) => d.thumbnail_url));

  report.categories.push({
    slug: category.slug,
    playlist_id: category.playlist_id,
    fetched: playlistItems.length,
    upserted: statements.length,
  });
}

/** Marcheaza featured: top 8 dupa views, DOAR videoclipuri relevante (detailing). */
async function refreshFeatured(env) {
  await env.DB.prepare(`UPDATE videos SET is_featured = 0 WHERE is_featured = 1`).run();

  const { results } = await env.DB.prepare(
    `SELECT youtube_id, title, description FROM videos
     WHERE is_active = 1 AND last_updated > datetime('now', '-30 days')
     ORDER BY views DESC LIMIT 60`,
  ).all();

  const featuredIds = (results ?? [])
    .filter((v) => isRelevantVideo(v.title, v.description))
    .slice(0, 8)
    .map((v) => v.youtube_id);

  if (featuredIds.length) {
    await env.DB.prepare(
      `UPDATE videos SET is_featured = 1 WHERE youtube_id IN (${featuredIds.map(() => '?').join(',')})`,
    )
      .bind(...featuredIds)
      .run();
  }
  return { featured: featuredIds.length };
}

/**
 * (Optional) Copiaza thumbnail-urile in R2 (binding THUMBS).
 * Activ doar daca variabila CACHE_THUMBS === '1'.
 */
async function cacheThumbnails(env, details) {
  if (!env.THUMBS || env.CACHE_THUMBS !== '1') return;
  const tasks = [];
  for (const d of details) {
    if (!d.thumbnail_url) continue;
    const key = `thumbs/${d.youtube_id}.jpg`;
    tasks.push(
      (async () => {
        try {
          const existing = await env.THUMBS.get(key);
          if (existing) return;
          const res = await fetch(d.thumbnail_url);
          if (!res.ok) return;
          const bytes = await res.arrayBuffer();
          await env.THUMBS.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
        } catch {
          /* thumbnail caching este best-effort */
        }
      })(),
    );
  }
  await Promise.allSettled(tasks);
}

/**
 * Traduce descrierile videoclipurilor in romana folosind Workers AI
 * (modelul m2m100-1.2b – GRATUIT in limita Workers AI, ZERO cost YouTube API).
 * Se traduce incremental: maxim `limit` descrieri pe rulare, doar cele netraduse.
 */
function looksRomanian(text) {
  return /[ăâîșțĂÂÎȘȚ]/.test(text);
}

function cleanForTranslation(description) {
  const text = sanitizeDescription(description).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  // limitam la ~1500 caractere, taiat la granita de propozitie
  if (text.length > 1500) {
    const cut = text.slice(0, 1500);
    const lastDot = cut.lastIndexOf('. ');
    return (lastDot > 400 ? cut.slice(0, lastDot + 1) : cut) + '…';
  }
  return text;
}

async function translateDescriptions(env, limit = 40) {
  const aiAvailable = Boolean(env.AI);
  if (!aiAvailable) {
    console.log('Workers AI indisponibil – sarim traducerea descrierilor.');
    return { translated: 0, aiAvailable: false };
  }

  const { results } = await env.DB.prepare(
    `SELECT id, youtube_id, description FROM videos
     WHERE description IS NOT NULL AND description != ''
       AND (description_ro IS NULL OR description_ro = '')
     ORDER BY last_updated DESC LIMIT ?`,
  )
    .bind(Math.min(Math.max(limit, 1), 100))
    .all();

  let translated = 0;
  for (const row of results ?? []) {
    const text = cleanForTranslation(row.description);
    if (!text || looksRomanian(text)) continue; // deja in romana sau gol

    try {
      const resp = await env.AI.run('@cf/meta/m2m100-1.2b', {
        text,
        source_lang: 'english',
        target_lang: 'romanian',
      });
      const out = typeof resp === 'string' ? resp : resp?.translated_text ?? '';
      if (out && out.trim()) {
        await env.DB.prepare(
          `UPDATE videos SET description_ro = ?, translated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
          .bind(String(out).trim(), row.id)
          .run();
        translated++;
      }
    } catch {
      /* o descriere netradusa nu blocheaza sincronizarea */
    }
  }

  return { translated, aiAvailable: true };
}

/**
 * Trending-ul oficial YouTube (statistici YouTube, nu estimari locale):
 * videos.list cu chart=mostPopular, regionCode=RO, categoria Autos & Vehicles.
 * Cost: 1 unitate/zi.
 */
async function refreshYoutubeTrending(env) {
  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) return { fetched: 0 };

  const data = await apiGet(apiKey, 'videos', {
    part: 'snippet,statistics',
    chart: 'mostPopular',
    regionCode: 'RO',
    videoCategoryId: '2',
    maxResults: '12',
  });

  const rows = [];
  (data.items ?? []).forEach((it, i) => {
    if (!it?.id) return;
    const st = it.statistics ?? {};
    rows.push({
      youtube_id: it.id,
      title: it.snippet?.title ?? '',
      thumbnail_url:
        it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.high?.url || '',
      channel_title: it.snippet?.channelTitle ?? '',
      views: Number(st.viewCount ?? 0),
      published_at: it.snippet?.publishedAt ?? '',
      rank: i + 1,
    });
  });

  if (rows.length) {
    await env.DB.prepare(`DELETE FROM yt_trending`).run();
    const stmt = env.DB.prepare(
      `INSERT INTO yt_trending (youtube_id, title, thumbnail_url, channel_title, views, published_at, rank, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    );
    await env.DB.batch(
      rows.map((r) =>
        stmt.bind(r.youtube_id, r.title, r.thumbnail_url, r.channel_title, r.views, r.published_at, r.rank),
      ),
    );
  }
  return { fetched: rows.length };
}

/**
 * Migrare AUTOMATA de schema (idempotenta): orice baza legata la worker
 * se auto-repara la fiecare rulare. Erorile "duplicate" sunt ignorate.
 */
async function ensureSchema(env) {
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
      await env.DB.exec(sql);
    } catch {
      /* deja exista – ignoram */
    }
  }
}

async function syncAll(env) {
  const report = {
    started_at: new Date().toISOString(),
    categories: [],
    skipped: [],
    errors: [],
    translated: 0,
    yt_trending: 0,
    deleted: 0,
    irrelevant: 0,
  };

  // auto-reparare schema inainte de orice
  await ensureSchema(env);

  const { results: categories } = await env.DB.prepare(
    `SELECT slug, playlist_id FROM categories ORDER BY sort_order ASC`,
  ).all();

  for (const category of categories) {
    try {
      await syncCategory(env, category, report);
    } catch (err) {
      report.errors.push({
        category: category.slug,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    await refreshFeatured(env);
  } catch (err) {
    report.errors.push({
      category: 'featured',
      message: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    const tr = await translateDescriptions(env);
    report.translated = tr.translated;
    report.ai_available = tr.aiAvailable;
  } catch (err) {
    report.ai_available = false;
    report.errors.push({
      category: 'translate',
      message: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    const yt = await refreshYoutubeTrending(env);
    report.yt_trending = yt.fetched;
  } catch (err) {
    report.errors.push({
      category: 'yt_trending',
      message: err instanceof Error ? err.message : String(err),
    });
  }

  report.finished_at = new Date().toISOString();
  return report;
}

// ------------------------------------------------------------
// Handlers Worker
// ------------------------------------------------------------

export default {
  /** Cron zilnic 03:00 UTC */
  async scheduled(_event, env, _ctx) {
    const report = await syncAll(env);
    console.log('CARO.TV cron report:', JSON.stringify(report));
  },

  /** Trigger manual: curl -X POST -H "Authorization: Bearer <MANUAL_TOKEN>" https://caro-tv-cron.<account>.workers.dev/ */
  async fetch(request, env) {
    const token = env.MANUAL_TOKEN;
    if (!token) return new Response('Manual trigger dezactivat', { status: 403 });
    const auth = request.headers.get('authorization') || '';
    if (auth !== `Bearer ${token}`) return new Response('Neautorizat', { status: 401 });

    const report = await syncAll(env);
    console.log('CARO.TV manual sync:', JSON.stringify(report));
    return Response.json(report);
  },
};
