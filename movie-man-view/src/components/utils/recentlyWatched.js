const addMovieId = (movieId) => {
    let movieIds = JSON.parse(localStorage.getItem('recentlyWatched')) || [];
    if (!movieIds.includes(movieId)) {
        movieIds.push(movieId);
        localStorage.setItem('recentlyWatched', JSON.stringify(movieIds));
    }
};

const getMovieIds = () => {
    return JSON.parse(localStorage.getItem('recentlyWatched')) || [];
};

export { addMovieId, getMovieIds };
