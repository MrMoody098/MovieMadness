import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NavBar from "../NavBar";
import { getMovieIds, addMovieId } from '../utils/recentlyWatched';
import { getTvShowIds, addTvShowId } from '../utils/recentlyWatchedTv';
import '../css/MoviesList.css';

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const ExploreAll = () => {
    const [recentlyWatched, setRecentlyWatched] = useState([]);

    const fetchRecentlyWatched = async () => {
        const movieIds = getMovieIds();
        const tvShowIds = getTvShowIds();

        const movieDetailsPromises = movieIds.map(id =>
            axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`)
        );
        const tvShowDetailsPromises = tvShowIds.map(id =>
            axios.get(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`)
        );

        const movieDetails = await Promise.all(movieDetailsPromises);
        const tvShowDetails = await Promise.all(tvShowDetailsPromises);

        const combinedDetails = [
            ...movieDetails.map(response => ({ ...response.data, type: 'movie' })),
            ...tvShowDetails.map(response => ({ ...response.data, type: 'tv' }))
        ];

        setRecentlyWatched(combinedDetails);
    };

    useEffect(() => {
        fetchRecentlyWatched();
    }, []);

    const handleDelete = (id, type) => {
        if (type === 'movie') {
            let movieIds = getMovieIds();
            movieIds = movieIds.filter(movieId => movieId !== id);
            localStorage.setItem('recentlyWatched', JSON.stringify(movieIds));
        } else {
            let tvShowIds = getTvShowIds();
            tvShowIds = tvShowIds.filter(tvShowId => tvShowId !== id);
            localStorage.setItem('recentlyWatchedTv', JSON.stringify(tvShowIds));
        }
        fetchRecentlyWatched();
    };

    return (
        <div>
            <NavBar />
            <div className="recently-watched">
                <h2>All Recently Watched</h2>
                <div className="movies-container">
                    {recentlyWatched.map((item) => (
                        <div className="movie-card" key={item.id}>
                            <button className="delete-button" onClick={() => handleDelete(item.id, item.type)}>X</button>
                            <div className="movie-poster">
                                <img src={`https://image.tmdb.org/t/p/w500/${item.poster_path}`} alt={item.title || item.name} />
                            </div>
                            <div className="movie-details">
                                <h2>{item.title || item.name}</h2>
                                <p>Rating: {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExploreAll;