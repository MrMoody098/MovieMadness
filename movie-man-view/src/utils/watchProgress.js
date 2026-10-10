import { readStored, writeStored } from './mediaLibrary';
const WATCH_PROGRESS_KEY = 'tvWatchProgress';

function validProgress(value, tv = false) {
    if (!value || typeof value !== 'object' || !Number.isFinite(value.watchTime)
        || !Number.isFinite(value.totalDuration) || value.watchTime < 0 || value.totalDuration < 0 || (value.totalDuration === 0 && value.watchTime !== 0)) return null;
    if (tv && (!Number.isInteger(value.lastWatchedSeason) || value.lastWatchedSeason < 1
        || !Number.isInteger(value.lastWatchedEpisode) || value.lastWatchedEpisode < 1)) return null;
    let progressPercentage = 0;
    if (value.totalDuration > 0) progressPercentage = Math.min(100, value.watchTime / value.totalDuration * 100);
    if (value.status === 'watched') progressPercentage = 100;
    return { ...value, watchTime: Math.min(value.watchTime, value.totalDuration), progressPercentage };
}

export const getWatchProgress = () => {
    const stored = readStored(WATCH_PROGRESS_KEY, {});
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
};
export const getShowProgress = id => validProgress(getWatchProgress()[id], true);
export const getMovieProgress = id => validProgress(readStored(`movieProgress_${id}`, null));
export function saveWatchProgress(showId, season, episode, watchTime, totalDuration, status = 'watching') {
    const value = validProgress({ lastWatchedSeason: season, lastWatchedEpisode: episode,
        watchTime, totalDuration, status, lastWatchedDate: new Date().toISOString() }, true);
    return value ? writeStored(WATCH_PROGRESS_KEY, { ...getWatchProgress(), [showId]: value }) : false;
}
export function saveMovieProgress(movieId, watchTime, totalDuration, status = 'watching') {
    const value = validProgress({ movieId, watchTime, totalDuration, status, lastWatchedDate: new Date().toISOString() });
    return value ? writeStored(`movieProgress_${movieId}`, value) : false;
}
export const getRecentlyWatchedWithProgress = () => Object.entries(getWatchProgress())
    .filter(([, value]) => validProgress(value, true))
    .map(([showId, data]) => ({ showId: Number(showId), ...validProgress(data, true) }))
    .sort((a, b) => new Date(b.lastWatchedDate) - new Date(a.lastWatchedDate));
export function clearShowProgress(showId) {
    const progress = getWatchProgress();
    delete progress[showId];
    writeStored(WATCH_PROGRESS_KEY, progress);
}
export const formatWatchTime = seconds => {
    const time = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const secs = time % 60;
    return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${minutes}:${String(secs).padStart(2, '0')}`;
};
export const formatDuration = seconds => {
    const minutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60);
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
};
