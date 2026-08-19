'use client';

import { useCallback, useEffect, useState } from 'react';

interface CategoryOption {
  slug: string;
  name: string;
}

/**
 * Panou admin: adauga un videoclip manual intr-o categorie
 * (link YouTube sau ID) – adus cu titlu, descriere, durata si views.
 */
export default function AdminAddVideoPanel({ token }: { token: string }) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; videoId?: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories', {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCategories(data.categories ?? []);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !category || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ youtube_id: url.trim(), category_slug: category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? 'Eroare la adaugare' });
      } else {
        setResult({
          ok: true,
          message: `Adăugat: ${data.video?.title ?? ''}`,
          videoId: data.video?.youtube_id,
        });
        setUrl('');
      }
    } catch {
      setResult({ ok: false, message: 'Eroare de retea. Incearca din nou.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Adaugi manual un videoclip intr-o categorie: lipesti linkul YouTube (sau ID-ul) si alegi
        categoria. Titlul, descrierea, durata si vizualizarile se aduc automat de la YouTube
        (1 unitate de cota per video).
      </p>

      <form onSubmit={submit} className="glass space-y-3 rounded-lg p-4">
        <label className="block text-xs text-ink-muted">
          Link sau ID YouTube
          <input
            className="admin-input mt-1 font-mono"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… sau ID-ul de 11 caractere"
            autoComplete="off"
          />
        </label>
        <label className="block text-xs text-ink-muted">
          Categorie
          <select
            className="admin-input mt-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">— alege categoria —</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="text-right">
          <button
            type="submit"
            disabled={loading}
            className="btn-neon btn-neon-cyan !px-4 !py-2 text-[10px] disabled:opacity-60"
          >
            {loading ? 'Se adaugă…' : 'Adaugă videoclipul →'}
          </button>
        </div>
      </form>

      {result ? (
        <p
          className={`rounded-md border p-3 text-sm ${
            result.ok
              ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
              : 'border-neon-pink/40 bg-neon-pink/10 text-neon-pink'
          }`}
          role="status"
        >
          {result.message}
          {result.ok && result.videoId ? (
            <a href={`/video/${result.videoId}`} className="ml-2 underline underline-offset-2">
              Vezi pagina →
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
