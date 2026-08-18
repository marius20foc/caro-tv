import type { Metadata } from 'next';

export const runtime = 'edge';

/** Panoul de admin nu se indexeaza niciodata. */
export const metadata: Metadata = {
  title: { absolute: 'Admin – Panou de control | CARO.TV' },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
