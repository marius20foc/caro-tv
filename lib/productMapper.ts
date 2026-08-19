// ============================================================
// CARO.TV – regula de linkuire contextuala catre CleanX.ro
// ------------------------------------------------------------
// Prioritate:
//   1. Produs exact   – override manual (video_product_overrides) SAU
//                       keyword-match din product_mapping.cleanx_product_url
//   2. Categoria      – categories.default_product_url / cleanx_category_url
//   3. Nimic          – nu se afiseaza niciun link contextual
// EXCEPTII (popup + bannere) – singurele care trimit la https://cleanx.ro (home).
// ============================================================

import type { ProductMappingRow, ProductOverrideRow } from './db';

export interface ContextualLink {
  href: string;
  label: string;
  kind: 'product' | 'category';
}

export interface ResolveOptions {
  video: { id: number; title: string; description?: string | null };
  categorySlug: string;
  overrides?: ProductOverrideRow | null;
  mappings?: ProductMappingRow[];
  defaultProductUrl?: string | null;
}

const PRODUCT_LABEL = 'Vezi produsul pe CleanX.ro';
const CATEGORY_LABEL = 'Vezi produsele în magazinul partener';

/** Normalizeaza textul: lowercase + fara diacritice (potrivire robusta). */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Verifica daca vreun keyword din lista CSV apare in titlu/descriere. */
export function keywordsMatch(
  title: string,
  description: string | null | undefined,
  keywords: string | null | undefined,
): boolean {
  if (!keywords) return false;
  const haystack = normalizeText(`${title} ${description ?? ''}`);
  return keywords
    .split(',')
    .map(normalizeText)
    .filter(Boolean)
    .some((kw) => haystack.includes(kw));
}

export function resolveContextualLink(opts: ResolveOptions): ContextualLink | null {
  const { video, overrides, mappings = [], defaultProductUrl } = opts;

  // 1) Override manual – prioritate maxima (indiferent de keywords)
  if (overrides) {
    if (overrides.cleanx_product_url) {
      return {
        href: overrides.cleanx_product_url,
        label: overrides.cleanx_product_name || PRODUCT_LABEL,
        kind: 'product',
      };
    }
    return { href: overrides.cleanx_category_url, label: CATEGORY_LABEL, kind: 'category' };
  }

  // 2) Produs exact – keyword-match in titlu/descriere
  for (const m of mappings) {
    if (m.cleanx_product_url && keywordsMatch(video.title, video.description, m.keywords)) {
      return {
        href: m.cleanx_product_url,
        label: m.cleanx_product_name || PRODUCT_LABEL,
        kind: 'product',
      };
    }
  }

  // 3) Categoria – fallback pe pagina categoriei
  if (defaultProductUrl) {
    return { href: defaultProductUrl, label: CATEGORY_LABEL, kind: 'category' };
  }
  for (const m of mappings) {
    if (m.cleanx_category_url) {
      return { href: m.cleanx_category_url, label: CATEGORY_LABEL, kind: 'category' };
    }
  }

  // 4) Nici produs, nici categorie – fara link contextual
  return null;
}
