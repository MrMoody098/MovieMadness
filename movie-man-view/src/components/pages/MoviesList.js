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
    const carouselRef = useRef(null);

    const fetchRecentlyWatchedMovies = async () => {
        const movieIds = getMovieIds();
        const movieDetailsPromises = movieIds.map(id =>
            axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`)
        );
        const movieDetails = await Promise.all(movieDetailsPromises);
        setRecentlyWatched(movieDetails.map(response => response.data));
    };

    useEffect(() => {
        fetchRecentlyWatchedMovies();
    }, []);

    const handleMovieSelect = (movie) => {
        addMovieId(movie.id);
        handleItemClick(movie);
        fetchRecentlyWatchedMovies(); // Update recently watched movies
    };

    const handleDeleteMovie = (movieId) => {
        let movieIds = getMovieIds();
        movieIds = movieIds.filter(id => id !== movieId);
        localStorage.setItem('recentlyWatched', JSON.stringify(movieIds));
        fetchRecentlyWatchedMovies(); // Update recently watched movies
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
            <NavBar isModalOpen={isModalOpen} onSearch={setSearchQuery}/>
            <div className="recently-watched">
                <h2>Recently Watched</h2>
                <div className="carousel" ref={carouselRef}>
                    {recentlyWatched.map((movie) => (
                        <div className="movie-card" key={movie.id}>
                            <button className="delete-button" onClick={() => handleDeleteMovie(movie.id)}>X</button>
                            <div className="movie-poster" onClick={() => handleMovieSelect(movie)}>
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
            <div className="movie-title"><h2>Movies</h2></div>
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
