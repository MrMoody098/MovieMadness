import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import NavBar from "../NavBar";
import TvModal from "../modals/TvModal";
import "../css/MoviesList.css";
import useFetchItems from '../hooks/useFetchItems';
import { addTvShowId, getTvShowIds } from '../utils/recentlyWatchedTv';

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const TVShowsList = () => {
    const {
        items: tvShows,
        selectedItem: selectedTVShow,
        isModalOpen,
        searchQuery,
        setSearchQuery,
        hasMore,
        loading,
        handleItemClick,
        closeModal,
    } = useFetchItems('tv');

    const [recentlyWatchedTv, setRecentlyWatchedTv] = useState([]);
    const carouselTvRef = useRef(null);

    const fetchRecentlyWatchedTvShows = async () => {
        const tvShowIds = getTvShowIds();
        const tvShowDetailsPromises = tvShowIds.map(id =>
            axios.get(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`)
        );
        const tvShowDetails = await Promise.all(tvShowDetailsPromises);
        setRecentlyWatchedTv(tvShowDetails.map(response => response.data));
    };

    useEffect(() => {
        fetchRecentlyWatchedTvShows();
    }, []);

    const handleTvShowSelect = (tvShow) => {
        addTvShowId(tvShow.id);
        handleItemClick(tvShow);
        fetchRecentlyWatchedTvShows(); // Update recently watched TV shows
    };

    const handleDeleteTvShow = (tvShowId) => {
        let tvShowIds = getTvShowIds();
        tvShowIds = tvShowIds.filter(id => id !== tvShowId);
        localStorage.setItem('recentlyWatchedTv', JSON.stringify(tvShowIds));
        fetchRecentlyWatchedTvShows(); // Update recently watched TV shows
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>&#9733;</span>
            );
        }
        return stars;
    };

    return (
        <div>
            <NavBar isModalOpen={isModalOpen} onSearch={setSearchQuery} />
            <div className="recently-watched">
                <h2>Recently Watched TV Shows</h2>
                <div className="carousel" ref={carouselTvRef}>
                    {recentlyWatchedTv.map((tvShow) => (
                        <div className="movie-card" key={tvShow.id}>
                            <button className="delete-button" onClick={() => handleDeleteTvShow(tvShow.id)}>X</button>
                            <div className="movie-poster" onClick={() => handleTvShowSelect(tvShow)}>
                                <img src={`https://image.tmdb.org/t/p/w500/${tvShow.poster_path}`} alt={tvShow.name} />
                            </div>
                            <div className="movie-details">
                                <div className="movie-title"><h2>{tvShow.name}</h2></div>
                                <div className="movie-rating">
                                    <p>Rating: {tvShow.vote_average ? tvShow.vote_average.toFixed(1) : 'N/A'}</p>
                                    <div className="star-rating">
                                        {renderStars(Math.round(tvShow.vote_average / 2))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="movie-title"><h2>TV Shows</h2></div>
            <div className="movies-container">
                {tvShows.map((tvShow) => (
                    <div className="movie-card" key={tvShow.id} onClick={() => handleTvShowSelect(tvShow)}>
                        <div className="movie-poster">
                            <img src={tvShow.poster} alt={tvShow.name} />
                        </div>
                        <div className="movie-details">
                            <div className="movie-title"><h2>{tvShow.name}</h2></div>
                            <div className="movie-rating">
                                <p>Rating: {tvShow.vote_average ? tvShow.vote_average.toFixed(1) : 'N/A'}</p>
                                <div className="star-rating">
                                    {renderStars(Math.round(tvShow.vote_average / 2))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <TvModal
                    isOpen={isModalOpen}
                    onRequestClose={closeModal}
                    tvShow={selectedTVShow}
                    onTvShowSelect={handleTvShowSelect} // Pass handleTvShowSelect as onTvShowSelect
                />
            </div>

            {loading && <div>Loading...</div>}
        </div>
    );
};

export default TVShowsList;

