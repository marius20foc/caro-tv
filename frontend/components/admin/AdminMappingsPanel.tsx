'use client';

import { useCallback, useEffect, useState } from 'react';

interface Mapping {
  id: number;
  category_slug: string;
  category_name: string | null;
  cleanx_product_url: string | null;
  cleanx_category_url: string;
  cleanx_product_name: string | null;
  keywords: string | null;
  is_active: number;
}

interface CategoryOption {
  slug: string;
  name: string;
}

/**
 * Panou admin: maparea produse CleanX.ro <-> categorii (linkuri contextuale).
 */
export default function AdminMappingsPanel({ token }: { token: string }) {
  const [rows, setRows] = useState<Mapping[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    category_slug: '',
    cleanx_product_url: '',
    cleanx_category_url: '',
    cleanx_product_name: '',
    keywords: '',
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/mappings', {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la incarcare');
      setRows(data.mappings ?? []);
      setCategories(data.categories ?? []);
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

  const create = async () => {
    if (!form.category_slug || !form.cleanx_category_url) {
      flash('Completează categoria și URL-ul categoriei.', true);
      return;
    }
    try {
      const res = await fetch('/api/admin/mappings', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category_slug: form.category_slug,
          cleanx_product_url: form.cleanx_product_url || null,
          cleanx_category_url: form.cleanx_category_url,
          cleanx_product_name: form.cleanx_product_name || null,
          keywords: form.keywords || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la creare');
      flash('Mapare adăugată ✓');
      setForm({ category_slug: '', cleanx_product_url: '', cleanx_category_url: '', cleanx_product_name: '', keywords: '' });
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Eroare', true);
    }
  };

  const toggle = async (m: Mapping) => {
    try {
      const res = await fetch('/api/admin/mappings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: m.id, is_active: m.is_active ? 0 : 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare');
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Eroare', true);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Ștergi această mapare?')) return;
    try {
      const res = await fetch('/api/admin/mappings', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la ștergere');
      flash('Mapare ștearsă ✓');
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Eroare', true);
    }
  };

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-md border border-neon-pink/40 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      {notice ? <p className="rounded-md border border-neon-cyan/40 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{notice}</p> : null}

      {/* Formular adaugare */}
      <div className="glass rounded-lg p-4">
        <p className="font-orbitron text-xs font-bold uppercase tracking-[0.2em] text-neon-violet">
          + Mapare nouă
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-ink-muted">
            Categorie
            <select
              className="admin-input mt-1"
              value={form.category_slug}
              onChange={(e) => setForm({ ...form, category_slug: e.target.value })}
            >
              <option value="">— alege —</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
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
            URL produs exact (cleanx.ro) – poate fi gol
            <input
              className="admin-input mt-1 font-mono"
              placeholder="https://cleanx.ro/..."
              value={form.cleanx_product_url}
              onChange={(e) => setForm({ ...form, cleanx_product_url: e.target.value })}
            />
          </label>
          <label className="text-xs text-ink-muted">
            URL categorie (cleanx.ro) – obligatoriu
            <input
              className="admin-input mt-1 font-mono"
              placeholder="https://cleanx.ro/..."
              value={form.cleanx_category_url}
              onChange={(e) => setForm({ ...form, cleanx_category_url: e.target.value })}
            />
          </label>
          <label className="text-xs text-ink-muted sm:col-span-2">
            Keywords (CSV – potrivire în titlu/descriere)
            <input
              className="admin-input mt-1"
              placeholder="500gsm, microfibra, prosop"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-3 text-right">
          <button type="button" onClick={create} className="btn-neon btn-neon-violet !px-4 !py-2 text-[10px]">
            Adaugă mapare
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 font-orbitron text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              <th className="px-2 py-2">Categorie</th>
              <th className="px-2 py-2">Produs</th>
              <th className="px-2 py-2">Keywords</th>
              <th className="px-2 py-2">Activ</th>
              <th className="px-2 py-2 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-white/5">
                <td className="px-2 py-2 text-ink-muted">{m.category_name ?? m.category_slug}</td>
                <td className="max-w-[220px] truncate px-2 py-2">
                  {m.cleanx_product_url ? (
                    <a href={m.cleanx_product_url} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">
                      {m.cleanx_product_name ?? m.cleanx_product_url}
                    </a>
                  ) : (
                    <span className="text-ink-faint">— (doar categorie)</span>
                  )}
                </td>
                <td className="max-w-[180px] truncate px-2 py-2 text-ink-faint">{m.keywords ?? '—'}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => toggle(m)}
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${m.is_active ? 'bg-neon-cyan/15 text-neon-cyan' : 'bg-white/5 text-ink-faint'}`}
                  >
                    {m.is_active ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-neon-pink hover:underline"
                  >
                    Șterge
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
