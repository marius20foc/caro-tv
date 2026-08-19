'use client';

import { useEffect, useState } from 'react';
import AdminCategoriesPanel from '@/components/admin/AdminCategoriesPanel';
import AdminMappingsPanel from '@/components/admin/AdminMappingsPanel';
import AdminOverridesPanel from '@/components/admin/AdminOverridesPanel';
import AdminAddVideoPanel from '@/components/admin/AdminAddVideoPanel';

const TOKEN_KEY = 'caro_admin_token';

type Tab = 'categories' | 'mappings' | 'overrides' | 'addvideo';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'categories', label: 'Categorii & Playlist-uri' },
  { id: 'addvideo', label: 'Adaugă video manual' },
  { id: 'mappings', label: 'Mapare produse' },
  { id: 'overrides', label: 'Override-uri video' },
];

/**
 * Panou de administrare – autentificare cu tokenul ADMIN_TOKEN
 * (sessionStorage) + trei panouri: categorii/playlist-uri, mapare
 * produse CleanX, override-uri per video.
 */
export default function AdminPage() {
  const [token, setToken] = useState('');
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Tab>('categories');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState('');

  // la incarcare: daca exista un token salvat, il verificam cu serverul
  useEffect(() => {
    let stored = '';
    try {
      stored = sessionStorage.getItem(TOKEN_KEY) ?? '';
    } catch {
      stored = '';
    }
    if (!stored) return;

    const verify = async () => {
      try {
        const res = await fetch('/api/admin/verify', {
          headers: { authorization: `Bearer ${stored}` },
        });
        if (res.ok) {
          setToken(stored);
        } else {
          try {
            sessionStorage.removeItem(TOKEN_KEY);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* retea – ramane pe login */
      }
    };
    verify();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (!value || checking) return;

    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { authorization: `Bearer ${value}` },
      });
      if (!res.ok) {
        setError('Parolă incorectă. Încearcă din nou.');
        setInput('');
        return;
      }
      try {
        sessionStorage.setItem(TOKEN_KEY, value);
      } catch {
        /* storage indisponibil */
      }
      setToken(value);
    } catch {
      setError('Nu am putut verifica parola. Verifică conexiunea și încearcă din nou.');
    } finally {
      setChecking(false);
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken('');
  };

  const runSync = async () => {
    setSyncState('running');
    setSyncMsg('');
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncState('error');
        setSyncMsg(data.error ?? 'Sincronizarea a esuat.');
        return;
      }
      setSyncState('done');
      const r = data.report ?? {};
      setSyncMsg(
        `Sincronizare pornita ✓ — ${r.categories?.length ?? 0} categorii procesate, ` +
          `${r.translated ?? 0} descrieri traduse, ${r.yt_trending ?? 0} trending YouTube.`,
      );
    } catch {
      setSyncState('error');
      setSyncMsg('Eroare de retea. Incearca din nou.');
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 sm:px-6">
        <div className="terminal-window hud-corners rounded-2xl p-8">
          <p className="font-orbitron text-[11px] font-bold uppercase tracking-[0.3em] text-neon-pink animate-flicker">
            ◤ ACCESS RESTRICTIONAT ◢
          </p>
          <h1 className="mt-3 font-orbitron text-2xl font-black uppercase tracking-tight text-ink">
            Autentificare <span className="neon-gradient-text">admin</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Introdu parola de administrare pentru a continua.
          </p>
          <form onSubmit={login} className="mt-6 space-y-4">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="••••••••••••"
              aria-label="Token admin"
              className="admin-input"
              autoFocus
              autoComplete="off"
            />
            {error ? (
              <p className="rounded-md border border-neon-pink/40 bg-neon-pink/10 p-3 text-sm text-neon-pink" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={checking} className="btn-neon btn-neon-cyan w-full disabled:opacity-60">
              {checking ? 'Se verifică…' : 'Deblochează panoul →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-orbitron text-[11px] font-bold uppercase tracking-[0.3em] text-neon-cyan">
            ◤ PANOU DE CONTROL ◢
          </p>
          <h1 className="mt-2 font-orbitron text-3xl font-black uppercase tracking-tight">
            <span className="neon-gradient-text">Admin</span> CARO.TV
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runSync}
            disabled={syncState === 'running'}
            className="btn-neon btn-neon-cyan !px-4 !py-2 text-[10px] disabled:opacity-60"
          >
            {syncState === 'running' ? 'Se sincronizează…' : '⟳ Sincronizează acum'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="btn-neon btn-neon-pink !px-4 !py-2 text-[10px]"
          >
            Deconectare
          </button>
        </div>
      </div>

      {syncMsg ? (
        <p
          className={`mt-4 rounded-md border p-3 text-sm ${
            syncState === 'error'
              ? 'border-neon-pink/40 bg-neon-pink/10 text-neon-pink'
              : 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
          }`}
          role="status"
        >
          {syncMsg}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Secțiuni admin">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`category-chip !px-4 !py-2 text-xs ${tab === t.id ? '!border-neon-cyan !text-neon-cyan' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'categories' ? <AdminCategoriesPanel token={token} /> : null}
        {tab === 'addvideo' ? <AdminAddVideoPanel token={token} /> : null}
        {tab === 'mappings' ? <AdminMappingsPanel token={token} /> : null}
        {tab === 'overrides' ? <AdminOverridesPanel token={token} /> : null}
      </div>

      <div className="mt-10 rounded-lg border border-white/5 bg-void2/50 p-4 text-sm text-ink-muted">
        <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.25em] text-neon-violet">
          Cum funcționează
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
          <li>Cron-ul rulează zilnic la 03:00 UTC și sincronizează playlist-urile YouTube în D1.</li>
          <li>Linkurile contextuale respectă regula: produs exact → categorie → fără link.</li>
          <li>Overrides au prioritate maximă; mapping-ul se potrivește prin keywords.</li>
          <li>Pentru sincronizare imediată, apelează trigger-ul manual al worker-ului (Bearer MANUAL_TOKEN).</li>
        </ul>
      </div>
    </div>
  );
}
