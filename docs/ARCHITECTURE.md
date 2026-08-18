# 🏗️ CARO.TV – Plan arhitectural Cloudflare

## 1. Prezentare generală

```
                          ┌─────────────────────────────────────────────┐
                          │               CLOUDFLARE                    │
   Vizitator ──HTTPS──▶   │  ┌───────────────────────────────────────┐  │
                          │  │  Cloudflare Pages (caro.tv)           │  │
                          │  │  ┌─────────────────────────────────┐  │  │
                          │  │  │ Next.js (App Router, edge)      │  │  │
                          │  │  │  • Pagini SSR/SSG dinamice       │  │  │
                          │  │  │  • SEO: meta + JSON-LD + sitemap │  │  │
                          │  │  └───────────────┬─────────────────┘  │  │
                          │  │  Pages Functions │  (API /api/*)      │  │
                          │  │  └───────────────┼─────────────────┘  │  │
                          │  └──────────────────┼────────────────────┘  │
                          │                     │ D1 binding (DB)       │
                          │  ┌──────────────────▼────────────────────┐  │
                          │  │  Cloudflare D1 (SQLite serverless)     │  │
                          │  │  videos / categories / product_mapping │  │
                          │  │  / video_product_overrides             │  │
                          │  └──────────────────▲────────────────────┘  │
                          │                     │ upsert zilnic          │
                          │  ┌──────────────────┴────────────────────┐  │
                          │  │  Worker separat: caro-tv-cron          │  │
                          │  │  cron: "0 3 * * *" (03:00 UTC)         │  │
                          │  └──────────────────▲────────────────────┘  │
                          └─────────────────────┼───────────────────────┘
                                                │ HTTPS (1 unitate/request)
                                        ┌───────┴────────┐
                                        │ YouTube Data API│
                                        │ v3 (10.000 un.)│
                                        └────────────────┘
```

## 2. Decizii cheie

| Decizie | Detaliu |
|---|---|
| **Deploy Next.js pe Pages** | `@cloudflare/next-on-pages` compilează App Router-ul într-un Worker Pages (output `.vercel/output/static`). Toate paginile care citesc D1 folosesc `export const runtime = 'edge'` + `dynamic = 'force-dynamic'`, deci SEO-ul este servit **server-side, proaspăt din D1** (meta dinamice per categorie/video). |
| **API** | Route Handlers în `app/api/*` (devin Pages Functions prin next-on-pages). Alternativ, `frontend/functions/` conține implementarea **Pages Functions pură** (același SQL, fără Next). Nu folosi ambele simultan la deploy — alege un singur model. |
| **YouTube (cotă 10.000)** | DOAR endpoint-uri de 1 unitate: `playlistItems.list`, `videos.list`, `channels.list`. **Niciodată** `/search` (100 u). Buget zilnic cron: ~10 categorii × (max 5 pagini playlistItems + 1 videos) ≈ **60 unități/zi**. Restul rămâne tampon. |
| **Cron (03:00 UTC)** | Worker separat (`workers/cron/`) cu binding D1 + `YOUTUBE_API_KEY` ca secret. Per categorie: playlistItems → videoIds → videos.list (batch 50) → upsert. |
| **Upsert fără pierderi** | Se folosește `INSERT … ON CONFLICT(youtube_id) DO UPDATE` (nu `INSERT OR REPLACE`, care ar șterge `is_featured` și ar putea distruge date manuale). Intenția promptului („fără duplicate”) este păstrată, fără efectele secundare. |
| **Linkuri contextuale** | Regula în 3 trepte (produs exact → categorie → nimic) implementată în `lib/productMapper.ts`, cu suport de **override manual** per video (`video_product_overrides`). Excepții (popup, bannere) → doar `https://cleanx.ro`. |
| **R2 (opțional)** | Binding `THUMBS`. Cron-ul poate copia thumbnails local pentru reziliență/performanță (implementare opțională, activă doar dacă binding-ul există). |
| **Local dev** | `next dev` + `setupDevPlatform({ configPath: '../wrangler.toml' })` → binding-urile D1 locale (Miniflare) sunt disponibile direct în Server Components/Routes. |
| **Admin (v4pro)** | `/admin` autentificat cu secretul `ADMIN_TOKEN` (Bearer). API-uri protejate `/api/admin/*` pentru playlist-uri, mapare produse și override-uri. `noindex` pe tot /admin. |
| **Securitate (v4pro)** | CSP + headere în `next.config.js`; token admin; cron protejat cu `MANUAL_TOKEN`; fără formular de contact. |
| **SEO extra (v4pro)** | FAQPage JSON-LD + sitemap cu extensie Google Video + SearchAction pe `/cautare` + robots v2. |

## 3. Schema D1

4 tabele (vezi `migrations/0001_init.sql`):

- **`videos`** – videoclipul + `product_url`/`product_name` precompute de cron + `is_featured`.
- **`categories`** – cele 10 categorii + `default_product_url` + câmpuri SEO.
- **`product_mapping`** – mapare categorie → produs/categorie CleanX + `keywords` pentru matching.
- **`video_product_overrides`** – link contextual forțat pentru un anumit video (prioritate maximă).

## 4. Fluxul de date

1. **Admin** introduce `playlist_id` pentru fiecare categorie (UPDATE direct în D1 sau tool admin).
2. **Cron 03:00** → pentru fiecare categorie cu playlist: `playlistItems.list` (50 videoclipuri) →
   `videos.list` (detalii + statistici) → upsert în `videos` → recalculează `product_url` după
   keywords → marchează `is_featured` (top 8 după views, ultimele 30 zile).
3. **Pagini** citesc D1 la cerere (edge) și generează: meta dinamice, JSON-LD
   (VideoObject, BreadcrumbList, ItemList, WebSite, Organization), link contextual per video.
4. **API-uri** `/api/*` expun aceleași date în JSON (folosite de „Încarcă mai multe”, integrare externă).
5. **Sitemap/robots** generate din D1 → indexare Google rapidă.

## 5. Performanță & caching

- Toate răspunsurile API au `Cache-Control: public, max-age=300, stale-while-revalidate=3600`.
- Thumbnails: `loading="lazy"` + `alt` relevant + dimensiuni explicite (fără CLS).
- Player: iframe `youtube-nocookie` încărcat **doar la click** (`VideoEmbed`).
- Edge runtime = zero cold start perceput (Workers).

## 6. Securitate

- Cheie YouTube **doar** pe backend (secret în Workers/Pages), niciodată în client.
- `frontend/functions/_middleware.js` + `next.config.js` adaugă: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS.
- Panou `/admin` și API-urile `/api/admin/*` protejate cu `ADMIN_TOKEN`; trigger-ul manual al cron-ului protejat cu `MANUAL_TOKEN`.
- Fără formular de contact (nimic de exploatat) – doar email afișat.
- Input-uri validate la API (limite/offset clampate), SQL doar prin prepared statements.

## 7. Costuri estimate

| Serviciu | Cost |
|---|---|
| Pages (static + Functions) | Gratuit (plan free: 100k requesturi/zi) |
| D1 | Gratuit: 5 GB stocare, 5M citiri/zi, 100k scrieri/zi |
| Worker cron | Gratuit (plan free: 100k execuții/zi) |
| R2 (opțional) | Gratuit: 10 GB stocare, 1M citiri/lună |
| YouTube API | Gratuit: 10.000 unități/zi (~30 folosite de cron) |
