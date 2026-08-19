'use client';

import { useEffect, useState } from 'react';

/**
 * Fundal hero cu fotografii de pe Unsplash (topic: detailing auto).
 * La fiecare incarcare a paginii se alege aleator una din cele 10 imagini.
 * Daca o imagine nu se incarca, trece automat la urmatoarea; dupa mai
 * multe esecuri, fundalul dispare si ramane gradientul site-ului.
 */
const IMAGES: string[] = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=70&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=70&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=70&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1489824904134-891ab64532f1?q=70&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=70&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?q=70&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=70&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600661653561-629509216228?q=70&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=70&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?q=70&w=1600&auto=format&fit=crop',
];

export default function HeroBackdrop() {
  const [idx, setIdx] = useState(-1);
  const [failures, setFailures] = useState(0);

  useEffect(() => {
    setIdx(Math.floor(Math.random() * IMAGES.length));
  }, []);

  if (idx < 0 || failures >= 3) return null;

  const onError = () => {
    setFailures((f) => f + 1);
    setIdx((current) => (current + 1) % IMAGES.length);
  };

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <img
        src={IMAGES[idx]}
        alt=""
        loading="eager"
        decoding="async"
        onError={onError}
        className="h-full w-full object-cover"
      />
      {/* strat de integrare: intunecat + gradient in culoarea site-ului */}
      <div className="absolute inset-0 bg-void/80" />
      <div className="absolute inset-0 bg-gradient-to-b from-void/70 via-void/60 to-void" />
    </div>
  );
}
