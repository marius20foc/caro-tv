'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Suggestion {
  youtube_id: string;
  title: string;
  channel_title: string | null;
}

/**
 * Cautare globala v3: Ctrl+K + sugestii instant (FTS5, debounce 250ms)
 * + navigare cu tastele ↑/↓/Enter/Esc.
 */
export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const onOpenEvent = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('caro:open-search', onOpenEvent);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('caro:open-search', onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    if (!open) setSuggestions([]);
  }, [open]);

  // sugestii instant (debounce)
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setActiveIdx(-1);
      return;
    }
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = (await res.json()) as { suggestions?: Suggestion[] };
          setSuggestions(data.suggestions ?? []);
          setActiveIdx(-1);
        }
      } catch {
        /* retea – ignoram */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(debounceRef.current);
  }, [q]);

  const goSearch = (query: string) => {
    setOpen(false);
    setQ('');
    router.push(`/cautare?q=${encodeURIComponent(query)}`);
  };

  const goVideo = (youtubeId: string) => {
    setOpen(false);
    setQ('');
    router.push(`/video/${youtubeId}`);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      goVideo(suggestions[activeIdx].youtube_id);
      return;
    }
    const query = q.trim();
    if (query) goSearch(query);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    }
  };

  if (!open) return null;

  return (
    <div
      className="search-backdrop fixed inset-0 z-[110] flex items-start justify-center p-4 pt-[14vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Căutare"
      onClick={() => setOpen(false)}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong hud-corners w-full max-w-xl rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <span className="font-orbitron text-xl text-neon-cyan" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Caută videoclipuri, produse, tehnici…"
            aria-label="Caută videoclipuri"
            autoComplete="off"
            className="flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-ink-faint"
          />
          {loading ? (
            <span className="font-orbitron text-[10px] uppercase tracking-widest text-ink-faint">
              căutare…
            </span>
          ) : null}
          <kbd className="rounded border border-white/15 px-2 py-1 font-orbitron text-[10px] uppercase text-ink-faint">
            Esc
          </kbd>
        </div>

        {suggestions.length > 0 ? (
          <ul className="mt-3 max-h-72 overflow-y-auto border-t border-white/5 pt-2" role="listbox">
            {suggestions.map((s, i) => (
              <li key={s.youtube_id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === activeIdx}
                  onClick={() => goVideo(s.youtube_id)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                    i === activeIdx ? 'bg-neon-cyan/10' : ''
                  }`}
                >
                  <span className="shrink-0 text-ink-faint" aria-hidden="true">
                    ▶
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 block text-sm text-ink">{s.title}</span>
                    <span className="block text-xs text-ink-faint">{s.channel_title ?? 'YouTube'}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
          <p className="font-orbitron text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Enter = caută · ↑↓ navighează sugestiile
          </p>
          <button type="submit" className="btn-neon btn-neon-cyan !px-4 !py-2 text-[10px]">
            Caută →
          </button>
        </div>
      </form>
    </div>
  );
}
