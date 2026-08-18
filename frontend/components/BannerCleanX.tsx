import { CLEANX_HOME } from '@/lib/constants';

/**
 * Banner CleanX – exceptie de linkuire: trimite la https://cleanx.ro (home).
 * Variante: 'inline' (intre videoclipuri) | 'sidebar' (coloana laterala).
 */
export default function BannerCleanX({
  variant = 'inline',
  title = 'CleanX.ro',
  text = 'Echipament, produse și consumabile pentru detailing auto – livrare în toată România.',
}: {
  variant?: 'inline' | 'sidebar';
  title?: string;
  text?: string;
}) {
  const isSidebar = variant === 'sidebar';

  return (
    <a
      href={CLEANX_HOME}
      target="_blank"
      rel="noopener noreferrer"
      className={`banner-neon card-lift group flex ${isSidebar ? 'flex-col' : 'flex-col sm:flex-row'} items-center justify-between gap-4 rounded-xl p-6`}
    >
      <div className={isSidebar ? 'text-center' : 'text-center sm:text-left'}>
        <p className="font-orbitron text-[11px] font-bold uppercase tracking-[0.3em] text-neon-pink">
          ◤ Magazin partener ◢
        </p>
        <h3 className="mt-2 font-orbitron text-xl font-black uppercase tracking-wider text-ink">
          {title}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{text}</p>
      </div>
      <span className="btn-neon btn-neon-pink shrink-0">
        Vizitează magazinul
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </span>
    </a>
  );
}
