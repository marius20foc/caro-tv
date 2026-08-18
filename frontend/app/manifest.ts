import type { MetadataRoute } from 'next';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/constants';

/** PWA manifest – instalare pe mobil/desktop cu iconița CARO.TV. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'CARO.TV',
    description: SITE_TAGLINE,
    id: SITE_URL,
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    lang: 'ro',
    categories: ['video', 'automotive', 'entertainment'],
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
