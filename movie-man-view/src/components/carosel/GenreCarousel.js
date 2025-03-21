import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../css/MoviesList.css';

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const GenreCarousel = ({ genreId }) => {
    const [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const carouselRef = useRef(null);

    const fetchMovies = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
                params: {
                    api_key: API_KEY,
                    with_genres: genreId,
                    page: page
                }
            });
            setMovies(prevMovies => [...prevMovies, ...response.data.results]);
            setPage(prevPage => prevPage + 1);
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMovies();
    }, [genreId]);

    const handleScroll = () => {
        if (carouselRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = carouselRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 5 && !loading) {
                fetchMovies();
            }
        }
    };

    useEffect(() => {
        const carouselElement = carouselRef.current;
        if (carouselElement) {
            carouselElement.addEventListener('scroll', handleScroll);
            return () => {
                carouselElement.removeEventListener('scroll', handleScroll);
            };
        }
    }, [loading]);

    return (
        <div className="section-carousel" ref={carouselRef}>
            {movies.map((movie) => (
                <div className="movie-card" key={movie.id}>
                    <div className="movie-poster">
                        <img src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`} alt={movie.title} />
                    </div>
                    <div className="movie-details">
                        <h2>{movie.title}</h2>
                        <p>Rating: {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                    </div>
                </div>
            ))}
            {loading && <div className="loader">Loading more movies...</div>}
        </div>
    );
};

export default GenreCarousel;