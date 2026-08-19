// ============================================================
// CARO.TV – mapper linkuri contextuale (varianta Pages Functions pure)
// Aceeasi regula ca frontend/lib/productMapper.ts:
//   1. Produs exact -> 2. Categoria -> 3. Nimic (fara link)
// ============================================================

const PRODUCT_LABEL = 'Vezi produsul pe CleanX.ro';
const CATEGORY_LABEL = 'Vezi produsele în magazinul partener';

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function keywordsMatch(title, description, keywords) {
  if (!keywords) return false;
  const haystack = normalizeText(`${title} ${description ?? ''}`);
  return String(keywords)
    .split(',')
    .map(normalizeText)
    .filter(Boolean)
    .some((kw) => haystack.includes(kw));
}

export function resolveContextualLink({ video, overrides = null, mappings = [], defaultProductUrl = null }) {
  // 1) Override manual – prioritate maxima
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

  // 2) Produs exact – keyword match
  for (const m of mappings) {
    if (m.cleanx_product_url && keywordsMatch(video.title, video.description, m.keywords)) {
      return {
        href: m.cleanx_product_url,
        label: m.cleanx_product_name || PRODUCT_LABEL,
        kind: 'product',
      };
    }
  }

  // 3) Categoria – fallback
  if (defaultProductUrl) {
    return { href: defaultProductUrl, label: CATEGORY_LABEL, kind: 'category' };
  }
  for (const m of mappings) {
    if (m.cleanx_category_url) {
      return { href: m.cleanx_category_url, label: CATEGORY_LABEL, kind: 'category' };
    }
  }

  // 4) Nimic
  return null;
}
