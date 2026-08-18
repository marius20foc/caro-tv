'use client';

import { useEffect, useState } from 'react';
import { applyTheme, getInitialTheme, setTheme, type Theme } from '@/lib/client-storage';

/**
 * Comutator temă dark/light – clasic, instant, salvat în localStorage.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    setThemeState(getInitialTheme());
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label={theme === 'dark' ? 'Comută pe tema luminoasă' : 'Comută pe tema întunecată'}
      title={theme === 'dark' ? 'Temă luminoasă' : 'Temă întunecată'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
