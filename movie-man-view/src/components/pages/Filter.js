import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../Filter.css";
const TMDB_API_KEY = 'f58bf4f31de2a8346b5841b863457b1f'; // Your API key

const Filter = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [movies, setMovies] = useState([]);

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

    const fetchMoviesByGenre = async (genreId) => {
        try {
            const { data } = await axios.get(
                `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}`
            );
            setMovies(data.results);
        } catch (error) {
            console.error('Error fetching movies by genre:', error);
        }
    };

    const handleGenreChange = (event) => {
        const genreId = event.target.value;
        setSelectedGenre(genreId);
        fetchMoviesByGenre(genreId);
    };

    return (
        <div className="filter-container">
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
        </div>
    );
};

export default Filter;
