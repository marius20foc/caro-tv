'use client';

import { useCallback, useEffect, useState } from 'react';

interface Override {
  video_id: number;
  youtube_id: string;
  video_title: string;
  cleanx_product_url: string | null;
  cleanx_category_url: string;
  cleanx_product_name: string | null;
}

/**
 * Panou admin: override-uri manuale de link contextual per video
 * (prioritate maxima in regula de linkuire).
 */
export default function AdminOverridesPanel({ token }: { token: string }) {
  const [rows, setRows] = useState<Override[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    youtube_id: '',
    cleanx_product_url: '',
    cleanx_category_url: '',
    cleanx_product_name: '',
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overrides', {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la incarcare');
      setRows(data.overrides ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare la incarcare');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string, isError = false) => {
    if (isError) setError(msg);
    else setNotice(msg);
    window.setTimeout(() => {
      setError('');
      setNotice('');
    }, 2500);
  };

  const upsert = async () => {
    if (!form.youtube_id || !form.cleanx_category_url) {
      flash('Completează ID-ul video și URL-ul categoriei.', true);
      return;
    }
    try {
      const res = await fetch('/api/admin/overrides', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          youtube_id: form.youtube_id.trim(),
          cleanx_product_url: form.cleanx_product_url || null,
          cleanx_category_url: form.cleanx_category_url,
          cleanx_product_name: form.cleanx_product_name || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la salvare');
      flash('Override salvat ✓');
      setForm({ youtube_id: '', cleanx_product_url: '', cleanx_category_url: '', cleanx_product_name: '' });
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Eroare', true);
    }
  };

  const remove = async (videoId: number) => {
    if (!window.confirm('Ștergi acest override?')) return;
    try {
      const res = await fetch('/api/admin/overrides', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ video_id: videoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la ștergere');
      flash('Override șters ✓');
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Eroare', true);
    }
  };

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md border border-neon-pink/40 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      {notice ? <p className="rounded-md border border-neon-cyan/40 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{notice}</p> : null}

      <div className="glass rounded-lg p-4">
        <p className="font-orbitron text-xs font-bold uppercase tracking-[0.2em] text-neon-pink">
          + Override per video (forțează linkul contextual)
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-ink-muted">
            YouTube ID video
            <input
              className="admin-input mt-1 font-mono"
              placeholder="dQw4w9WgXcQ"
              value={form.youtube_id}
              onChange={(e) => setForm({ ...form, youtube_id: e.target.value })}
            />
          </label>
          <label className="text-xs text-ink-muted">
            Nume produs (label)
            <input
              className="admin-input mt-1"
              value={form.cleanx_product_name}
              onChange={(e) => setForm({ ...form, cleanx_product_name: e.target.value })}
            />
          </label>
          <label className="text-xs text-ink-muted">
            URL produs exact (optional)
            <input
              className="admin-input mt-1 font-mono"
              placeholder="https://cleanx.ro/..."
              value={form.cleanx_product_url}
              onChange={(e) => setForm({ ...form, cleanx_product_url: e.target.value })}
            />
          </label>
          <label className="text-xs text-ink-muted">
            URL categorie (obligatoriu)
            <input
              className="admin-input mt-1 font-mono"
              placeholder="https://cleanx.ro/..."
              value={form.cleanx_category_url}
              onChange={(e) => setForm({ ...form, cleanx_category_url: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-3 text-right">
          <button type="button" onClick={upsert} className="btn-neon btn-neon-pink !px-4 !py-2 text-[10px]">
            Salvează override
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 font-orbitron text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              <th className="px-2 py-2">Video</th>
              <th className="px-2 py-2">Link produs</th>
              <th className="px-2 py-2 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.video_id} className="border-b border-white/5">
                <td className="max-w-[260px] truncate px-2 py-2">
                  <a href={`/video/${o.youtube_id}`} className="text-ink hover:text-neon-cyan">
                    {o.video_title}
                  </a>
                </td>
                <td className="max-w-[240px] truncate px-2 py-2">
                  {o.cleanx_product_url ? (
                    <a href={o.cleanx_product_url} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">
                      {o.cleanx_product_name ?? o.cleanx_product_url}
                    </a>
                  ) : (
                    <span className="text-ink-faint">Categorie: {o.cleanx_category_url}</span>
                  )}
                </td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => remove(o.video_id)}
                    className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-neon-pink hover:underline"
                  >
                    Șterge
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={3} className="px-2 py-6 text-center text-ink-faint">
                  Niciun override încă.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
