import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import "../css/MoviesList.css";
import "../css/MovieModal.css";
import { addMovieId } from '../utils/recentlyWatched';
import { useAuth } from '../../contexts/AuthContext';
import { getMovieTrailer, getYouTubeEmbedUrl } from '../../utils/trailerService';

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const MovieModal = ({ movie, onMovieSelect }) => {
    const { user, isContributor } = useAuth();
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [useSourceA, setUseSourceA] = useState(true);
    const [trailerId, setTrailerId] = useState(null);
    const [loadingTrailer, setLoadingTrailer] = useState(false);
    const topRef = useRef(null);

    useEffect(() => {
        const fetchRecommendedMovies = async () => {
            if (!movie) return;

            try {
                // Try fetching recommendations from your custom API
                // Note: This requires a backend server running on localhost:8000
                // If not available, falls back to TMDb recommendations
                const response = await axios.post('http://localhost:8000/recommend', {
                    movie_index: movie.id, // Assuming 'id' is the MovieLens ID
                    top_k: 10
                }, {
                    timeout: 3000 // 3 second timeout
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
                // Silently fall back to TMDb recommendations if backend is not available
                // This is expected behavior - the backend is optional
                if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
                    console.warn('Custom recommendation API error, using TMDb fallback:', error.message);
                }
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

    useEffect(() => {
        if (!user && !isContributor && movie) {
            setLoadingTrailer(true);
            getMovieTrailer(movie.id).then((videoId) => {
                setTrailerId(videoId);
                setLoadingTrailer(false);
            }).catch(() => {
                setLoadingTrailer(false);
            });
        } else {
            setTrailerId(null);
        }
    }, [movie, isContributor, user]);

    const handleMovieSelect = (selectedMovie) => {
        onMovieSelect(selectedMovie);
        topRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    const getContentUrl = (id, sourceA) => {
        if (sourceA) {
            return `https://www.vidking.net/embed/movie/${id}?autoPlay=true&nextEpisode=true&episodeSelector=true`;
        }
        return `https://vidsrc.xyz/embed/movie/${id}`;
    };

    const movieEmbedUrl = isContributor ? getContentUrl(movie.id, useSourceA) : null;
    const trailerUrl = trailerId ? getYouTubeEmbedUrl(trailerId) : null;

    useEffect(() => {
        const handlePlayerMessage = (event) => {
            if (!useSourceA || !movie) return;
            
            try {
                const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                
                if (messageData.type === 'PLAYER_EVENT' && messageData.data) {
                    const { event: playerEvent, currentTime, duration } = messageData.data;
                    
                    if (playerEvent === 'play' && currentTime < 60) {
                        addMovieId(movie.id);
                    }
                    
                    if (playerEvent === 'timeupdate' && currentTime && duration) {
                        const progressKey = `movieProgress_${movie.id}`;
                        const progressData = {
                            movieId: movie.id,
                            watchTime: currentTime,
                            totalDuration: duration,
                            progressPercentage: (currentTime / duration) * 100,
                            lastWatchedDate: new Date().toISOString()
                        };
                        localStorage.setItem(progressKey, JSON.stringify(progressData));
                    }
                }
            } catch (error) {
                // Ignore parsing errors
            }
        };

        window.addEventListener('message', handlePlayerMessage);

        return () => {
            window.removeEventListener('message', handlePlayerMessage);
        };
    }, [useSourceA, movie]);

    return (
        <div className="movie-details-container" ref={topRef}>
            <div>
                <h2>{movie.title} - Rating {parseFloat(movie.vote_average).toFixed(1) || 'N/A'}</h2>
                <p className="movie-description">{movie.overview}</p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {isContributor && (
                        <button
                            onClick={() => setUseSourceA(!useSourceA)}
                            style={{
                                backgroundColor: '#f5c518',
                                color: '#000000',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Switch Source
                        </button>
                    )}
                </div>
                <div style={{position: 'relative', width: '100%', height: '500px', overflow: 'hidden'}}>
                    {isContributor && movieEmbedUrl ? (
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
                    ) : user ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#ffffff',
                            backgroundColor: '#1a1a1a',
                            borderRadius: '8px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <p>Your account is pending approval</p>
                                <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '10px' }}>
                                    Please wait for admin approval to access content
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {loadingTrailer ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#ffffff'
                                }}>
                                    Loading trailer...
                                </div>
                            ) : trailerUrl ? (
                                <iframe
                                    src={trailerUrl}
                                    title="Movie Trailer"
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
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#ffffff',
                                    backgroundColor: '#1a1a1a',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p>No trailer available for this movie</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
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
