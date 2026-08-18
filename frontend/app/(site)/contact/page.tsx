import type { Metadata } from 'next';
import Link from 'next/link';
import { contactMetadata } from '@/lib/seo';
import { CLEANX_EMAIL, CLEANX_HOME, CLEANX_LOCATION } from '@/lib/constants';

export const runtime = 'edge';

export const metadata: Metadata = contactMetadata();

export default function ContactPage() {
  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact CARO.TV',
    url: 'https://caro.tv/contact',
    inLanguage: 'ro-RO',
    mainEntity: {
      '@type': 'Organization',
      name: 'CleanX.ro',
      email: CLEANX_EMAIL,
      address: { '@type': 'PostalAddress', addressCountry: 'RO' },
      url: CLEANX_HOME,
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
          <li>
            <Link href="/" className="transition-colors hover:text-neon-cyan">
              Acasă
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neon-cyan">Contact</li>
        </ol>
      </nav>

      <div className="terminal-window hud-corners relative overflow-hidden rounded-2xl">
        {/* bara titlu tip terminal */}
        <div className="flex items-center gap-2 border-b border-neon-cyan/20 px-5 py-3">
          <span className="terminal-dot bg-neon-pink" aria-hidden="true" />
          <span className="terminal-dot bg-[#facc15]" aria-hidden="true" />
          <span className="terminal-dot bg-neon-cyan" aria-hidden="true" />
          <span className="ml-3 font-orbitron text-[11px] font-bold uppercase tracking-[0.25em] text-ink-muted">
            contact@caro.tv
          </span>
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="font-orbitron text-3xl font-black uppercase tracking-tight sm:text-4xl">
            <span className="neon-gradient-text">Contact</span>
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Ai o întrebare despre produsele din videoclipuri? Ne găsești la:
          </p>

          <dl className="mt-8 space-y-6">
            <div className="flex items-start gap-4 rounded-lg border border-white/5 bg-void2/60 p-4">
              <span aria-hidden="true" className="mt-0.5 text-xl">
                ✉️
              </span>
              <div>
                <dt className="font-orbitron text-[10px] font-bold uppercase tracking-[0.25em] text-neon-cyan">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${CLEANX_EMAIL}`}
                    className="text-lg font-semibold text-ink transition-colors hover:text-neon-cyan"
                  >
                    {CLEANX_EMAIL}
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-white/5 bg-void2/60 p-4">
              <span aria-hidden="true" className="mt-0.5 text-xl">
                📍
              </span>
              <div>
                <dt className="font-orbitron text-[10px] font-bold uppercase tracking-[0.25em] text-neon-violet">
                  Locație
                </dt>
                <dd className="mt-1 text-lg font-semibold text-ink">{CLEANX_LOCATION}</dd>
              </div>
            </div>
          </dl>

          <div className="mt-10 border-t border-white/5 pt-6 text-center">
            <p className="text-xs text-ink-faint">
              Vizitează magazinul partener pentru produsele din videoclipuri:
            </p>
            <a
              href={CLEANX_HOME}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon btn-neon-pink mt-4"
            >
              CleanX.ro →
            </a>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
    </div>
  );
}
