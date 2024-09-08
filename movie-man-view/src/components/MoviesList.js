import React, { useState, useEffect, useRef } from 'react';
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
  const [page, setPage] = useState(1); // Track the current page
  const [hasMore, setHasMore] = useState(true); // Track if there are more pages
  const loaderRef = useRef(null); // Reference to the loader div at the bottom

  // Fetch movies
  const fetchMovies = async (page, query = '') => {
    try {
      let url;
      if (query) {
        url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}&include_adult=false&language=en-US&page=${page}`;
      } else {
        url = `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}&page=${page}`;
      }

      const { data } = await axios.get(url);

      // Append the new movies to the current list
      setMovies((prevMovies) => [...prevMovies, ...data.results]);

      // Check if there are more movies to load
      if (data.page >= data.total_pages) {
        setHasMore(false); // No more pages to load
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  // Fetch initial movies on mount
  useEffect(() => {
    fetchMovies(page, searchQuery);
  }, [page, searchQuery]);

  // Fetch new movies when searchQuery changes
  useEffect(() => {
    setMovies([]); // Clear the movie list on a new search
    setPage(1); // Reset to page 1
    setHasMore(true); // Reset hasMore flag
    fetchMovies(1, searchQuery); // Fetch the first page of search results
  }, [searchQuery]);

  // Intersection Observer to detect when the user reaches the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prevPage) => prevPage + 1); // Increment the page number
          }
        },
        { threshold: 1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore]);

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
        <div className={"movie-title"}><h2 className={"movie-title"}>Movies</h2></div>
        <div className="movies-container">
          {movies.map((movie) => (
              <div
                  className="movie-card"
                  key={movie.id}
                  onClick={() => handleMovieClick(movie)}
              >
                {/* Movie poster */}
                <div className="movie-poster">
                  <img
                      src={movie.poster_path
                          ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                          : 'default-poster.jpg'}
                      alt={movie.title}
                  />
                </div>

                {/* Movie details */}
                <div className="movie-details">
                  <h2>{movie.title}</h2>
                  <p>Rating: {movie.vote_average || 'N/A'}</p>
                </div>
              </div>
          ))}

          {/* Loader div for infinite scroll */}
          {hasMore && <div ref={loaderRef} className="loader">Loading more movies...</div>}

          {/* Modal for movie details */}
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
