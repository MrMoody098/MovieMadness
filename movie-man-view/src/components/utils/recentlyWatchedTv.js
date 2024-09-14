const addTvShowId = (tvShowId) => {
    let tvShowIds = JSON.parse(localStorage.getItem('recentlyWatchedTv')) || [];
    if (!tvShowIds.includes(tvShowId)) {
        tvShowIds.push(tvShowId);
        localStorage.setItem('recentlyWatchedTv', JSON.stringify(tvShowIds));
    }
};

const getTvShowIds = () => {
    return JSON.parse(localStorage.getItem('recentlyWatchedTv')) || [];
};

export { addTvShowId, getTvShowIds };
