'use client';

import { useEffect, useState } from 'react';
import AdminCategoriesPanel from '@/components/admin/AdminCategoriesPanel';
import AdminMappingsPanel from '@/components/admin/AdminMappingsPanel';
import AdminOverridesPanel from '@/components/admin/AdminOverridesPanel';

const TOKEN_KEY = 'caro_admin_token';

type Tab = 'categories' | 'mappings' | 'overrides';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'categories', label: 'Categorii & Playlist-uri' },
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

  useEffect(() => {
    try {
      setToken(sessionStorage.getItem(TOKEN_KEY) ?? '');
    } catch {
      setToken('');
    }
  }, []);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    try {
      sessionStorage.setItem(TOKEN_KEY, value);
    } catch {
      /* storage indisponibil */
    }
    setToken(value);
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken('');
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
            <button type="submit" className="btn-neon btn-neon-cyan w-full">
              Deblochează panoul →
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
        <button
          type="button"
          onClick={logout}
          className="btn-neon btn-neon-pink !px-4 !py-2 text-[10px]"
        >
          Deconectare
        </button>
      </div>

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
