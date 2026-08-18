# 💎 CARO.TV – Istoricul variantelor (v4 → v4pro → v43prov2)

## v43prov2 (interactivă) – ce aduce peste v4pro

| Domeniu | Upgrade |
|---|---|
| **Căutare** | Full-text **FTS5** în D1 (cu `remove_diacritics` – caută „prosoape” și „proșoape” la fel), **sugestii instant** în modalul Ctrl+K (debounce + navigare ↑↓/Enter), pagină de căutare cu filtre + paginare. **Zero cost YouTube API** – totul rulează în D1. |
| **Descoperire** | Secțiune **„🔥 În trend”** (views ÷ vechime, ultimele 90 de zile, calculat în SQL), sortare `newest/views/trending`, **filtru de durată** (sub 4 min / 4–20 / peste 20 – via `duration_seconds` calculat de cron), **paginare numerotată clasică**. |
| **Utilizator** | **Favorite** (♥ pe carduri și pagina video), **„Continuă vizionarea”** (istoric + progres, localStorage), **reluare automată de unde ai rămas**, **bara de progres** pe thumbnails – stil YouTube. Totul 100% local, zero cost server. |
| **Player** | **Capitole** parsate automat din descriere (click = seek prin postMessage), **mini-player sticky** când player-ul iese din ecran (play/pauză + progres live), buton **Distribuie** (share nativ / copy). |
| **Design „clasic”** | **Temă dark/light** completă (CSS variables + anti-FOUC, toggle în header), **bottom nav mobil** (Acasă/Categorii/Căutare/Contact), **View Transitions** animate între pagini, back-to-top, empty states. |
| **API** | `/api/videos` cu sort/durată/paginare, `/api/suggest` (autocomplete), `/api/thumbs/:id` (servește din R2, fallback la YouTube – proxy de imagine, zero unități API). |
| **DB & cron** | Coloana `duration_seconds` + index (filtrare instant), tabel FTS5 cu **triggere de sincronizare** (se actualizează singur la fiecare upsert al cron-ului), cron v3 salvează durata în secunde. |

**Economie de API:** toate funcțiile noi (căutare, trending, filtre, favorite, istoric,
capitole) folosesc **exact 0 unități YouTube** – datele vin din D1 și din browser. Bugetul zilnic
rămâne doar cron-ul (~20–100 unități din 10.000, în funcție de playlist-uri).

### Migrare din v4pro (bază existentă)

```sql
ALTER TABLE videos ADD COLUMN duration_seconds INTEGER DEFAULT 0;
CREATE VIRTUAL TABLE video_fts USING fts5(
  title, description, channel_title,
  tokenize = 'unicode61 remove_diacritics 2',
  content = 'videos', content_rowid = 'id');
-- + cele 3 triggere din migrations/0001_init.sql, apoi:
INSERT INTO video_fts(video_fts) VALUES('rebuild');
UPDATE videos SET duration_seconds =
  COALESCE(
    CAST(substr(duration, 3, instr(duration,'M')-3) AS INTEGER) * 60
    + CAST(substr(duration, instr(duration,'M')+1, instr(duration,'S')-instr(duration,'M')-1) AS INTEGER),
  0)
WHERE duration IS NOT NULL AND duration != '';
```

---

## v4pro (ultrapremium) – ce aduce peste varianta de bază

Varianta **ultrapremium (v4pro)** păstrează 100% din regulile și arhitectura de bază
(Cloudflare Pages + D1 + cron, regula de linkuire CleanX în 3 trepte, SEO dinamic) și adaugă:

---

## 1. Design cinematografic sci-fi

| Feature | Detaliu | Unde |
|---|---|---|
| **Aurora / nebula** | Două straturi de gradient radial animat (26s/40s) + noise overlay | `AuroraBackground.tsx`, `.aurora` |
| **HUD frame** | Colțuri neon pe marginile viewport-ului + bară de status cu oră live | `HudFrame.tsx`, `.hud-frame-*` |
| **Tilt 3D** | Carduri care urmăresc pointer-ul (perspectivă + glare shine) | `TiltCard.tsx`, `.tilt-card` |
| **Reveal on scroll** | Animație de apariție cu stagger (IntersectionObserver) | `Reveal.tsx`, `.reveal` |
| **Ticker marquee** | Bandă infinită cu cele 10 categorii + CTA CleanX (pauză la hover) | `TickerMarquee.tsx`, `.ticker-track` |
| **Contoare animate** | Count-up la intrarea în viewport (hero: categorii, video, vizualizări, canale) | `StatCounter.tsx` |
| **Chromatic aberration** | Dezlocuire RGB pe thumbnails la hover | `.chromatic` |
| **Shine pe butoane** | Reflex diagonal la hover pe toate butoanele neon | `.btn-neon::after` |
| **Skeleton + error** | Shimmer skeletons pentru loading, error boundary neon | `loading.tsx`, `error.tsx`, `.skeleton` |
| **Theming per categorie** | Coloana `accent` în D1 — fiecare categorie are propria culoare neon (hero, breadcrumb, chip-uri) | `categories.accent` |

Totul respectă `prefers-reduced-motion`.

## 2. Căutare globală

- **Ctrl+K** oriunde pe site deschide modalul de căutare (`SearchModal.tsx` + `SearchTrigger.tsx`).
- Pagina **`/cautare?q=…`** – căutare server-side în titlu + descriere + canal, cu „încarcă mai multe”.
- `noindex` pe paginile de căutare (rezultate dinamice, fără valoare de indexare) + `SearchAction` JSON-LD pe `/cautare`.

## 3. Panou de administrare `/admin`

- Autentificare cu **`ADMIN_TOKEN`** (secret Cloudflare), sesiune păstrată în `sessionStorage`.
- **Categorii & Playlist-uri** – editează `playlist_id`, `accent`, `seo_title`, `seo_description`.
- **Mapare produse** – CRUD complet pe `product_mapping` (URL produs/categorie, keywords, toggle activ).
- **Override-uri video** – forțează linkul contextual pentru un anumit video (prioritate maximă).
- API-uri protejate: `/api/admin/categories|mappings|overrides` (Bearer) — implementate și în varianta Pages Functions pură (`functions/api/admin/*`).
- `noindex` pe tot `/admin` (layout metadata + robots.txt).

## 4. Schema D1 v2

- `videos`: **`duration`** (ISO 8601, afișat pe carduri și în VideoObject), **`channel_id`** (related: „același canal mai întâi”), **`is_active`**.
- `categories`: **`accent`** (culoare neon per categorie), **`faq_json`** (JSON FAQPage, cu seed pentru toate cele 10 categorii).
- Seed-urile includ descrieri complete + FAQ-uri curatoriale (ex: „Ce înseamnă 500gsm la prosoapele din microfibra?”).

## 5. SEO v2

- **FAQPage JSON-LD** + acordeon vizibil `<details>` pe paginile de categorie.
- **Sitemap cu extensia Google Video** (`xmlns:video`, `<video:thumbnail_loc>`, `<video:title>`, `<video:publication_date>`).
- **robots.txt v2** (blocare `/api/`, `/admin`, `/cautare`; reguli per Googlebot/Bingbot).
- **VideoObject cu `duration`**, SearchAction pe `/cautare`, related videos cu afinitate de canal.
- CSP + headere de securitate (vezi mai jos).

## 6. Cron worker v2

- **Paginare playlistItems** – până la 5 pagini (250 videoclipuri/categorie), 1 unitate/pagină.
- Salvează **durata** și **channel_id**; reactualizează `is_active = 1` la fiecare sincronizare.
- **Cache thumbnails în R2** (opțional, `CACHE_THUMBS=1` + binding `THUMBS`).
- Trigger manual cu `MANUAL_TOKEN` (Bearer) pentru sincronizare imediată.

## 7. Securitate & performanță

- **CSP** în `next.config.js` (`frame-src youtube-nocookie`, `img-src i.ytimg.com`, `object-src 'none'`…) + X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- API-uri admin cu Bearer token; fără formular de contact (nimic de exploatat).
- **PWA manifest** (`/manifest.webmanifest`) – instalare mobil/desktop.
- **Cloudflare Web Analytics** – injectat automat dacă `CF_BEACON_TOKEN` e setat.
- Player YouTube lazy (iframe doar la click), thumbnails lazy cu alt, edge runtime.

---

## Migrare din varianta de bază

Dacă ai deja baza de date v1 populată, aplică acest upgrade (fără a șterge datele):

```sql
ALTER TABLE videos ADD COLUMN channel_id TEXT;
ALTER TABLE videos ADD COLUMN duration TEXT;
ALTER TABLE videos ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE categories ADD COLUMN accent TEXT DEFAULT '#00f0ff';
ALTER TABLE categories ADD COLUMN faq_json TEXT;
-- Opțional: reseed FAQ-uri/accents – vezi INSERT-urile din migrations/0001_init.sql
```

Sau, pentru un start curat: `wrangler d1 execute caro-tv-db --remote --file=migrations/0001_init.sql`
(fresh DB).
