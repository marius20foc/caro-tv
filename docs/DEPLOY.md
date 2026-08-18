# 🚀 CARO.TV – Deploy pas-cu-pas (Cloudflare)

## 0. Prerequisites

- Cont **Cloudflare** (domeniu `caro.tv` adăugat ca zone).
- **Node.js ≥ 18** + npm.
- Cheie **YouTube Data API v3** (Google Cloud Console → API & Services → Credentials → *API key*,
  restrict la YouTube Data API v3, server-side).

```bash
npm install -g wrangler   # sau folosim npx wrangler din proiect
npx wrangler login        # autentificare Cloudflare
```

---

## 1. Creează baza de date D1

```bash
npx wrangler d1 create caro-tv-db
# → îți va afișa un database_id. Copiază-l în TREI locuri:
#   1. wrangler.toml                  →  database_id
#   2. frontend/wrangler.toml         →  database_id (folosit de next-on-pages la build)
#   3. workers/cron/wrangler.toml     →  database_id
```

Aplică schema (remote):

```bash
npx wrangler d1 execute caro-tv-db --remote --file=migrations/0001_init.sql
```

Verifică:

```bash
npx wrangler d1 execute caro-tv-db --remote --command="SELECT slug, name FROM categories ORDER BY sort_order"
```

> Pentru test local: `npm run db:local:init` (aplică pe D1 local Miniflare).

---

## 2. Instalează dependențele

```bash
npm run install:frontend
```

Creează `frontend/.env.local` din `.env.example` (doar pentru dezvoltare locală;
în producție variabilele se pun în dashboard Cloudflare).

---

## 3. Build + verificare locală

```bash
npm run dev            # http://localhost:3000 (D1 local, binding-uri din wrangler.toml)
npm run build          # = next-on-pages → frontend/.vercel/output/static
npm run preview        # build + wrangler pages dev (simulează Pages cu D1 local)
```

---

## 4. Configurare variabile & binding-uri în Cloudflare Dashboard

**Cloudflare Dashboard → Workers & Pages → proiectul `caro-tv` → Settings → Bindings / Variables:**

| Tip | Nume | Valoare |
|---|---|---|
| D1 database | `DB` | `caro-tv-db` |
| R2 bucket (opțional) | `THUMBS` | `caro-tv-thumbs` |
| Secret | `YOUTUBE_API_KEY` | cheia YouTube (doar backend) |
| Secret | `ADMIN_TOKEN` | token lung, aleator (protejează /admin) |
| Text var | `SITE_URL` | `https://caro.tv` |
| Text var | `CLEANX_HOME` | `https://cleanx.ro` |
| Text var (opțional) | `CF_BEACON_TOKEN` | token Cloudflare Web Analytics |

---

## 5. Deploy Cloudflare Pages

### Varianta A – GitHub + Pages (recomandat, build automat)

1. Creează repo GitHub (ex: `caro-tv`) și urcă acest folder.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Setați:
   - **Framework preset:** `Next.js`
   - **Build command:** `npm run install:frontend && npm run build`
   - **Build output directory:** `frontend/.vercel/output/static`
   - *De asemenea*: în *Settings → Builds*, adaugă variabila de build `NODE_VERSION=20`.
4. După primul build, leagă domeniul **caro.tv** (Pages → Custom domains → `caro.tv` + `www`).
5. Binding-urile D1/R2/var de la pasul 4 se configurează la **Settings → Bindings** pe proiectul Pages.

### Varianta B – CLI (wrangler)

```bash
cd frontend
npx wrangler pages project create caro-tv --production-branch main
npm run build
npx wrangler pages deploy .vercel/output/static \
  --project-name caro-tv \
  --d1 DB=<D1_DATABASE_ID> \
  --var SITE_URL:https://caro.tv \
  --var CLEANX_HOME:https://cleanx.ro
```

> **Important:** alege O singură cale API. Implicit proiectul folosește **Route Handlers
> (`app/api/*`) via next-on-pages** (acoperite de build). Folderul `frontend/functions/`
> este alternativa „Pages Functions pure” — NU o activa simultan cu next-on-pages
> (ar duce la rutare dublă). Vezi nota din README.

---

## 6. Deploy cron worker (sincronizare zilnică YouTube → D1)

```bash
cd workers/cron
# setează secretul cheii YouTube
npx wrangler secret put YOUTUBE_API_KEY
# (opțional) token pentru trigger manual
npx wrangler secret put MANUAL_TOKEN
# deploy + activare cron (trigger: "0 3 * * *")
npx wrangler deploy
```

Verificare: Workers → `caro-tv-cron` → **Cron Triggers** → „Trigger now” (sau rulezi manual).

### Completează playlist-urile

Pentru fiecare categorie, pune `playlist_id` în D1 (ex: playlist public YouTube care adună
videoclipurile respective):

```sql
UPDATE categories SET playlist_id = 'PLXXXXXXXXXXXXXXXXXXXX' WHERE slug = 'microfiber';
-- … repetă pentru cele 10 categorii
```

Apoi rulezi cron-ul manual o dată și verifici:

```sql
SELECT category_slug, COUNT(*) FROM videos GROUP BY category_slug;
```

---

## 7. Verificare finală

- [ ] `https://caro.tv` – hero cinematic + categorii + videoclipuri (stil sci-fi).
- [ ] `/category/prosoape-microfibra` – meta title/description proprii + JSON-LD + FAQ.
- [ ] `/video/<youtubeId>` – player lazy + link contextual CleanX (produs sau categorie).
- [ ] `/contact` – doar `office@cleanx.ro` + `ROMÂNIA`, meta proprii.
- [ ] `/admin` – autentificare cu `ADMIN_TOKEN` + cele 3 panouri funcționale.
- [ ] `Ctrl+K` deschide căutarea; `/cautare?q=coating` returnează rezultate.
- [ ] `/sitemap.xml` – conține acasă, 10 categorii, toate videoclipurile (cu `video:video`), contact.
- [ ] `/robots.txt` – permite crawlerii, dezactivează `/api/`, `/admin`, `/cautare`, trimite la sitemap.
- [ ] Cron a populat `videos` (rulează o dată manual cu `MANUAL_TOKEN`).

## 8. Troubleshooting

| Problemă | Soluție |
|---|---|
| Build local pe **Windows** eșuează (`spawn EPERM` / Vercel CLI nereușit) | Limitare cunoscută: CLI-ul Vercel folosit intern de next-on-pages nu e stabil pe Windows. **Build-ul de producție se face în CI (GitHub Actions / Cloudflare Pages) sau WSL/Linux.** Local, `npm run dev` + `npm run preview` funcționează; `npx next build` validează aplicația. |
| `getRequestContext` error la build | Paginile cu D1 trebuie să aibă `export const runtime = 'edge'` + `dynamic = 'force-dynamic'` (deja setate). |
| Build EPERM / memorie pe GitHub Actions | Setează `NODE_VERSION=20` și `NODE_OPTIONS=--max-old-space-size=4096`. |
| 500 pe /api/* | Verifică binding-ul `DB` pe proiectul Pages (Settings → Bindings). |
| Cron nu inserează nimic | Verifică `playlist_id` populat + `YOUTUBE_API_KEY` (secret) + loguri Workers (`wrangler tail`). |
| 404 la `https://i.ytimg.com/...` | Fallback-ul folosește `hqdefault.jpg`; playlist-urile trebuie să fie publice. |
