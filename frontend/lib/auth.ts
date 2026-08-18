// ============================================================
// CARO.TV v4pro – autentificare minimala pentru /api/admin/*
// Model stateless: Bearer token comparat cu secretul ADMIN_TOKEN
// (setat in Cloudflare Dashboard / .env.local).
// ============================================================

import { getRequestContext } from '@cloudflare/next-on-pages';

export function getAdminToken(): string | undefined {
  const env = getRequestContext().env as unknown as CloudflareEnv;
  return env?.ADMIN_TOKEN || process.env.ADMIN_TOKEN;
}

export function isAuthorized(request: Request): boolean {
  const token = getAdminToken();
  if (!token) return false;
  const auth = request.headers.get('authorization') ?? '';
  return auth === `Bearer ${token}`;
}

export function unauthorizedResponse(): Response {
  return Response.json({ error: 'Neautorizat' }, { status: 401 });
}

export function requireMethod(request: Request, method: string): boolean {
  return request.method === method;
}
