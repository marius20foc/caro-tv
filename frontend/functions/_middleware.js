/**
 * CARO.TV – Middleware Pages Functions (varianta fara next-on-pages).
 * Adauga headere de securitate pe toate raspunsurile.
 */
export async function onRequest(context) {
  const response = await context.next();

  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
