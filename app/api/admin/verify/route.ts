import { isAuthorized, unauthorizedResponse } from '@/lib/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/verify – verifica parola de admin INAINTE de a intra in
 * panou. Nu expune nimic: raspunde doar { ok: true } sau 401.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  return Response.json({ ok: true });
}
