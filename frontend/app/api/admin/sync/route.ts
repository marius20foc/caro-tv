import { getRequestContext } from '@cloudflare/next-on-pages';
import { isAuthorized, unauthorizedResponse } from '@/lib/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sync – porneste sincronizarea cron-ului de la distanta.
 * Pages apeleaza worker-ul caro-tv-cron (server-side, fara probleme CORS)
 * folosind MANUAL_TOKEN-ul partajat. Butonul din admin nu mai depinde de
 * „Trigger now" din dashboard-ul Cloudflare.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const env = getRequestContext().env as unknown as CloudflareEnv;
    const workerUrl = (env.CRON_WORKER_URL || process.env.CRON_WORKER_URL || '').replace(/\/+$/, '');
    const manualToken = env.MANUAL_TOKEN || process.env.MANUAL_TOKEN;

    if (!workerUrl || !manualToken) {
      return Response.json(
        {
          error:
            'Configureaza pe proiectul Pages: secretul MANUAL_TOKEN (aceeasi valoare ca pe worker) si variabila CRON_WORKER_URL (ex: https://caro-tv-cron.<subdomeniul-tau>.workers.dev).',
        },
        { status: 500 },
      );
    }

    const res = await fetch(workerUrl, {
      method: 'POST',
      headers: { authorization: `Bearer ${manualToken}` },
    });
    const data: any = await res.json().catch(() => null);

    if (!res.ok) {
      return Response.json(
        { error: data?.error ?? `Cron-ul a raspuns cu status ${res.status}` },
        { status: 502 },
      );
    }
    return Response.json({ ok: true, report: data });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}
