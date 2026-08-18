# 🚀 CARO.TV – GHID DE DEPLOY PENTRU ÎNCEPĂTORI (pas cu pas, din browser)

> Niciun program de instalat. Doar: cont Google, cont GitHub, cont Cloudflare (toate gratuite).
> Proiectul: varianta **v4pro** din folderul `C:\Users\Marius\Desktop\deepseek_websites\4pro`.
> Varianta de bază (v4, folderul `4`) se urcă la fel — numai că fără `/admin` și căutare.

---

## Înțelege ideea (2 minute)

- **Cloudflare construiește site-ul automat** din codul tău de pe GitHub. Tu nu compilezi nimic pe PC.
- Site-ul **citește videoclipurile dintr-o bază de date Cloudflare (D1)**.
- Baza se umple **singură, în fiecare noapte la 03:00**, printr-un „cron worker” care ia videoclipurile din playlist-urile YouTube ale categoriilor.
- Tu completezi doar: **cheia YouTube** (ca site-ul să aibă voie să citească YouTube) și **playlist-urile** (ce videoclipuri să intre la fiecare categorie).

---

## PAS 1 – Cheia YouTube (5 minute)

1. Mergi la [console.cloud.google.com](https://console.cloud.google.com) → autentifică-te cu contul Google.
2. Sus, lângă logo: **Select a project** → **New Project** → nume orice (ex: `caro-tv`) → **Create**.
3. Asigură-te că proiectul nou e selectat. În bara de căutare de sus scrii **YouTube Data API v3** → dai click pe el → **Enable**.
4. Meniu stânga: **APIs & Services → Credentials → Create credentials → API key**.
5. Apare un șir lung gen `AIzaSyB...`. Apeși **Copy** (sau îl notezi).

> ⚠️ Această cheie = `YOUTUBE_API_KEY`. Nu o scrie în cod, nu o da nimănui. Se pune doar în Cloudflare (Pas 6).

---

## PAS 2 – Pune codul pe GitHub

1. Mergi la [github.com](https://github.com) → **New repository**.
2. **Repository name:** `caro-tv` → lasă **Public** → **Create repository** (fără README/.gitignore/license — le avem deja).
3. Pe pagina repo-ului: **Add file → Upload files**.
4. Deschide folderul `C:\Users\Marius\Desktop\deepseek_websites\4pro` în Explorer.
5. **Selectează tot** (Ctrl+A) și **trage în fereastra de upload** din GitHub (poți trage și folderul întreg — contează ca structura să fie aceeași: `frontend/`, `migrations/`, `workers/`, `docs/`...).
6. Apeși **Commit changes** (mesajul implicit e ok).

> ⚠️ Verifică că **NU** ai urcat folderul `node_modules` (la noi nu există în `4pro`, deci ești ok).
> ✅ Acum codul e pe GitHub. Cloudflare îl ia de aici.

---

## PAS 3 – Creezi baza de date D1

1. Mergi la [dash.cloudflare.com](https://dash.cloudflare.com) → autentifică-te.
2. Meniu stânga: **Workers & Pages → D1 → Create database**.
3. **Database name:** `caro-tv-db` → **Create**.
4. Deschizi baza (`caro-tv-db`) → tab **Console** (unde scrii SQL).
5. Deschizi cu Notepad fișierul `C:\Users\Marius\Desktop\deepseek_websites\4pro\migrations\0001_init.sql`.
6. **Copiezi tot** (Ctrl+A, Ctrl+C) și **lipești în Console** (Ctrl+V) → apeși **Run**.
7. Trebuie să vezi „Executed successfully” / tabelele: `videos`, `categories`, `product_mapping`, `video_product_overrides`.

> ✅ Baza e gata, cu cele 10 categorii, FAQ-urile și mapările de produse incluse.

---

## PAS 4 – Creezi site-ul (Cloudflare Pages)

1. În Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
2. Apeși **Connect to GitHub** (autorizezi Cloudflare o singură dată) → alegi repo-ul `caro-tv` → **Begin setup**.
3. **Project name:** `caro-tv` (rămâi cu el).
4. La **Build settings** pui EXACT:
   - **Framework preset:** `Next.js`
   - **Build command:** `npm run install:frontend && npm run build`
   - **Build output directory:** `frontend/.vercel/output/static`
5. **Save and Deploy** → aștepți ~2 minute până apare **Success** (verde).

> 🎉 De acum ai site live la **https://caro-tv.pages.dev** (gol de videoclipuri încă — e normal).
> Dacă build-ul e roșu, citește secțiunea „Dacă ceva nu merge” de la final.

---

## PAS 5 – Domeniul caro.tv (dacă îl ai deja în Cloudflare)

1. Pe proiectul `caro-tv`: **Custom domains → Set up a custom domain**.
2. Scrii `caro.tv` → **Continue → Activate** (Cloudflare face automat DNS-ul).
3. Până atunci, folosește liniștit `https://caro-tv.pages.dev`.

---

## PAS 6 – Leagă baza + pune variabilele (cel mai important!)

Mergi la proiectul **`caro-tv` → Settings → Bindings** și adaugă rând cu rând:

| Tip | Nume | Valoare |
|---|---|---|
| **D1 database** | `DB` | alegi din listă: `caro-tv-db` |
| **Secret** | `YOUTUBE_API_KEY` | cheia de la Pas 1 |
| **Secret** | `ADMIN_TOKEN` | orice șir lung secret, ex: `Detailing@2026!CaroTv` |
| **Text var** | `SITE_URL` | `https://caro.tv` |
| **Text var** | `CLEANX_HOME` | `https://cleanx.ro` |

Apoi: **Deployments → … → Retry deployment** (ca site-ul să pornească cu noile variabile).

> 📝 Notează `ADMIN_TOKEN` undeva — îl folosești la Pas 8 (panoul de admin).

---

## PAS 7 – Cron-ul (sincronizarea zilnică de la YouTube)

1. În Cloudflare: **Workers & Pages → Create → Worker** → nume: `caro-tv-cron` → **Deploy**.
2. Deschide worker-ul → **Edit code** → **șterge tot codul** din fereastră.
3. Deschide cu Notepad `C:\Users\Marius\Desktop\deepseek_websites\4pro\workers\cron\index.js` → copiază tot → lipește în fereastra worker-ului → **Deploy** (butonul din dreapta sus).
4. **Settings → Bindings → Add → D1 database** → alegi `caro-tv-db`, numele binding-ului: `DB`.
5. **Settings → Variables and Secrets → Add → Secret**:
   - `YOUTUBE_API_KEY` = cheia de la Pas 1
   - `MANUAL_TOKEN` = alt șir secret (îl folosești ca să sincronizezi „acum”, fără să aștepți 03:00)
6. **Settings → Triggers → Cron Triggers → Add cron trigger** → scrii: `0 3 * * *` → **Save**.

> ✅ De acum, în fiecare noapte la 03:00 site-ul se actualizează singur.

---

## PAS 8 – Adaugi playlist-urile YouTube (ca să apară videoclipuri)

1. Deschide în browser: `https://caro-tv.pages.dev/admin`
2. Introdu `ADMIN_TOKEN`-ul → **Deblochează panoul**.
3. Tab **Categorii & Playlist-uri**. Pentru fiecare categorie:
   - Deschizi pe YouTube un playlist cu videoclipuri de detailing (al tău sau public).
   - Din URL `https://www.youtube.com/playlist?list=**PLxxxxxxxxx**` copiezi partea `PL...`.
   - O lipești în câmpul **Playlist ID** al categoriei → **Salvează ✓**.
4. Poți completa doar 1–2 categorii la început, restul le lași goale.
5. **(Opțional) sincronizare imediată**: dacă vrei videoclipuri acum (fără să aștepți 03:00), deschide în browser:
   `https://caro-tv-cron.<subdomeniul-tau>.workers.dev/` cu header-ul `Authorization: Bearer MANUAL_TOKEN` (dacă nu știi cum, așteaptă pur și simplu până a doua zi).

---

## PAS 9 – Verificare finală

- [ ] `https://caro-tv.pages.dev` → hero cu particule + 10 categorii + 0 videoclipuri (normal în prima zi)
- [ ] `/admin` → cere tokenul → se deschide panoul
- [ ] `/sitemap.xml` → conține categoriile
- [ ] `/robots.txt` → funcționează
- [ ] A doua zi: categoriile cu playlist au videoclipuri; `/category/...` are FAQ; `Ctrl+K` deschide căutarea

---

## 🔧 Dacă ceva nu merge

| Simptom | Cauza cea mai probabilă | Rezolvare |
|---|---|---|
| Build roșu la Pas 4 | Ai urcat structura greșit / lipsește ceva | Refă Pas 2: urcă **conținutul** folderului `4pro` (nu altă cale), fără `node_modules`; verifică că vezi `frontend/`, `migrations/`, `workers/` în repo |
| Pagina albă / 500 | Binding-ul `DB` nu e setat pe Pages | Pas 6: Settings → Bindings → D1 `DB` = `caro-tv-db` → Retry deployment |
| Nu apar videoclipuri | Nu ai pus playlist-uri SAU cheia YouTube e greșită | Pas 8 + verifică `YOUTUBE_API_KEY` la Pas 6 și Pas 7 |
| „Quota exceeded” | Rar; cheia folosită excesiv | Cron-ul folosește doar ~60 unități/zi din 10.000 – e ok |
| `/admin` nu acceptă tokenul | Ai introdus altceva decât `ADMIN_TOKEN` | Refă secretul la Pas 6 și re-deploy |

---

## Unde e tot ce ți-ai cerut în prompt

| Cerință | Fișier / loc |
|---|---|
| Plan arhitectural | `4pro\docs\ARCHITECTURE.md` |
| Codul sursă integral | tot folderul `4pro` (frontend, workers, migrations) |
| Fișierul wrangler.toml | `wrangler.toml` (rădăcină) + `frontend\wrangler.toml` + `workers\cron\wrangler.toml` |
| Instrucțiuni deploy | acest ghid + `4pro\docs\DEPLOY.md` |
| Listă de verificare SEO | `4pro\docs\SEO-CHECKLIST.md` |
| Diferențele v4 vs v4pro | `4pro\docs\UPGRADES.md` |
