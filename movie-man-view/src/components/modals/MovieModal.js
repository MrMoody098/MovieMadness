import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import "../css/MoviesList.css";
import "../css/MovieModal.css";

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const MovieModal = ({ movie, onMovieSelect }) => {
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [useVidKing, setUseVidKing] = useState(true);
    const topRef = useRef(null);

    useEffect(() => {
        const fetchRecommendedMovies = async () => {
            if (!movie) return;

            try {
                // Try fetching recommendations from your custom API
                const response = await axios.post('http://localhost:8000/recommend', {
                    movie_index: movie.id, // Assuming 'id' is the MovieLens ID
                    top_k: 10
                });

                const recommendedIds = response.data.recommended_movie_ids;

                // Fetch movie details for the recommended IDs
                const movieDetails = await Promise.all(
                    recommendedIds.map(async (id) => {
                        const { data } = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`);
                        return data;
                    })
                );

                setRecommendedMovies(movieDetails);
            } catch (error) {
                console.error('Error fetching from custom API, falling back to TMDb API:', error);
                fallbackToTmdbRecommendations();
            }
        };

        const fallbackToTmdbRecommendations = async () => {
            try {
                const { data } = await axios.get(
                    `https://api.themoviedb.org/3/movie/${movie.id}/recommendations?api_key=${API_KEY}`
                );

                const filteredMovies = data.results.filter(recMovie => recMovie.vote_count > 200);
                setRecommendedMovies(filteredMovies);
            } catch (error) {
                console.error('Error fetching fallback recommendations from TMDb:', error);
                setRecommendedMovies([]); // Ensure state is set to an empty array on failure
            }
        };

        fetchRecommendedMovies();
    }, [movie]);

    const handleMovieSelect = (selectedMovie) => {
        onMovieSelect(selectedMovie);
        topRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    const movieEmbedUrl = useVidKing 
        ? `https://www.vidking.net/embed/movie/${movie.id}?autoPlay=true&nextEpisode=true&episodeSelector=true`
        : `https://vidsrc.xyz/embed/movie/${movie.id}`;

    return (
        <div className="movie-details-container" ref={topRef}>
            <div>
                <h2>{movie.title} - Rating {parseFloat(movie.vote_average).toFixed(1) || 'N/A'}</h2>
                <p className="movie-description">{movie.overview}</p>
                <button 
                    onClick={() => setUseVidKing(!useVidKing)}
                    style={{
                        backgroundColor: '#f5c518',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        marginBottom: '10px',
                        fontWeight: 'bold'
                    }}
                >
                    Switch to {useVidKing ? 'VidSrc' : 'VidKing'}
                </button>
                <div style={{position: 'relative', width: '100%', height: '500px', overflow: 'hidden'}}>
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
                            height: '100%',
                            border: 'none'
                        }}
                    />
                </div>
            </div>

            <div className="recommended-movies">
                <h3>Recommended Movies</h3>
                <div className="movies-container">
                    {recommendedMovies.length > 0 ? (
                        recommendedMovies.map((recMovie) => (
                            <div className="movie-card" key={recMovie.id} onClick={() => handleMovieSelect(recMovie)}>
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
                        ))
                    ) : (
                        <p>No recommendations found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieModal;
