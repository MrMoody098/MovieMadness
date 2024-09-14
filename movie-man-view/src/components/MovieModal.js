import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./css/MoviesList.css";
import "./css/MovieModal.css";

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const MovieModal = ({ movie, onMovieSelect }) => {
    const [recommendedMovies, setRecommendedMovies] = useState([]);

    useEffect(() => {
        const fetchRecommendedMovies = async () => {
            if (movie) {
                try {
                    const { data } = await axios.get(
                        `https://api.themoviedb.org/3/movie/${movie.id}/recommendations?api_key=${API_KEY}`
                    );
                    const filteredMovies = data.results.filter(recMovie => recMovie.vote_count > 200);
                    setRecommendedMovies(filteredMovies);
                } catch (error) {
                    console.error('Error fetching recommended movies:', error);
                }
            }
        };

        fetchRecommendedMovies();
    }, [movie]);

    if (!movie) {
        return <div>Loading...</div>; // Or any other loading indicator
    }

    const movieEmbedUrl = `https://vidsrc.xyz/embed/movie/${movie.id}`;

    return (
        <div className="movie-details-container">
            <div>
                <h2>{movie.title} - Rating {parseFloat(movie.vote_average).toFixed(1) || 'N/A'}</h2>
                <p className="movie-description">{movie.overview}</p>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                    <iframe
                        src={movieEmbedUrl}
                        title="Embedded Movie"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%'
                        }}
                    />
                </div>
            </div>

            <div className="recommended-movies">
                <h3>Recommended Movies</h3>
                <div className="movies-container">
                    {recommendedMovies.map((recMovie) => (
                        <div className="movie-card" key={recMovie.id} onClick={() => onMovieSelect(recMovie)}>
                            <div className="movie-poster">
                                <img
                                    src={recMovie.poster_path ? `https://image.tmdb.org/t/p/w500/${recMovie.poster_path}` : 'default-poster.jpg'}
                                    alt={recMovie.title}
                                />
                            </div>
                            <div className="movie-details">
                                <h2>{recMovie.title}</h2>
                                <p>Rating: {recMovie.vote_average || 'N/A'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieModal;
