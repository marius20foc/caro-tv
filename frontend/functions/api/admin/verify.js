import { isAuthorized, unauthorizedResponse } from '../../_lib/auth.js';

/** GET /api/admin/verify (Pages Functions pure) – verifica parola de admin. */
export async function onRequestGet(context) {
  if (!isAuthorized(context.request, context.env)) return unauthorizedResponse();
  return Response.json({ ok: true });
}
