# ✅ CARO.TV – SEO Checklist profesional

## A. Fundație tehnică

- [ ] **URL-uri prietenoase**: `/category/{slug}` și `/video/{youtubeId}` (fără query strings).
- [ ] **Canonical** pe toate paginile (via `metadataBase` + `alternates.canonical`).
- [ ] **Meta title** dinamice: template `%s | CARO.TV`; fiecare categorie/video are titlu propriu din D1.
- [ ] **Meta description** dinamice (categorie: `seo_description` din D1; video: primul text din descriere).
- [ ] **Open Graph** (og:title, og:description, og:image = thumbnail, og:type, og:url) + **Twitter Card** (summary_large_image).
- [ ] **hreflang** implicite (`lang="ro"` pe `<html>`), fără duplicate de conținut.
- [ ] **robots.txt** funcțional (`/api/` blocat, `Sitemap:` indicat).
- [ ] **Sitemap XML** generat din D1: home, 10 categorii, toate videoclipurile + `lastmod` + `changefreq` + `priority`.
- [ ] **Sitemap video (v4pro)**: extensia Google Video (`xmlns:video`, `video:thumbnail_loc`, `video:title`, `video:publication_date`) pe URL-urile video.
- [ ] **noindex** pentru pagini fără valoare de indexare: `/cautare`, `/admin` (layout metadata + robots).
- [ ] **Paginare**: `/api/videos` + „Încarcă mai multe” (conținutul inițial rămâne indexabil SSR).

## B. Schema JSON-LD (structured data)

- [ ] **WebSite** (toate paginile) – nume, URL, SearchAction (pe `/cautare`).
- [ ] **Organization** (toate paginile) – nume, URL, logo.
- [ ] **BreadcrumbList** – Home > Categorie > Video (categorii + videoclipuri + contact).
- [ ] **VideoObject** (pagina video) – name, description, thumbnailUrl, uploadDate, **duration**, embedUrl,
      contentUrl, interactionStatistic (views), publisher (canal).
- [ ] **FAQPage** (v4pro, paginile de categorie) – întrebări/răspunsuri din `categories.faq_json`, sincron cu acordeonul vizibil.
- [ ] **ItemList** (categorii pe home / videoclipuri pe categorie) – poziție, nume, URL.
- [ ] Validare în [Rich Results Test](https://search.google.com/test/rich-results) și
      [Schema Markup Validator](https://validator.schema.org/).

## C. Conținut & linkuri interne

- [ ] **Linkuri interne**: fiecare card video → pagina video; fiecare video → categoria lui; footer cu toate categoriile.
- [ ] **Linkuri contextuale CleanX.ro** cu regulă de fallback în 3 trepte (produs → categorie → nimic).
- [ ] **Excepții respectate**: doar popup (10–15s + exit-intent) și bannerele trimit la `https://cleanx.ro` (home).
- [ ] **Anchor texts** descriptive (nu „click aici”): „Vezi produsul pe CleanX.ro”, „Vezi categoria …”.
- [ ] `rel="noopener noreferrer"` + `target="_blank"` pe toate linkurile externe.
- [ ] **Pagină de contact** simplă, cu `Organization` + `contactPoint` (email) în JSON-LD.

## D. Performanță (Core Web Vitals)

- [ ] **Thumbnails lazy**: `loading="lazy"` + `decoding="async"` + `width`/`height` (zero CLS).
- [ ] **Alt text relevant** pe fiecare imagine (title-ul videoclipului).
- [ ] **Player lazy**: iframe `youtube-nocookie` încărcat doar la click (fără iframe-uri grele pe LCP).
- [ ] Fonturi self-hosted (`@fontsource`) – zero request-uri către Google Fonts.
- [ ] Edge runtime (Workers) – TTFB minim; caching API (`stale-while-revalidate`).
- [ ] `prefers-reduced-motion` respectat pentru particule/animații.

## E. Indexare & monitorizare

- [ ] **Google Search Console**: proprietate + trimitere sitemap + inspectare URL-uri.
- [ ] **Bing Webmaster Tools** (dacă e relevant).
- [ ] **Cloudflare Analytics** activ pe Pages.
- [ ] Verificare lunară: Rich Results, indexare categorii noi, crawl errors.

## F. Extensii recomandate (post-launch)

- [ ] `og:image` PNG per categorie (generat static sau la cron) – în prezent se folosește thumbnail-ul video.
- [ ] Pagini de categorie cu **descriere unică de minim 300 caractere** (ediabilă din D1).
- [ ] **JSON-LD FAQPage** pe categorii (întrebări frecvente detailing) – conținut curatorial.
- [ ] Analiza cuvintelor cheie per categorie (din GSC) → îmbunătățire `keywords` din `product_mapping`.
