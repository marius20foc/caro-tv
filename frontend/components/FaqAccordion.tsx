import type { FaqItem } from '@/lib/db';

/**
 * Acordeon FAQ premium – <details>/<summary> nativ (zero JS),
 * cu FAQPage JSON-LD atasat de pagina parinte.
 */
export default function FaqAccordion({ faq }: { faq: FaqItem[] }) {
  if (!faq.length) return null;

  return (
    <div className="space-y-3">
      {faq.map((item, i) => (
        <details key={i} className="faq-item">
          <summary>{item.q}</summary>
          <p className="px-5 pb-5 pl-12 text-sm leading-relaxed text-ink-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
