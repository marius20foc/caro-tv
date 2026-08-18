import { SITE_URL } from '@/lib/constants';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** GET /robots.txt – indexare completa, /api si /admin blocate. */
export async function GET() {
  const robots = `# CARO.TV – robots.txt (v4pro)
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /cautare

User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /cautare

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /admin

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
