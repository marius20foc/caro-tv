// ============================================================
// CARO.TV v4pro – client YouTube Data API v3 (DOAR 1-unitate endpoints)
// ------------------------------------------------------------
// REGULA DE COTA (10.000 unitati/zi):
//   - NU folosim /search (100 unitati).
//   - Folosim doar: playlistItems.list, videos.list, channels.list (1 unitate).
// v2: paginare playlistItems (pana la maxPages * 50), durata video.
// Sincronizarea zilnica ruleaza in workers/cron/index.js (implementare
// self-contained, identica logic). Acest modul este referinta pentru
// refacerea manuala / tool-uri de admin.
// ============================================================

import { getRequestContext } from '@cloudflare/next-on-pages';

const API_BASE = 'https://www.googleapis.com/youtube/v3';
export const YOUTUBE_MAX_RESULTS = 50;

export interface YouTubeVideoDetails {
  youtube_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  channel_title: string;
  channel_id: string;
  published_at: string;
  duration: string;
  views: number;
  likes: number;
}

export interface YouTubePlaylistItem {
  youtube_id: string;
  title: string;
  published_at: string;
}

export function getYouTubeApiKey(): string | undefined {
  const env = getRequestContext().env as unknown as CloudflareEnv;
  return env?.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;
}

async function apiGet<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const key = getYouTubeApiKey();
  if (!key) {
    throw new Error('YOUTUBE_API_KEY lipseste – seteaz-o in variabilele de mediu.');
  }
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set('key', key);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  const data: any = await res.json().catch(() => null);

  if (!res.ok || data?.error) {
    const code = data?.error?.code ?? res.status;
    const msg = data?.error?.message ?? res.statusText;
    if (code === 403) {
      throw new Error(`YouTube API: cota depasita sau acces interzis (${msg}).`);
    }
    throw new Error(`YouTube API ${endpoint} esuat: ${code} ${msg}`);
  }
  return data as T;
}

/** playlistItems.list (1 unitate) – o singura pagina (max 50). */
export async function fetchPlaylistItemsPage(
  playlistId: string,
  pageToken?: string,
  maxResults = YOUTUBE_MAX_RESULTS,
): Promise<{ items: YouTubePlaylistItem[]; nextPageToken?: string }> {
  const params: Record<string, string> = {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: String(Math.min(maxResults, 50)),
  };
  if (pageToken) params.pageToken = pageToken;

  const data = await apiGet<any>('playlistItems', params);

  return {
    items: (data.items ?? [])
      .filter((it: any) => it?.contentDetails?.videoId)
      .map((it: any) => ({
        youtube_id: it.contentDetails.videoId,
        title: it.snippet?.title ?? '',
        published_at: it.snippet?.publishedAt ?? '',
      })),
    nextPageToken: data.nextPageToken || undefined,
  };
}

/**
 * playlistItems.list cu paginare completa (maxPages pagini).
 * Fiecare pagina = 1 unitate de cota.
 */
export async function fetchPlaylistVideoIds(
  playlistId: string,
  maxPages = 5,
): Promise<YouTubePlaylistItem[]> {
  const items: YouTubePlaylistItem[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < Math.max(1, maxPages); page++) {
    const { items: pageItems, nextPageToken } = await fetchPlaylistItemsPage(
      playlistId,
      pageToken,
    );
    items.push(...pageItems);
    if (!nextPageToken) break;
    pageToken = nextPageToken;
  }
  return items;
}

/** videos.list (1 unitate) – detalii + statistici + durata, batch de max 50 id-uri. */
export async function fetchVideosDetails(videoIds: string[]): Promise<YouTubeVideoDetails[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const out: YouTubeVideoDetails[] = [];
  for (const chunk of chunks) {
    const data = await apiGet<any>('videos', {
      part: 'snippet,contentDetails,statistics',
      id: chunk.join(','),
    });
    for (const it of data.items ?? []) {
      const st = it.statistics ?? {};
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
        duration: it.contentDetails?.duration ?? '',
        views: Number(st.viewCount ?? 0),
        likes: Number(st.likeCount ?? 0),
      });
    }
  }
  return out;
}

/** channels.list (1 unitate) – titluri de canal (pentru curatenie / meta). */
export async function fetchChannelTitles(channelIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniq = [...new Set(channelIds)].slice(0, 50);
  if (!uniq.length) return map;

  const data = await apiGet<any>('channels', { part: 'snippet', id: uniq.join(',') });
  for (const it of data.items ?? []) {
    map.set(it.id, it.snippet?.title ?? '');
  }
  return map;
}
