import { getRequestContext } from '@cloudflare/next-on-pages';
import { isAuthorized, unauthorizedResponse } from '@/lib/auth';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sync – porneste sincronizarea cron-ului in FUNDAL.
 *
 * Sincronizarea completa dureaza 1-3 minute (playlist-uri + traduceri AI
 * + trending YouTube). In loc sa tinem conexiunea deschisa (si sa fie
 * taiata de Cloudflare), raspundem instant cu "started" si lasam
 * worker-ul sa ruleze prin ctx.waitUntil – fara timeout-uri, fara
 * "Eroare de retea".
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const { env, ctx } = getRequestContext();
    let workerUrl = (env.CRON_WORKER_URL || process.env.CRON_WORKER_URL || '').replace(/\/+$/, '');
    // daca utilizatorul a omis schema (ex: "caro-tv-cron.x.workers.dev"), o adaugam
    if (workerUrl && !/^https?:\/\//i.test(workerUrl)) {
      workerUrl = `https://${workerUrl}`;
    }
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

    // pornim sincronizarea in fundal; raspunsul vine imediat
    ctx.waitUntil(
      fetch(workerUrl, {
        method: 'POST',
        headers: { authorization: `Bearer ${manualToken}` },
      })
        .then((r) => r.json())
        .then((data) => console.log('CARO.TV manual sync via admin:', JSON.stringify(data)))
        .catch((e) => console.error('CARO.TV sync error:', e instanceof Error ? e.message : String(e))),
    );

    return Response.json({ ok: true, started: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Eroare interna' },
      { status: 500 },
    );
  }
}
