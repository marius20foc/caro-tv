import type { Metadata, Viewport } from 'next';
import '@fontsource/chakra-petch/400.css';
import '@fontsource/chakra-petch/500.css';
import '@fontsource/chakra-petch/600.css';
import '@fontsource/chakra-petch/700.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@/styles/globals.css';
import '@/styles/sci-fi.css';

import BottomNav from '@/components/BottomNav';
import BackToTop from '@/components/BackToTop';
import { CF_BEACON_TOKEN, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/constants';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo';

// Script anti-FOUC: aplica tema salvata INAINTE de primul paint.
const themeInitScript = `(function(){try{var t=localStorage.getItem('caro_theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Videoclipuri Detailing Auto | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'CARO.TV – agregator video sci-fi de detailing auto: echipament garaje, iluminat, produse detailing, prosoape microfibra, fibra carbon, protectii ceramice, interior si exterior auto, unboxing & review-uri.',
  keywords: [
    'detailing auto',
    'video detailing',
    'caro.tv',
    'cleanx.ro',
    'prosoape microfibra',
    'protectii ceramice',
    'fibra carbon',
    'echipament garaj',
    'unboxing detailing',
  ],
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} – Universul sci-fi al detailing-ului auto`,
    description: SITE_TAGLINE,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} – Detailing auto, stil sci-fi`,
    description: SITE_TAGLINE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/icon.svg' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Layout RADACINA – complet static (fara D1, fara force-dynamic).
 * Cloudflare Pages cere ca pagina 404 globala sa fie statica; paginile
 * site-ului primesc shell-ul dinamic din layout-ul (site).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = [websiteJsonLd(), organizationJsonLd()];

  return (
    <html lang="ro" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {jsonLd.map((schema, i) => (
          <script
            key={`jsonld-${i}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {CF_BEACON_TOKEN ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${CF_BEACON_TOKEN}"}`}
          />
        ) : null}
      </head>
      <body className="pb-16 md:pb-0">
        {children}
        <BackToTop />
        <BottomNav />
      </body>
    </html>
  );
}
