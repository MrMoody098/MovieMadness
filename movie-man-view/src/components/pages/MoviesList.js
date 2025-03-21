import React, { useState, useEffect, useRef } from 'react';
import NavBar from '../NavBar';
import MovieModal from '../modals/MovieModal';
import Modal from 'react-modal';
import '../css/MoviesList.css';
import useFetchItems from '../hooks/useFetchItems';
import { addMovieId, getMovieIds } from '../utils/recentlyWatched';
import axios from 'axios';

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const MoviesList = () => {
    const {
        items: movies,
        selectedItem: selectedMovie,
        isModalOpen,
        setSearchQuery,
        loading,
        handleItemClick,
        closeModal,
    } = useFetchItems('movie');

    const [recentlyWatched, setRecentlyWatched] = useState([]);
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState([]);
    const [animateCard, setAnimateCard] = useState(null);
    const carouselRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const fetchRecentlyWatchedMovies = async () => {
        const movieIds = getMovieIds();
        const movieDetailsPromises = movieIds.map(id =>
            axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`)
        );
        const movieDetails = await Promise.all(movieDetailsPromises);
        setRecentlyWatched(movieDetails.map(response => response.data));

        // Fetch recommendations based on recently watched movies
        try {
            const response = await axios.post('http://localhost:8000/recommend', {
                watched_movie_indices: movieIds,
                top_k: 10
            });
            const recommendedIds = response.data.recommended_movie_ids;
            const recommendedDetails = await Promise.all(
                recommendedIds.map(async (id) => {
                    const { data } = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
                    return data;
                })
            );
            setRecommendedMovies(recommendedDetails);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        }
    };

    useEffect(() => {
        fetchRecentlyWatchedMovies();
    }, []);

    const handleMovieSelect = (movie) => {
        if (deleteMode) {
            setAnimateCard(movie.id);
            setTimeout(() => setAnimateCard(null), 500); // Reset animation after 500ms
            setSelectedForDeletion(prev =>
                prev.includes(movie.id) ? prev.filter(id => id !== movie.id) : [...prev, movie.id]
            );
        } else {
            addMovieId(movie.id);
            handleItemClick(movie);
            fetchRecentlyWatchedMovies(); // Update recently watched movies and recommendations
        }
    };

    const handleDeleteSelected = () => {
        let movieIds = getMovieIds();
        movieIds = movieIds.filter(id => !selectedForDeletion.includes(id));
        localStorage.setItem('recentlyWatched', JSON.stringify(movieIds));
        setSelectedForDeletion([]);
        setDeleteMode(false);
        fetchRecentlyWatchedMovies(); // Update recently watched movies and recommendations
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
        setStartX(e.pageX - carouselRef.current.offsetLeft);
        setScrollLeft(carouselRef.current.scrollLeft);
    };

    const onDrag = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - carouselRef.current.offsetLeft;
        const walk = (x - startX) * 3; //scroll speed multiplier
        carouselRef.current.scrollLeft = scrollLeft - walk;
    };

    const endDrag = () => {
        setIsDragging(false);
    };

    const selectAll = () => {
        recentlyWatched.map(movie=> setSelectedForDeletion(prev => [...prev, movie.id]));
    };

    return (
        <div>
            <NavBar isModalOpen={isModalOpen} onSearch={setSearchQuery}/>
            {recentlyWatched.length > 0 && (
                <div className="recently-watched">
                    <h2>Recently Watched</h2>
                    <button className="delete-mode-button" onClick={() => setDeleteMode(!deleteMode)}>
                        {deleteMode ? 'Cancel' : 'Delete Movies'}
                    </button>
                    {deleteMode && (<>
                        <button className="confirm-delete-button" onClick={handleDeleteSelected}>
                            Confirm Delete
                        </button>
                        <button className="select-all-button" onClick={selectAll}>
                            Select All
                        </button>
                    </>
                    )}
                    <div
                        className="carousel"
                        ref={carouselRef}
                        onMouseDown={startDrag}
                        onMouseMove={onDrag}
                        onMouseUp={endDrag}
                        onMouseLeave={endDrag}
                    >
                        {recentlyWatched.map((movie) => (
                            <div
                                className={`movie-card ${deleteMode ? 'delete-mode' : ''} ${selectedForDeletion.includes(movie.id) ? 'selected' : ''} ${animateCard === movie.id ? 'animate' : ''}`}
                                key={movie.id}
                                onClick={() => handleMovieSelect(movie)}
                            >
                                <div className="movie-poster">
                                    <img src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`} alt={movie.title}/>
                                </div>
                                <div className="movie-details">
                                    <div className="movie-title"><h2>{movie.title}</h2></div>
                                    <div className="movie-rating">
                                        <p>Rating: {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                                        <div className="star-rating">
                                            {renderStars(Math.round(movie.vote_average / 2))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {recommendedMovies.length > 0 && (
                <div className="recently-watched">
                    <h2>Recommended Movies</h2>
                    <div className="carousel">
                        {recommendedMovies.map((movie) => (
                            <div className="movie-card" key={movie.id} onClick={() => handleMovieSelect(movie)}>
                                <div className="movie-poster">
                                    <img src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`} alt={movie.title}/>
                                </div>
                                <div className="movie-details">
                                    <div className="movie-title"><h2>{movie.title}</h2></div>
                                    <div className="movie-rating">
                                        <p>Rating: {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                                        <div className="star-rating">
                                            {renderStars(Math.round(movie.vote_average / 2))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="movie-title"><h2>Trending Movies</h2></div>
            <div className="movies-container">
                {movies.map((movie) => (
                    <div className="movie-card" key={movie.id} onClick={() => handleMovieSelect(movie)}>
                        <div className="movie-poster">
                            <img src={movie.poster} alt={movie.title}/>
                        </div>
                        <div className="movie-details">
                            <div className="movie-title"><h2>{movie.title}</h2></div>
                            <div className="movie-rating">
                                <p>Rating: {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                                <div className="star-rating">
                                    {renderStars(Math.round(movie.vote_average / 2))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && <div className="loader">Loading more movies...</div>}

                <Modal isOpen={isModalOpen} onRequestClose={closeModal} contentLabel="Movie Details">
                    <button onClick={closeModal}>Close</button>
                    {selectedMovie && <MovieModal movie={selectedMovie} onMovieSelect={handleMovieSelect}/>}
                </Modal>
            </div>

            {loading && <div>Loading...</div>}
        </div>
    );
};

export default MoviesList;