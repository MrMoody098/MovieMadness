export const LIBRARY_EVENT = 'media-library-change';
export const STORAGE_ERROR_EVENT = 'media-storage-error';

const reportedReadErrors = new Set();

export function readStored(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        if (!reportedReadErrors.has(key)) {
            reportedReadErrors.add(key);
            queueMicrotask(() => window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, {
                detail: 'Saved viewing data could not be read. You can still browse and watch titles.'
            })));
        }
        return fallback;
    }
}

export function writeStored(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new Event(LIBRARY_EVENT));
        return true;
    } catch (error) {
        window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, {
            detail: 'Your browser could not save this change. Check that site storage is enabled and has space.'
        }));
        return false;
    }
}

const historyKey = type => type === 'tv' ? 'recentlyWatchedTv' : 'recentlyWatched';

export function getHistoryIds(type) {
    const ids = readStored(historyKey(type), []);
    return Array.isArray(ids) ? [...new Set(ids.filter(id => Number.isInteger(id) && id > 0))] : [];
}

export function recordPlayback(type, id) {
    if (!Number.isInteger(id) || id <= 0) return;
    const ids = getHistoryIds(type);
    writeStored(historyKey(type), [id, ...ids.filter(value => value !== id)]);
    const stored = readStored('viewingDates', {});
    const dates = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    writeStored('viewingDates', { ...dates, [`${type}:${id}`]: new Date().toISOString() });
}

export function removeHistory(type, ids) {
    writeStored(historyKey(type), getHistoryIds(type).filter(id => !ids.includes(id)));
}

export function getWatchlist() {
    const items = readStored('watchlist', []);
    return Array.isArray(items) ? items.filter(item => item && ['movie', 'tv'].includes(item.media_type)
        && Number.isInteger(item.id) && item.id > 0 && typeof (item.title || item.name) === 'string') : [];
}

export function toggleWatchlist(item, type) {
    const items = getWatchlist();
    const exists = items.some(saved => saved.id === item.id && saved.media_type === type);
    const next = exists ? items.filter(saved => !(saved.id === item.id && saved.media_type === type)) : [
        { id: item.id, media_type: type, title: item.title, name: item.name,
            poster_path: item.poster_path, vote_average: item.vote_average, overview: item.overview }, ...items
    ];
    return writeStored('watchlist', next);
}
