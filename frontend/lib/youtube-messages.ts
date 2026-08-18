// ============================================================
// CARO.TV v43prov2 – mesaje catre player-ul YouTube (iframe API)
// Folosit DOAR din client. Permite: seek la capitole, citirea
// timpului curent (progres vizionare) fara niciun cost de API.
// ============================================================

export interface PlayerState {
  currentTime: number;
  duration: number;
  playerState: number; // -1 unstarted, 1 playing, 2 paused
}

/** Trimite o comanda catre iframe-ul YouTube (postMessage). */
export function commandPlayer(
  iframe: HTMLIFrameElement | null,
  func: string,
  args: unknown[] = [],
): void {
  if (!iframe || !iframe.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      'https://www.youtube-nocookie.com',
    );
  } catch {
    /* ignore */
  }
}

/** Activeaza raportarea de stare; cb primeste starea curenta a player-ului. */
export function listenPlayer(
  iframe: HTMLIFrameElement | null,
  cb: (state: PlayerState) => void,
): () => void {
  if (!iframe || !iframe.contentWindow) return () => {};

  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'listening', id: 'caro-player' }),
      'https://www.youtube-nocookie.com',
    );
  } catch {
    /* ignore */
  }

  const onMessage = (e: MessageEvent) => {
    if (e.origin !== 'https://www.youtube-nocookie.com') return;
    try {
      const data = JSON.parse(String(e.data));
      const info = data?.info;
      if (info && typeof info.currentTime === 'number' && typeof info.duration === 'number') {
        cb({
          currentTime: info.currentTime,
          duration: info.duration,
          playerState: Number(info.playerState ?? -1),
        });
      }
    } catch {
      /* mesaj ne-JSON – ignoram */
    }
  };

  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}
