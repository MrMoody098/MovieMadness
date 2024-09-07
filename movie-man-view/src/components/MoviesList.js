import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MoviesList.css';
import MovieDetails from './MovieDetails';
import Modal from 'react-modal';
import NavBar from './NavBar';

const TMDB_API_KEY = 'f58bf4f31de2a8346b5841b863457b1f'; // Your API key

const MoviesList = () => {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMovies = async (query = '') => {
    try {
      let url;
      if (query) {
        url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}&include_adult=false&language=en-US&page=1`;
      } else {
        url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`;
      }

      const { data } = await axios.get(url);

      // Modify the movie data to include poster URL from TMDb
      const modifiedMovies = data.results.map((movie) => ({
        ...movie,
        poster: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
            : 'default-poster.jpg' // Placeholder for missing poster
      }));

      setMovies(modifiedMovies);
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  useEffect(() => {
    fetchMovies(); // Fetch trending movies when the component mounts
  }, []);

  useEffect(() => {
    if (searchQuery) {
      fetchMovies(searchQuery); // Fetch movies based on the search query
    }
  }, [searchQuery]);

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
      <div>
        <NavBar isModalOpen={isModalOpen} onSearch={handleSearch} />
        <div className="movies-container">
          {movies.map((movie) => (
              <div
                  className="movie-card"
                  key={movie.id}
                  onClick={() => handleMovieClick(movie)}
              >
                {/* Movie poster */}
                <div className="movie-poster">
                  <img src={movie.poster} alt={movie.title} />
                </div>

                {/* Movie details */}
                <div className="movie-details">
                  <h2>{movie.title}</h2>
                  <p>Rating: {movie.vote_average || 'N/A'}</p>
                </div>
              </div>
          ))}

          <Modal
              isOpen={isModalOpen}
              onRequestClose={closeModal}
              contentLabel="Movie Details"
          >
            {selectedMovie && <MovieDetails movie={selectedMovie} />}
            <button onClick={closeModal}>Close</button>
          </Modal>
        </div>
      </div>
  );
};

export default MoviesList;
