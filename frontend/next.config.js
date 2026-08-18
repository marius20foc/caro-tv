/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  'img-src \'self\' data: https://i.ytimg.com https://img.youtube.com https://*.ytimg.com',
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
  "font-src 'self' data:",
  "connect-src 'self' https://cloudflareinsights.com",
  "media-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  // YouTube thumbnails sunt remote; Cloudflare Pages nu suporta next/image optimization
  images: { unoptimized: true },
  // Tranzitii de pagina animate (View Transitions API) – Link viewTransition
  experimental: { viewTransition: true },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [...securityHeaders, { key: 'Content-Security-Policy', value: csp }],
      },
    ];
  },
};

// In dezvoltare, expune binding-urile Cloudflare (D1/R2) din wrangler.toml
// catre Next.js, astfel incat getRequestContext() sa functioneze local.
if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
  setupDevPlatform({ configPath: '../wrangler.toml' }).catch(console.error);
}

module.exports = nextConfig;
