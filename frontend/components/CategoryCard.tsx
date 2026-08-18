import Link from 'next/link';
import type { CategoryWithCount } from '@/lib/db';

/**
 * Card categorie – link intern catre /category/[slug].
 */
export default function CategoryCard({ category }: { category: CategoryWithCount }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="category-chip hud-corners"
    >
      <span aria-hidden="true" className="text-2xl">
        {category.icon ?? '▸'}
      </span>
      <span className="flex-1">
        <span className="block">{category.name}</span>
        <span className="block font-space text-[10px] font-normal normal-case tracking-normal text-ink-faint">
          {category.video_count} videoclipuri
        </span>
      </span>
      <span aria-hidden="true" className="text-neon-cyan">
        →
      </span>
    </Link>
  );
}
