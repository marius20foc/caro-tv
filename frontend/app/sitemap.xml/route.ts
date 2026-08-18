import { absoluteUrl } from '@/lib/seo';
import { listCategorySlugsForSitemap, listVideosForSitemap } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** GET /sitemap.xml – sitemap + extensia Google Video (video:video tags). */
export async function GET() {
  let categories: Awaited<ReturnType<typeof listCategorySlugsForSitemap>> = [];
  let videos: Awaited<ReturnType<typeof listVideosForSitemap>> = [];

  try {
    [categories, videos] = await Promise.all([
      listCategorySlugsForSitemap(),
      listVideosForSitemap(),
    ]);
  } catch {
    // Daca D1 nu e disponibil, livram minimul (pagini statice) – sitemap-ul nu trebuie sa cada.
  }

  const urls: string[] = [];

  urls.push(`<url>
  <loc>${escapeXml(absoluteUrl('/'))}</loc>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>`);

  urls.push(`<url>
  <loc>${escapeXml(absoluteUrl('/contact'))}</loc>
  <changefreq>monthly</changefreq>
  <priority>0.3</priority>
</url>`);

  for (const c of categories) {
    urls.push(`<url>
  <loc>${escapeXml(absoluteUrl(`/category/${c.slug}`))}</loc>${c.updated_at ? `\n  <lastmod>${escapeXml(c.updated_at)}</lastmod>` : ''}
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>`);
  }

  for (const v of videos) {
    const videoTags = `<video:video>
    <video:thumbnail_loc>${escapeXml(v.thumbnail_url ?? `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`)}</video:thumbnail_loc>
    <video:title>${escapeXml(v.title)}</video:title>
    <video:description>${escapeXml((v.description ?? '').slice(0, 2048))}</video:description>
    <video:publication_date>${v.published_at ? escapeXml(v.published_at.slice(0, 10)) : ''}</video:publication_date>
    <video:family_friendly>yes</video:family_friendly>
    <video:live>no</video:live>
  </video:video>`;

    urls.push(`<url>
  <loc>${escapeXml(absoluteUrl(`/video/${v.youtube_id}`))}</loc>${v.published_at ? `\n  <lastmod>${escapeXml(v.published_at)}</lastmod>` : ''}
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
  ${videoTags}
</url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
