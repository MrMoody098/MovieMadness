import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import "../Filter.css";
import NavBar from "../NavBar";

const TMDB_API_KEY = 'f58bf4f31de2a8346b5841b863457b1f'; // Your API key

const Filter = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1); // Track the current page
    const [hasMore, setHasMore] = useState(true); // Track if there are more pages
    const loaderRef = useRef(null); // Reference to the loader div at the bottom

    useEffect(() => {
        // Fetch genres when the component mounts
        const fetchGenres = async () => {
            try {
                const { data } = await axios.get(
                    `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`
                );
                setGenres(data.genres);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };

        fetchGenres();
    }, []);

    const fetchMoviesByGenre = async (genreId, page) => {
        try {
            const { data } = await axios.get(
                `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}`
            );

            setMovies((prevMovies) => [...prevMovies, ...data.results]);

            if (data.page >= data.total_pages) {
                setHasMore(false); // No more pages to load
            }
        } catch (error) {
            console.error('Error fetching movies by genre:', error);
        }
    };

    useEffect(() => {
        if (selectedGenre) {
            fetchMoviesByGenre(selectedGenre, page);
        }
    }, [page, selectedGenre]);

    const handleGenreChange = (event) => {
        const genreId = event.target.value;
        setSelectedGenre(genreId);
        setMovies([]); // Reset movies when a new genre is selected
        setPage(1); // Reset to the first page
        setHasMore(true); // Reset hasMore flag
        fetchMoviesByGenre(genreId, 1); // Fetch the first page of the new genre
    };

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1); // Load next page when scrolled to bottom
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

    return (
        <div className="filter-container">
            <NavBar />
            <h2>Filter by Genre</h2>
            <select value={selectedGenre} onChange={handleGenreChange}>
                <option value="">All Genres</option>
                {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                        {genre.name}
                    </option>
                ))}
            </select>

            <div className="movies-container">
                {movies.map((movie) => (
                    <div key={movie.id} className="movie-card">
                        <img
                            src={movie.poster_path
                                ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                                : 'default-poster.jpg'}
                            alt={movie.title}
                        />
                        <h3>{movie.title}</h3>
                        <p>Rating: {movie.vote_average || 'N/A'}</p>
                    </div>
                ))}
            </div>

            {/* Loader div for infinite scroll */}
            {hasMore && <div ref={loaderRef} className="loader">Loading more movies...</div>}
        </div>
    );
};

export default Filter;
