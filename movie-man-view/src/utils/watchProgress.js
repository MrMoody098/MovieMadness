// Watch progress tracking utilities
const WATCH_PROGRESS_KEY = 'tvWatchProgress';

// Get all watch progress data
export const getWatchProgress = () => {
    try {
        const progress = localStorage.getItem(WATCH_PROGRESS_KEY);
        return progress ? JSON.parse(progress) : {};
    } catch (error) {
        console.error('Error loading watch progress:', error);
        return {};
    }
};

// Save watch progress for a specific show
export const saveWatchProgress = (showId, season, episode, watchTime, totalDuration) => {
    try {
        const progress = getWatchProgress();
        progress[showId] = {
            lastWatchedSeason: season,
            lastWatchedEpisode: episode,
            watchTime: watchTime,
            totalDuration: totalDuration,
            lastWatchedDate: new Date().toISOString(),
            progressPercentage: totalDuration > 0 ? (watchTime / totalDuration) * 100 : 0
        };
        localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error('Error saving watch progress:', error);
    }
};

// Get watch progress for a specific show
export const getShowProgress = (showId) => {
    const progress = getWatchProgress();
    return progress[showId] || null;
};

// Get all recently watched shows with progress
export const getRecentlyWatchedWithProgress = () => {
    const progress = getWatchProgress();
    return Object.entries(progress)
        .sort((a, b) => new Date(b[1].lastWatchedDate) - new Date(a[1].lastWatchedDate))
        .map(([showId, data]) => ({
            showId: parseInt(showId),
            ...data
        }));
};

// Clear watch progress for a specific show
export const clearShowProgress = (showId) => {
    try {
        const progress = getWatchProgress();
        delete progress[showId];
        localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error('Error clearing watch progress:', error);
    }
};

// Format watch time for display
export const formatWatchTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
};

// Format total duration for display
export const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
};
