import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-orbitron text-[11px] font-bold uppercase tracking-[0.4em] text-neon-pink animate-flicker">
        ◤ ERORARE 404 ◢
      </p>
      <h1 className="mt-6 font-orbitron text-7xl font-black uppercase tracking-tight sm:text-9xl">
        <span className="neon-gradient-text">LOST</span>
      </h1>
      <p className="mt-6 max-w-md text-balance text-base leading-relaxed text-ink-muted">
        Sectorul pe care îl cauți nu există în acest univers. Poate a fost decuplat din matrice —
        hai înapoi în spațiul sigur.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="btn-neon btn-neon-cyan">
          ← Înapoi acasă
        </Link>
        <Link href="/contact" className="btn-neon btn-neon-violet">
          Contact
        </Link>
      </div>
    </div>
  );
}
