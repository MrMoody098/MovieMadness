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
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState([]);
    const [animateCard, setAnimateCard] = useState(null);
    const carouselTvRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

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
        if (deleteMode) {
            setAnimateCard(tvShow.id);
            setTimeout(() => setAnimateCard(null), 500); // Reset animation after 500ms
            setSelectedForDeletion(prev =>
                prev.includes(tvShow.id) ? prev.filter(id => id !== tvShow.id) : [...prev, tvShow.id]
            );
        } else {
            addTvShowId(tvShow.id);
            handleItemClick(tvShow);
            fetchRecentlyWatchedTvShows(); // Update recently watched TV shows
        }
    };

    const handleDeleteSelected = () => {
        let tvShowIds = getTvShowIds();
        tvShowIds = tvShowIds.filter(id => !selectedForDeletion.includes(id));
        localStorage.setItem('recentlyWatchedTv', JSON.stringify(tvShowIds));
        setSelectedForDeletion([]);
        setDeleteMode(false);
        fetchRecentlyWatchedTvShows(); // Update recently watched TV shows
    };

    const handleCancelDeleteMode = () => {
        setSelectedForDeletion([]);
        setDeleteMode(false);
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

    const startDrag = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - carouselTvRef.current.offsetLeft);
        setScrollLeft(carouselTvRef.current.scrollLeft);
    };

    const onDrag = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - carouselTvRef.current.offsetLeft;
        const walk = (x - startX) * 4; //scroll speed multiplier
        carouselTvRef.current.scrollLeft = scrollLeft - walk;
    };

    const endDrag = () => {
        setIsDragging(false);
    };

    return (
        <div>
            <NavBar isModalOpen={isModalOpen} onSearch={setSearchQuery} />
            <div className="recently-watched">
                <h2>Recently Watched TV Shows</h2>
                <button className="delete-mode-button" onClick={() => setDeleteMode(!deleteMode)}>
                    {deleteMode ? 'Cancel' : 'Delete TV Shows'}
                </button>
                {deleteMode && (
                    <button className="confirm-delete-button" onClick={handleDeleteSelected}>
                        Confirm Delete
                    </button>
                )}
                <div
                    className="carousel"
                    ref={carouselTvRef}
                    onMouseDown={startDrag}
                    onMouseMove={onDrag}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                >
                    {recentlyWatchedTv.map((tvShow) => (
                        <div
                            className={`movie-card ${deleteMode ? 'delete-mode' : ''} ${selectedForDeletion.includes(tvShow.id) ? 'selected' : ''} ${animateCard === tvShow.id ? 'animate' : ''}`}
                            key={tvShow.id}
                            onClick={() => handleTvShowSelect(tvShow)}
                        >
                            <div className="movie-poster">
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