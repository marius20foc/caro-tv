'use client';

import { useCallback, useEffect, useState } from 'react';

interface AdminCategory {
  slug: string;
  name: string;
  icon: string | null;
  playlist_id: string | null;
  accent: string | null;
  seo_title: string | null;
  seo_description: string | null;
  video_count: number;
}

/**
 * Panou admin: playlist-urile YouTube + câmpurile SEO ale fiecărei categorii.
 */
export default function AdminCategoriesPanel({ token }: { token: string }) {
  const [rows, setRows] = useState<AdminCategory[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la incarcare');
      setRows(data.categories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare la incarcare');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (slug: string, patch: Partial<AdminCategory>) =>
    setRows((prev) => prev.map((r) => (r.slug === slug ? { ...r, ...patch } : r)));

  const save = async (slug: string) => {
    const row = rows.find((r) => r.slug === slug);
    if (!row) return;
    setSaving(slug);
    setError('');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          slug,
          playlist_id: row.playlist_id || null,
          accent: row.accent,
          seo_title: row.seo_title,
          seo_description: row.seo_description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la salvare');
      setNotice(`Categoria „${slug}” salvată ✓`);
      window.setTimeout(() => setNotice(''), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare la salvare');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-md border border-neon-pink/40 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      {notice ? <p className="rounded-md border border-neon-cyan/40 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{notice}</p> : null}

      <p className="text-sm text-ink-muted">
        Introdu ID-ul playlist-ului YouTube pentru fiecare categorie. Cron-ul de la 03:00
        sincronizează automat videoclipurile. Salvează apoi apelezi „Sincronizează acum” (Worker cron).
      </p>

      <div className="space-y-4">
        {rows.map((r) => (
          <fieldset key={r.slug} className="glass rounded-lg p-4">
            <legend className="px-2 font-orbitron text-xs font-bold uppercase tracking-[0.2em] text-neon-cyan">
              {r.icon ?? '▸'} {r.name} <span className="text-ink-faint">({r.video_count} video)</span>
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-ink-muted">
                Playlist ID (YouTube)
                <input
                  className="admin-input mt-1 font-mono"
                  value={r.playlist_id ?? ''}
                  placeholder="PLXXXXXXXXXXXXXXXXXXXX"
                  onChange={(e) => update(r.slug, { playlist_id: e.target.value })}
                />
              </label>
              <label className="text-xs text-ink-muted">
                Accent (culoare neon)
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-void2"
                    value={r.accent ?? '#00f0ff'}
                    onChange={(e) => update(r.slug, { accent: e.target.value })}
                  />
                  <input
                    className="admin-input font-mono"
                    value={r.accent ?? ''}
                    onChange={(e) => update(r.slug, { accent: e.target.value })}
                  />
                </div>
              </label>
              <label className="text-xs text-ink-muted sm:col-span-2">
                SEO Title
                <input
                  className="admin-input mt-1"
                  value={r.seo_title ?? ''}
                  onChange={(e) => update(r.slug, { seo_title: e.target.value })}
                />
              </label>
              <label className="text-xs text-ink-muted sm:col-span-2">
                SEO Description
                <textarea
                  className="admin-input mt-1 min-h-[64px]"
                  value={r.seo_description ?? ''}
                  onChange={(e) => update(r.slug, { seo_description: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => save(r.slug)}
                disabled={saving === r.slug}
                className="btn-neon btn-neon-cyan !px-4 !py-2 text-[10px]"
              >
                {saving === r.slug ? 'Se salvează…' : 'Salvează ✓'}
              </button>
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
