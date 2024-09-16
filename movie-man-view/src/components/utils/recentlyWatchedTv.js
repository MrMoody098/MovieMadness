const addTvShowId = (tvShowId) => {
    //get local cookie "recentlyWatchedTv" or empty array for new cookie
    let tvShowIds = JSON.parse(localStorage.getItem('recentlyWatchedTv')) || [];
    //if tvShow not already added
    if (!tvShowIds.includes(tvShowId)) {
        tvShowIds.push(tvShowId);
        //set local cookie "recentlyWatchedTv" to updated tvShowIds
        localStorage.setItem('recentlyWatchedTv', JSON.stringify(tvShowIds));
    }
};

const getTvShowIds = () => {
   //return Parsed local cookie JSON content or empty array
    return JSON.parse(localStorage.getItem('recentlyWatchedTv')) || [];
};

export { addTvShowId, getTvShowIds };
