export const CHECKED_PLAYER_ORIGIN = 'https://vidsrc.tw';

// Check the actual movie or starting episode, rather than a metadata listing
// or an iframe load event (which also fires for a player's error page).
export async function hasPlayableMedia(item, type, signal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal.aborted) return false;
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 5000);
    try {
        const path = type === 'tv' ? `tv/${item.id}/1/1` : `movie/${item.id}`;
        const response = await fetch(`${CHECKED_PLAYER_ORIGIN}/info/${path}.json`, { signal: controller.signal });
        if (!response.ok) return false;
        const data = await response.json();
        return !controller.signal.aborted && data?.status_code === 200
            && data.type === (type === 'tv' ? 'episode' : 'movie')
            && String(data.tmdb_id) === String(item.id)
            && typeof data.quality === 'string' && Boolean(data.quality.trim())
            && (type !== 'tv' || (data.season === 1 && data.episode === 1));
    } catch (_) {
        return false;
    } finally {
        clearTimeout(timeout);
        signal.removeEventListener('abort', abort);
    }
}
