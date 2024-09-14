import React, { useState } from 'react';
import NavBar from '../NavBar';
import MovieModal from '../MovieModal';
import Modal from 'react-modal';
import '../css/MoviesList.css';
import useFetchItems from '../hooks/useFetchItems';

const MoviesList = () => {
    const {
        items: movies,
        selectedItem: selectedMovie,
        isModalOpen,
        searchQuery,
        setSearchQuery,
        hasMore,
        loading,
        handleItemClick,
        closeModal,
    } = useFetchItems('movie');

    const handleMovieSelect = (movie) => {
        handleItemClick(movie);
    };

    return (
        <div>
            <NavBar isModalOpen={isModalOpen} onSearch={setSearchQuery} />
            <div className={"movie-title"}><h2>Movies</h2></div>
            <div className="movies-container">
                {movies.map((movie) => (
                    <div
                        className="movie-card"
                        key={movie.id}
                        onClick={() => handleMovieSelect(movie)}
                    >
                        <div className="movie-poster">
                            <img
                                src={movie.poster}
                                alt={movie.title}
                            />
                        </div>
                        <div className="movie-details">
                            <h2>{movie.title}</h2>
                            <p>Rating: {movie.vote_average || 'N/A'}</p>
                        </div>
                    </div>
                ))}

                {hasMore && <div className="loader">Loading more movies...</div>}

                <Modal
                    isOpen={isModalOpen}
                    onRequestClose={closeModal}
                    contentLabel="Movie Details"
                >
                    <button onClick={closeModal}>Close</button>

                    {selectedMovie && <MovieModal movie={selectedMovie} onMovieSelect={handleMovieSelect} />}
                </Modal>
            </div>

            {loading && <div>Loading...</div>}
        </div>
    );
};

export default MoviesList;