'use client';

import { useCallback, useEffect, useState } from 'react';

interface AdminVideo {
  id: number;
  youtube_id: string;
  title: string;
  thumbnail_url: string | null;
  channel_title: string | null;
  views: number;
  published_at: string | null;
  is_featured: number;
  is_active: number;
  category_name: string | null;
}

/**
 * Panou admin: lista videoclipurilor (ultimele 200) cu cautare
 * si stergere unul cate unul.
 */
export default function AdminVideosPanel({ token }: { token: string }) {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/videos', {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la incarcare');
      setVideos(data.videos ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare la incarcare');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (video: AdminVideo) => {
    if (!window.confirm(`Ștergi videoclipul „${video.title}"?`)) return;
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: video.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Eroare la ștergere');
      setNotice('Videoclip șters ✓');
      window.setTimeout(() => setNotice(''), 2500);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare la ștergere');
    }
  };

  const visible = videos.filter((v) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      v.title.toLowerCase().includes(q) ||
      (v.channel_title ?? '').toLowerCase().includes(q) ||
      (v.category_name ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md border border-neon-pink/40 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-md border border-neon-cyan/40 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{notice}</p>
      ) : null}

      <input
        className="admin-input"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrează după titlu, canal sau categorie…"
      />

      {loading ? (
        <p className="text-sm text-ink-faint">Se încarcă…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 font-orbitron text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                <th className="px-2 py-2">Video</th>
                <th className="px-2 py-2">Categorie</th>
                <th className="px-2 py-2">Vizualizări</th>
                <th className="px-2 py-2">Data</th>
                <th className="px-2 py-2 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((v) => (
                <tr key={v.id} className="border-b border-white/5">
                  <td className="px-2 py-2">
                    <a href={`/video/${v.youtube_id}`} className="flex items-center gap-3 text-ink hover:text-neon-cyan">
                      <img
                        src={v.thumbnail_url ?? `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        width={80}
                        height={45}
                        className="h-9 w-16 shrink-0 rounded object-cover"
                      />
                      <span className="min-w-0">
                        <span className="line-clamp-1 block">{v.title}</span>
                        <span className="block text-xs text-ink-faint">{v.channel_title ?? 'YouTube'}</span>
                      </span>
                    </a>
                  </td>
                  <td className="px-2 py-2 text-ink-muted">{v.category_name ?? '—'}</td>
                  <td className="px-2 py-2 text-ink-faint">{v.views.toLocaleString('ro-RO')}</td>
                  <td className="px-2 py-2 text-ink-faint">
                    {v.published_at ? new Date(v.published_at).toLocaleDateString('ro-RO') : '—'}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => remove(v)}
                      className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-neon-pink hover:underline"
                    >
                      Șterge
                    </button>
                  </td>
                </tr>
              ))}
              {!visible.length ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-ink-faint">
                    Niciun videoclip.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
