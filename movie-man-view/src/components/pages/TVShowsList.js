import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import NavBar from "../NavBar";
import TvModal from "../TvModal";
import "../css/TVShows.css";
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

    useEffect(() => {
        const carouselTv = carouselTvRef.current;
        const handleScroll = (event) => {
            if (event.deltaY !== 0) {
                event.preventDefault();
                carouselTv.scrollLeft += event.deltaY;
            }
        };
        carouselTv.addEventListener('wheel', handleScroll);
        return () => {
            carouselTv.removeEventListener('wheel', handleScroll);
        };
    }, []);

    return (
        <div>
            <NavBar isModalOpen={isModalOpen} onSearch={setSearchQuery} />
            <div className="recently-watched-tv">
                <h2>Recently Watched TV Shows</h2>
                <div className="carousel-tv" ref={carouselTvRef}>
                    {recentlyWatchedTv.map((tvShow) => (
                        <div className="movie-card" key={tvShow.id}>
                            <button className="delete-button" onClick={() => handleDeleteTvShow(tvShow.id)}>X</button>
                            <div className="movie-poster" onClick={() => handleTvShowSelect(tvShow)}>
                                <img src={`https://image.tmdb.org/t/p/w500/${tvShow.poster_path}`} alt={tvShow.name} />
                            </div>
                            <div className="movie-details">
                                <h2>{tvShow.name}</h2>
                                <p>Rating: {tvShow.vote_average || 'N/A'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="tv-title"><h2>TV Shows</h2></div>
            <div className="movies-container">
                {tvShows.map((tvShow) => (
                    <div className="movie-card" key={tvShow.id} onClick={() => handleTvShowSelect(tvShow)}>
                        <div className="movie-poster">
                            <img src={tvShow.poster} alt={tvShow.name} />
                        </div>
                        <div className="movie-details">
                            <h2>{tvShow.name}</h2>
                            <p>Rating: {tvShow.vote_average || 'N/A'}</p>
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