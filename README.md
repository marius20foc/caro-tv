# CARO.TV 🛰️ — v43prov2 (interactiv)

**Agregator video sci-fi / cyberpunk pentru lumea detailing-ului auto** – agregă videoclipuri
YouTube organizate pe **10 categorii** care corespund categoriilor magazinului
[CleanX.ro](https://cleanx.ro), cu **linkuri contextuale** către produse/categorii, găzduit
integral pe ecosistemul **Cloudflare** (Pages + Functions + D1 + R2 opțional + Worker cron).

> Aceasta este varianta **v43prov2 (interactivă)** a proiectului: pornește de la v4pro și adaugă
> căutare full-text FTS5, filtre/sortare/paginare clasică, secțiune „În trend”, favorite +
> istoric + progres vizionare, mini-player, capitole, temă dark/light, View Transitions.
> Diferențele complete sunt în **[docs/UPGRADES.md](docs/UPGRADES.md)**.

---

## ✨ Ce aduce v4pro peste varianta de bază

| Domeniu | Upgrade |
|---|---|
| **Design** | Fundal aurora/nebula animat, HUD frame cu oră live, tilt 3D pe carduri, reveal-on-scroll, ticker marquee, contoare animate, shimmer skeletons, chromatic aberration pe thumbnails, shine pe butoane |
| **Căutare** | Modal global **Ctrl+K** + pagină `/cautare` (noindex) cu căutare în titlu/descriere/canal |
| **Admin** | Panou `/admin` protejat cu `ADMIN_TOKEN`: playlist-uri YouTube, accente, SEO per categorie; CRUD mapare produse; override-uri per video |
| **D1 v2** | `videos.duration`, `videos.channel_id`, `videos.is_active`, `categories.accent`, `categories.faq_json` (seed: 10 categorii cu descrieri, accente și FAQ-uri) |
| **SEO** | FAQPage JSON-LD + acordeon vizibil, sitemap cu extensia **Google Video** (`video:video`), robots v2, SearchAction pe `/cautare` |
| **Cron v2** | Paginare playlistItems (până la 250 video/categorie), durată + canal, cache thumbnails în R2 (opțional), păstrarea `is_featured`/overrides |
| **Securitate** | CSP + headere de securitate în `next.config.js`, API-uri admin cu Bearer token, `ADMIN_TOKEN` secret |
| **UX** | PWA manifest, loading skeletons, error boundary, Cloudflare Web Analytics (opțional), related videos „același canal mai întâi” |

---

## 📦 Structura proiectului

```
caro-tv/
├── frontend/                  # Proiectul Next.js (App Router) – rădăcina Next
│   ├── app/
│   │   ├── page.tsx                     # Acasă: hero cinematic + stats + featured
│   │   ├── category/[slug]/page.tsx     # Categorie: accent propriu + FAQ + JSON-LD
│   │   ├── video/[id]/page.tsx          # Video: player lazy + produs asociat + similare
│   │   ├── contact/page.tsx             # Contact: email + ROMÂNIA (fără formular)
│   │   ├── cautare/page.tsx             # Căutare (noindex)
│   │   ├── admin/                       # Panou admin (login + 3 panouri)
│   │   ├── api/                         # categories, videos, video/[id], featured
│   │   │   └── admin/                   #   categories, mappings, overrides (Bearer)
│   │   ├── sitemap.xml/route.ts         # Sitemap + extensie Google Video
│   │   ├── robots.txt/route.ts          # robots v2
│   │   ├── manifest.ts                  # PWA manifest
│   │   ├── loading.tsx / error.tsx      # Skeleton + error boundary
│   │   └── not-found.tsx                # 404 neon
│   ├── components/          # SciFiLayout, VideoCard, VideoGrid, PopupCleanX,
│   │   │                    # BannerCleanX, ParticleField, CategoryCard,
│   │   │                    # VideoEmbed, LoadMoreVideos, SectionHeading,
│   │   │                    # AuroraBackground, HudFrame, Reveal, TiltCard,
│   │   │                    # TickerMarquee, StatCounter, SearchModal,
│   │   │                    # SearchTrigger, FaqAccordion, SkeletonVideoCard,
│   │   │                    # admin/ (3 panouri)
│   ├── lib/                 # db, seo, youtube, productMapper, constants, auth
│   ├── styles/              # globals.css + sci-fi.css (design system v2)
│   ├── functions/           # ALTERNATIVĂ: Pages Functions pure (paritate completă)
│   │   ├── _middleware.js   #   security headers
│   │   ├── _lib/            #   db.js + mapper.js + auth.js
│   │   └── api/             #   categories, videos, video/[id], featured, admin/*
│   ├── public/              # favicon.svg, icon.svg
│   └── (config: package.json, next.config.js, tailwind.config.js, wrangler.toml…)
├── workers/
│   └── cron/                # Worker separat: sincronizare zilnică YouTube → D1
│       ├── index.js         #   scheduled() la 03:00 + trigger manual + R2
│       └── wrangler.toml    #   binding D1 + cron trigger
├── migrations/
│   └── 0001_init.sql        # Schema D1 v2 + seed (10 categorii + FAQ + mapare)
├── docs/
│   ├── ARCHITECTURE.md      # Planul arhitectural Cloudflare
│   ├── DEPLOY.md            # Instrucțiuni pas-cu-pas de deploy
│   ├── SEO-CHECKLIST.md     # Lista de verificare SEO
│   └── UPGRADES.md          # Ce aduce v4pro peste varianta de bază
├── wrangler.toml            # Config Wrangler (D1, R2, vars)
├── package.json             # Scripturi orchestrator (npm --prefix frontend)
└── .env.example
```

> **Notă de arhitectură:** Next.js impune ca `app/` să stea la rădăcina proiectului Next,
> de aceea `frontend/` **este** rădăcina proiectului Next.js (configurările Next/Tailwind
> stau în `frontend/`), iar `wrangler.toml` rămâne la rădăcina repo-ului, cum cere promptul.

---

## 🚀 Quickstart

```bash
# 1. Instalează dependențele frontend
npm run install:frontend

# 2. Copiază variabilele de mediu
copy .env.example frontend\.env.local    # (Windows) + completează YOUTUBE_API_KEY, ADMIN_TOKEN

# 3. Dezvoltare locală (cu binding-uri D1 locale din wrangler.toml)
npm run dev                    # → http://localhost:3000

# 4. Inițializează D1 local
npm run db:local:init          # aplică migrations/0001_init.sql (schema v2)

# 5. Build + deploy Cloudflare Pages
npm run deploy                 # build next-on-pages + wrangler pages deploy
```

Deploy-ul complet (D1 remote, cron, GitHub, admin) este detaliat în **[docs/DEPLOY.md](docs/DEPLOY.md)**.

---

## 🧭 Regulile de linkuire către CleanX.ro

| Situație | Link |
|---|---|
| **1. Produs exact** (override manual din `/admin` sau keyword-match din `product_mapping`) | → direct la produs, ex. `/prosoape-microfibra-500gsm` |
| **2. Doar categorie** | → pagina categoriei, ex. `/prosoape-microfibra` |
| **3. Nimic** | ❌ nu se afișează niciun link contextual |
| **Excepții** (popup la 10–15s + exit-intent, bannere sidebar/între videoclipuri) | → doar **https://cleanx.ro** (home) |

Implementare: `frontend/lib/productMapper.ts` (server) + `frontend/functions/_lib/mapper.js` (varianta Pages Functions).

---

## 🔑 Variabile de mediu

Vezi [.env.example](.env.example). Esențiale: `YOUTUBE_API_KEY`, `SITE_URL`, `CLEANX_HOME`,
**`ADMIN_TOKEN`** (panoul /admin), `CF_BEACON_TOKEN` (analytics, opțional),
plus `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` pentru Wrangler.

## 📚 Documentație

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** – planul arhitectural complet Cloudflare (flux de date, cotă YouTube, securitate).
- **[docs/DEPLOY.md](docs/DEPLOY.md)** – deploy pas-cu-pas: D1, Pages, GitHub, cron, admin.
- **[docs/SEO-CHECKLIST.md](docs/SEO-CHECKLIST.md)** – checklist SEO profesional.
- **[docs/UPGRADES.md](docs/UPGRADES.md)** – tot ce aduce v4pro peste varianta de bază.

## ⚖️ Licență / mențiune

Proiect personal. Conținutul video aparține canalelor YouTube respective; site-ul este un
agregator cu linkuri către surse și către magazinul partener CleanX.ro.
