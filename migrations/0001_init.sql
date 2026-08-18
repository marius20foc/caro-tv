-- ============================================================
-- CARO.TV v43prov2 – Schema bazei de date Cloudflare D1 (SQLite)
-- ------------------------------------------------------------
-- Aplicare:
--   Local:   wrangler d1 execute caro-tv-db --local --file=migrations/0001_init.sql
--   Remote:  wrangler d1 execute caro-tv-db --remote --file=migrations/0001_init.sql
-- NOUTATI v3 (fata de v4pro):
--   videos     + duration_seconds (filtrare dupa durata, zero cost)
--   Cautare    FTS5 (unicode61 + remove_diacritics) cu triggere de sincronizare
--   (cautarea full-text ruleaza in D1 – NICIUN apel YouTube suplimentar)
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Videoclipuri agregate din YouTube
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_slug TEXT NOT NULL,
    youtube_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    channel_title TEXT,
    channel_id TEXT,
    published_at DATETIME,
    duration TEXT,
    duration_seconds INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    product_url TEXT,
    product_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_videos_category  ON videos(category_slug);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_featured  ON videos(is_featured);
CREATE INDEX IF NOT EXISTS idx_videos_active    ON videos(is_active);
CREATE INDEX IF NOT EXISTS idx_videos_views     ON videos(views DESC);
CREATE INDEX IF NOT EXISTS idx_videos_duration  ON videos(duration_seconds);

-- ------------------------------------------------------------
-- Cautare full-text FTS5 (cota YouTube neafectata: cauta in D1)
-- ------------------------------------------------------------
CREATE VIRTUAL TABLE IF NOT EXISTS video_fts USING fts5(
    title,
    description,
    channel_title,
    tokenize = 'unicode61 remove_diacritics 2',
    content = 'videos',
    content_rowid = 'id'
);

-- Triggers: fts ramane sincronizat automat cu tabela videos
CREATE TRIGGER IF NOT EXISTS videos_ai AFTER INSERT ON videos BEGIN
  INSERT INTO video_fts(rowid, title, description, channel_title)
  VALUES (new.id, new.title, COALESCE(new.description, ''), COALESCE(new.channel_title, ''));
END;

CREATE TRIGGER IF NOT EXISTS videos_ad AFTER DELETE ON videos BEGIN
  INSERT INTO video_fts(video_fts, rowid, title, description, channel_title)
  VALUES ('delete', old.id, old.title, COALESCE(old.description, ''), COALESCE(old.channel_title, ''));
END;

CREATE TRIGGER IF NOT EXISTS videos_au AFTER UPDATE ON videos BEGIN
  INSERT INTO video_fts(video_fts, rowid, title, description, channel_title)
  VALUES ('delete', old.id, old.title, COALESCE(old.description, ''), COALESCE(old.channel_title, ''));
  INSERT INTO video_fts(rowid, title, description, channel_title)
  VALUES (new.id, new.title, COALESCE(new.description, ''), COALESCE(new.channel_title, ''));
END;

-- ------------------------------------------------------------
-- Categorii (10) – corespund categoriilor magazinului cleanx.ro
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    playlist_id TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    default_product_url TEXT,
    accent TEXT DEFAULT '#00f0ff',
    seo_title TEXT,
    seo_description TEXT,
    faq_json TEXT
);

-- ------------------------------------------------------------
-- Maparea produse <-> categorii (folosita pentru linkuri contextuale)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_slug TEXT NOT NULL,
    cleanx_product_url TEXT,
    cleanx_category_url TEXT NOT NULL,
    cleanx_product_name TEXT,
    keywords TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_slug) REFERENCES categories(slug)
);

-- ------------------------------------------------------------
-- Override-uri manuale: link contextual specific UNUI video
-- (are prioritate maxima in regula de linkuire)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_product_overrides (
    video_id INTEGER NOT NULL,
    cleanx_product_url TEXT,
    cleanx_category_url TEXT NOT NULL,
    cleanx_product_name TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (video_id),
    FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- ============================================================
-- SEED – categorii implicite (10)
-- playlist_id ramane NULL pana cand administratorul introduce
-- ID-urile playlist-urilor YouTube din /admin.
-- accent = culoarea neon a categoriei (theming premium).
-- ============================================================
INSERT INTO categories (slug, name, description, playlist_id, icon, sort_order, default_product_url, accent, seo_title, seo_description, faq_json) VALUES
    ('garage-equipment', 'Echipament Garaje Detailing',
     'Echipamente profesionale pentru garajul de detailing: scaune, lifturi, aparate de spalat, suporturi si organizare.',
     NULL, '🔧', 1, 'https://cleanx.ro/echipamente-detailing', '#00f0ff',
     'Echipament Garaje Detailing – Videoclipuri | CARO.TV',
     'Cele mai bune videoclipuri cu echipament pentru garaje de detailing. Vezi ce unelte si aparate folosesc profesionistii.',
     '[{"q":"Ce echipament de baza imi trebuie pentru un garaj de detailing?","a":"Minimum: un aparat de spalat cu presiune, un aspirator profesional, iluminat corect si scaune/trolere pentru organizarea produselor."},{"q":"Merita un scaun de detailing profesional?","a":"Da, daca lucrezi frecvent – reduce oboseala, protejeaza spatele si iti permite sa aplici corect protectiile pe partea inferioara a masinii."}]'),
    ('garage-lighting', 'Iluminat Garaje',
     'Solutii de iluminat LED pentru garaje si ateliere: benzi LED, corpuri de iluminat, lampi de inspectie.',
     NULL, '💡', 2, 'https://cleanx.ro/iluminat-led-garaj', '#ffd166',
     'Iluminat Garaje LED – Videoclipuri | CARO.TV',
     'Inspiratie si ghiduri video pentru iluminatul LED al garajului: montaj, configuratii si comparatii de lumina.',
     '[{"q":"Cati lumeni imi trebuie pentru iluminatul garajului?","a":"Pentru detailing se recomanda 1000–1500 lumeni/mp; pentru lucrari fine de polish si coating, lumina de zi (5000–6500K) cu CRI peste 90."},{"q":"Ce temperatura de culoare aleg pentru garaj?","a":"5000–6500K (alb rece) evidentiaza defectele de vopsea; pentru zonele de relaxare poti combina cu benzi LED neutre."}]'),
    ('detailing-products', 'Produse Detailing',
     'Sampoane, spray-uri, paste, degresante si tot arsenalul de produse pentru detailing auto.',
     NULL, '🧴', 3, 'https://cleanx.ro/produse-detailing', '#8b5cf6',
     'Produse Detailing – Videoclipuri | CARO.TV',
     'Videoclipuri cu produse de detailing auto: testuri, comparatii si ghiduri de utilizare.',
     '[{"q":"Ce produse de detailing aleg pentru inceput?","a":"Un sampon pH-neutru, un degresant, un spray de intretinere si prosoape microfibra de calitate acopera 80% din lucrarile uzuale."},{"q":"Cat de des se aplica produsele de intretinere?","a":"Spray-urile de intretinere (quick detailer) se aplica la 1–2 saptamani; sigilantii la 3–6 luni, in functie de produs."}]'),
    ('microfiber', 'Prosoape Microfibră',
     'Prosoape, lavete si accesorii din microfibra de inalta calitate pentru uscare si aplicare.',
     NULL, '🧽', 4, 'https://cleanx.ro/prosoape-microfibra', '#39ff88',
     'Prosoape Microfibră – Videoclipuri | CARO.TV',
     'Tot ce trebuie sa stii despre prosoapele din microfibra: gramaje, tesaturi si cum le intretii corect.',
     '[{"q":"Ce inseamna 500gsm la prosoapele din microfibra?","a":"Gramajul (g/m²) – 500gsm inseamna un prosop foarte dens, extrem de absorbant, ideal pentru uscare fara urme."},{"q":"Cum spal corect prosoapele din microfibra?","a":"Separat de alte materiale, la maxim 40°C, fara balsam si fara uscator la caldura mare; balsamul blocheaza fibrele."},{"q":"Care este diferenta dintre prosoapele pentru uscare si cele pentru aplicare?","a":"Uscare = gramaj mare (400gsm+) si tesatura plusata; aplicare = gramaj mediu (300gsm) si tesatura mai neteda, pentru distribuirea uniforma a produsului."}]'),
    ('carbon-fiber', 'Fibră Carbon',
     'Folii si accesorii din fibra de carbon pentru personalizarea masinii.',
     NULL, '◼️', 5, 'https://cleanx.ro/fibra-carbon-auto', '#7f8cff',
     'Fibră Carbon Auto – Videoclipuri | CARO.TV',
     'Videoclipuri despre foliile si piesele din fibra de carbon: aplicare, avantaje si modele.',
     '[{"q":"Ce este folia 3D de fibra carbon?","a":"Este o folie cu textura ridicata care imita tesatura twill a carbonului real, folosita pentru wrapping interior si exterior."},{"q":"Cum se aplica corect folia de carbon?","a":"Suprafata degresata, caldura controlata cu pistolul si rabdare la intindere; recomandat un aplicator profesionist pentru piese complexe."}]'),
    ('forged-carbon', 'Tocătură Carbon',
     'Piese si accesorii din forged carbon (tocatura de carbon) pentru un look exclusivist.',
     NULL, '💠', 6, 'https://cleanx.ro/tocatura-carbon', '#ff2d95',
     'Tocătură Carbon (Forged) – Videoclipuri | CARO.TV',
     'Descopera lumea forged carbon: piese, proces de fabricatie si aplicatii pe masina ta.',
     '[{"q":"Care este diferenta dintre fibra de carbon si tocatura (forged) carbon?","a":"Fibra = tesatura ordonata twill; forged = bucati de carbon presate aleator, cu pattern unic la fiecare piesa."},{"q":"Piesele forged carbon sunt rezistente?","a":"Da – tehnologia de presare le face foarte rigide si usoare, comparabile cu fibra clasica."}]'),
    ('ceramic-coating', 'Protecții Ceramice',
     'Coating-uri ceramice pentru geam, caroserie si plastic: aplicare, durabilitate si comparatii.',
     NULL, '🛡️', 7, 'https://cleanx.ro/protectii-ceramice', '#00f0ff',
     'Protecții Ceramice – Videoclipuri | CARO.TV',
     'Ghiduri video complete despre protectiile ceramice: aplicare, intretinere si ce durata de viata au.',
     '[{"q":"Cat rezista o protectie ceramica?","a":"Depinde de produs: de la 6–12 luni (spray ceramic) pana la 3–5 ani (coating profesional); intretinerea corecta prelungeste viata."},{"q":"Pot aplica singur un coating ceramic?","a":"Da, produsele DIY se aplica mai usor, dar pregatirea (decontaminare + polish) decide 80% din rezultat."},{"q":"Protectia ceramica inlocuieste ceara?","a":"Da – ofera o durabilitate mult mai mare, hidrofobie superioara si rezistenta chimica, dar necesita aplicare corecta."}]'),
    ('interior', 'Interior Auto',
     'Curatare, igienizare si restaurare a interiorului auto: tapiterie, piele, plastic.',
     NULL, '💺', 8, 'https://cleanx.ro/interior-auto', '#ff9f1c',
     'Interior Auto – Videoclipuri | CARO.TV',
     'Videoclipuri despre curatarea si intretinerea interiorului auto, de la tapiterie la plastic.',
     '[{"q":"Cum scot petele de pe tapiteria auto?","a":"Aspirare, apoi spuma activa + perie moale si microfibra; pentru pete vechi, extractor sau abur."},{"q":"Ce protectie folosesc pentru plasticele din bord?","a":"Un dressing cu protectie UV, aplicat in strat subtire, pastreaza plasticul mat si previne craparea."}]'),
    ('exterior', 'Exterior Auto',
     'Spalare, polish, protectie vopsea, cauciuc si crom: tot ce tine de exteriorul masinii.',
     NULL, '🚘', 9, 'https://cleanx.ro/exterior-auto', '#8b5cf6',
     'Exterior Auto – Videoclipuri | CARO.TV',
     'Tehnici si produse pentru exteriorul masinii: spalare corecta, polish si protectie.',
     '[{"q":"Cum spal masina fara sa zgarii vopseaua?","a":"Metoda doua galeti, manusa microfibra de calitate, sampon pH-neutru si uscare cu prosoape 500gsm+."},{"q":"Cand fac polish si cand doar decontaminare?","a":"Daca vopseaua are zgarieturi fine/opacitate – polish; daca e doar rugoasa la atingere – bara de decontaminare (clay)."}]'),
    ('unboxing', 'Unboxing & Review-uri',
     'Unboxing-uri si review-uri detaliate de produse detailing, ca sa alegi informat.',
     NULL, '📦', 10, 'https://cleanx.ro/produse-detailing', '#ff2d95',
     'Unboxing & Review-uri Detailing – Videoclipuri | CARO.TV',
     'Unboxing-uri si review-uri oneste de produse detailing: vezi produsul inainte sa cumperi.',
     '[{"q":"Sunt review-urile de pe CARO.TV independente?","a":"Videoclipurile apartin canalelor YouTube respective; CARO.TV le organizeaza pe categorii si le asociaza produsele de pe CleanX.ro."},{"q":"Cum aleg un produs dupa un review?","a":"Urmareste testele practice pe vopsea/tapiterie si linkul contextual de sub video te duce direct la produsul asociat."}]');

-- ============================================================
-- SEED – mapare produse (exemple cu fallback pe categorie)
-- Regula de linkuire:
--   1. Produs exact  -> cleanx_product_url (daca exista + keywords match)
--   2. Categoria     -> cleanx_category_url / categories.default_product_url
--   3. Nimic         -> nu se afiseaza link contextual
-- ============================================================
INSERT INTO product_mapping (category_slug, cleanx_product_url, cleanx_category_url, cleanx_product_name, keywords) VALUES
    ('microfiber', 'https://cleanx.ro/prosoape-microfibra-500gsm', 'https://cleanx.ro/prosoape-microfibra', 'Prosoape Microfibră 500gsm', '500gsm, microfibra, prosop, laveta, uscare'),
    ('ceramic-coating', NULL, 'https://cleanx.ro/protectii-ceramice', 'Protecții Ceramice', 'coating, ceramic, caroserie, geam, plastic, aplicare'),
    ('garage-lighting', NULL, 'https://cleanx.ro/iluminat-led-garaj', 'Iluminat LED Garaj', 'led, iluminat, lampa, inspectie, garaj, banda'),
    ('carbon-fiber', 'https://cleanx.ro/folie-carbon-3d', 'https://cleanx.ro/fibra-carbon-auto', 'Folie Fibră Carbon 3D', 'carbon, fibra, folie, 3d, twill, aplicare'),
    ('interior', NULL, 'https://cleanx.ro/interior-auto', 'Produse Interior Auto', 'interior, tapiterie, piele, plastic, curatare, igienizare'),
    ('exterior', NULL, 'https://cleanx.ro/exterior-auto', 'Produse Exterior Auto', 'exterior, vopsea, cauciuc, crom, faruri, polish'),
    ('garage-equipment', NULL, 'https://cleanx.ro/echipamente-detailing', 'Echipament Garaje Detailing', 'scaun, lift, elevator, aparat, spalator, masina de spalat, echipament, suport'),
    ('detailing-products', NULL, 'https://cleanx.ro/produse-detailing', 'Produse Detailing', 'sampon, spray, pasta, polish, degresant, spuma, kit'),
    ('forged-carbon', 'https://cleanx.ro/tocatura-carbon', 'https://cleanx.ro/tocatura-carbon', 'Tocătură Carbon', 'forged, tocatura, carbon, piese, bucati'),
    ('unboxing', NULL, 'https://cleanx.ro/produse-detailing', 'Produse Detailing (Unboxing & Review)', 'unboxing, review, test, prezentare, impresii');

-- ============================================================
-- EXEMPLU override manual (se de-comenteaza cand exista un video):
-- ============================================================
-- INSERT INTO video_product_overrides (video_id, cleanx_product_url, cleanx_category_url, cleanx_product_name)
-- SELECT id, 'https://cleanx.ro/prosoape-microfibra-500gsm', 'https://cleanx.ro/prosoape-microfibra', 'Prosoape Microfibră 500gsm'
-- FROM videos WHERE youtube_id = 'dQw4w9WgXcQ';

-- ============================================================
-- NOTA: daca baza exista deja (migrare din v4pro), ruleaza separat:
--   ALTER TABLE videos ADD COLUMN duration_seconds INTEGER DEFAULT 0;
--   CREATE VIRTUAL TABLE video_fts USING fts5(title, description, channel_title,
--     tokenize='unicode61 remove_diacritics 2', content='videos', content_rowid='id');
--   + cele 3 triggere de mai sus, apoi rebuild:
--   INSERT INTO video_fts(video_fts) VALUES('rebuild');
-- ============================================================
