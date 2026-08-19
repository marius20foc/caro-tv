import Link from 'next/link';
import ParticleField from './ParticleField';
import PopupCleanX from './PopupCleanX';
import SearchModal from './SearchModal';
import SearchTrigger from './SearchTrigger';
import ThemeToggle from './ThemeToggle';
import AuroraBackground from './AuroraBackground';
import HudFrame from './HudFrame';
import TickerMarquee from './TickerMarquee';
import { CLEANX_EMAIL, SITE_NAME, categoryAccent } from '@/lib/constants';
import type { CategoryRow } from '@/lib/db';

/**
 * Shell sci-fi premium: aurora + particule + scanlines + HUD frame,
 * header neon cu cautare globala, ticker categorii, footer.
 * Componenta server – include client components.
 */
export default function SciFiLayout({
  categories,
  children,
}: {
  categories: CategoryRow[];
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <AuroraBackground />
      <ParticleField />
      <HudFrame />

      {/* overlay scanlines global */}
      <div className="scanlines pointer-events-none fixed inset-0 z-[5]" aria-hidden="true" />

      {/* ---------- HEADER ---------- */}
      <header className="glass sticky top-0 z-50 border-b border-neon-cyan/20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 md:px-8">
          <Link href="/" className="group flex items-center gap-3" aria-label={`${SITE_NAME} – Acasă`}>
            <span className="grid h-9 w-9 place-items-center rounded-md border border-neon-cyan/50 bg-void2 font-orbitron text-lg font-black text-neon-cyan shadow-glow-sm transition-shadow group-hover:shadow-neon-cyan">
              C
            </span>
            <span className="font-orbitron text-lg font-black uppercase tracking-[0.25em]">
              <span className="neon-gradient-text">CARO</span>
              <span className="text-ink-faint">.TV</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navigație principală">
            {/* Dropdown categorii (CSS hover) */}
            <div className="group relative">
              <button
                type="button"
                className="font-orbitron text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition-colors hover:text-neon-cyan"
                aria-haspopup="true"
              >
                Categorii ▾
              </button>
              <div className="invisible absolute left-1/2 z-50 w-[36rem] -translate-x-1/2 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="glass-strong hud-corners grid grid-cols-2 gap-1 rounded-xl p-3">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/category/${c.slug}`}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-neon-cyan/10 hover:text-neon-cyan"
                    >
                      <span aria-hidden="true">{c.icon ?? '▸'}</span>
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-void2/60 text-sm transition-colors hover:border-neon-cyan/50" />
            <SearchTrigger className="flex items-center gap-2 rounded-md border border-white/10 bg-void2/60 px-3 py-2 font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan" />
          </div>
        </div>
      </header>

      {/* ---------- Ticker categorii ---------- */}
      <div className="relative z-10 border-b border-white/5 bg-void2/70">
        <TickerMarquee>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="flex items-center gap-2 font-orbitron text-[10px] font-bold uppercase tracking-[0.25em] text-ink-faint transition-colors hover:text-neon-cyan"
            >
              <span aria-hidden="true" style={{ color: categoryAccent(c.slug, c.accent) }}>
                ◈
              </span>
              {c.name}
            </Link>
          ))}
          <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.25em] text-neon-pink">
            ◤ partener oficial CleanX.ro ◢
          </span>
        </TickerMarquee>
      </div>

      {/* ---------- MAIN ---------- */}
      <main className="relative z-10 flex-1">{children}</main>

      {/* ---------- FOOTER ---------- */}
      <footer className="glass relative z-10 mt-16 border-t border-neon-violet/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="font-orbitron text-lg font-black uppercase tracking-[0.25em]">
                <span className="neon-gradient-text">CARO</span>
                <span className="text-ink-faint">.TV</span>
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
                Universul sci-fi al detailing-ului auto.
              </p>
            </div>

            <nav aria-label="Categorii footer">
              <p className="font-orbitron text-xs font-bold uppercase tracking-[0.25em] text-neon-cyan">
                Categorii
              </p>
              <ul className="mt-4 space-y-2">
                {categories.slice(0, 5).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="text-sm text-ink-muted transition-colors hover:text-neon-cyan"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Categorii footer 2">
              <p className="font-orbitron text-xs font-bold uppercase tracking-[0.25em] text-neon-violet">
                Categorii
              </p>
              <ul className="mt-4 space-y-2">
                {categories.slice(5).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="text-sm text-ink-muted transition-colors hover:text-neon-violet"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="font-orbitron text-xs font-bold uppercase tracking-[0.25em] text-neon-pink">
                Contact
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                <li>
                  <a href={`mailto:${CLEANX_EMAIL}`} className="transition-colors hover:text-neon-cyan">
                    {CLEANX_EMAIL}
                  </a>
                </li>
                <li>ROMÂNIA</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-ink-faint sm:flex-row">
            <p>© {new Date().getFullYear()} {SITE_NAME} – agregator video detailing auto.</p>
            <p className="flex items-center gap-3 uppercase tracking-widest">
              <Link href="/admin" className="transition-colors hover:text-neon-cyan">
                Admin
              </Link>
              <span aria-hidden="true">|</span>
              <span>
                <span aria-hidden="true" style={{ color: '#F6821F' }}>
                  //
                </span>{' '}
                powered by{' '}
                <a
                  href="https://www.cloudflare.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80"
                  style={{ color: '#F6821F' }}
                >
                  cloudflare.com
                </a>
              </span>
            </p>
          </div>
        </div>
      </footer>

      {/* popup exceptie CleanX (10–15s / exit-intent) */}
      <PopupCleanX />
      {/* cautare globala Ctrl+K */}
      <SearchModal />
    </div>
  );
}
