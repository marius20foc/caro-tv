import SciFiLayout from '@/components/SciFiLayout';
import { listCategories } from '@/lib/db';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Layout-ul SITE-ULUI (route group): shell sci-fi + navigatie + categorii
 * din D1. Toate paginile reale traiesc aici. Pagina 404 globala ramane
 * in layout-ul radacina (static), cum cere Cloudflare Pages.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  try {
    categories = await listCategories();
  } catch {
    categories = [];
  }

  return <SciFiLayout categories={categories}>{children}</SciFiLayout>;
}
