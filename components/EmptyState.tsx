import Link from 'next/link';

/**
 * Stare goală elegantă (categorie fără videoclipuri / căutare fără rezultate).
 */
export default function EmptyState({
  icon = '🛰️',
  title,
  text,
  actionHref,
  actionLabel,
}: {
  icon?: string;
  title: string;
  text?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="glass hud-corners mx-auto max-w-lg rounded-2xl p-10 text-center">
      <p className="text-4xl" aria-hidden="true">
        {icon}
      </p>
      <h3 className="mt-4 font-orbitron text-lg font-bold uppercase tracking-wider text-ink">
        {title}
      </h3>
      {text ? <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p> : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn-neon btn-neon-cyan mt-6">
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}
