import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import './css/TvModal.css';
import './css/MoviesList.css';

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const TvModal = ({ isOpen, onRequestClose, tvShow, onTvShowSelect }) => {
    const [episodeUrl, setEpisodeUrl] = useState('');
    const [seasonNumber, setSeasonNumber] = useState(1);
    const [episodeNumber, setEpisodeNumber] = useState(1);
    const [autoSkip, setAutoSkip] = useState(false);
    const [recommendedShows, setRecommendedShows] = useState([]);
    const videoRef = useRef(null);

    useEffect(() => {
        const fetchEpisodeUrl = async () => {
            if (tvShow) {
                const tmdbId = tvShow.id;
                try {
                    const episodeEmbedUrl = `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${seasonNumber}&episode=${episodeNumber}`;
                    setEpisodeUrl(episodeEmbedUrl);
                } catch (error) {
                    console.error('Error fetching episode URL:', error);
                }
            }
        };

        fetchEpisodeUrl();
    }, [tvShow, seasonNumber, episodeNumber]);

    useEffect(() => {
        const fetchRecommendedShows = async () => {
            if (tvShow) {
                try {
                    const { data } = await axios.get(
                        `https://api.themoviedb.org/3/tv/${tvShow.id}/recommendations?api_key=${API_KEY}`
                    );
                    const filteredShows = data.results.filter(recShow => recShow.vote_count > 200);
                    setRecommendedShows(filteredShows);
                } catch (error) {
                    console.error('Error fetching recommended shows:', error);
                }
            }
        };

        fetchRecommendedShows();
    }, [tvShow]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            const handleEnded = () => {
                if (autoSkip) {
                    setEpisodeNumber(prev => prev + 1);
                }
            };
            videoElement.addEventListener('ended', handleEnded);
            return () => {
                videoElement.removeEventListener('ended', handleEnded);
            };
        }
    }, [autoSkip]);

    const handlePrevEpisode = () => {
        if (episodeNumber > 1) {
            setEpisodeNumber(prev => prev - 1);
        } else if (seasonNumber > 1) {
            setSeasonNumber(prev => prev - 1);
            setEpisodeNumber(10); // Adjust as needed for the number of episodes per season
        }
    };

    const handleNextEpisode = () => {
        setEpisodeNumber(prev => prev + 1);
    };

    const handlePrevSeason = () => {
        if (seasonNumber > 1) {
            setSeasonNumber(prev => prev - 1);
            setEpisodeNumber(1);
        }
    };

    const handleNextSeason = () => {
        setSeasonNumber(prev => prev + 1);
        setEpisodeNumber(1);
    };

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="TV Show Episode">
            {tvShow && (
                <div className="movie-details-container">
                    <button onClick={onRequestClose}>Close</button>
                    <h2>{tvShow.name} - Season {seasonNumber} Episode {episodeNumber} -
                        Rating {parseFloat(tvShow.vote_average).toFixed(1) || 'N/A'}</h2>

                    <p className="movie-description">{tvShow.overview}</p>

                    {episodeUrl && (
                        <iframe
                            ref={videoRef}
                            title={`${tvShow.name} - S${seasonNumber}E${episodeNumber}`}
                            src={episodeUrl}
                            width="100%"
                            height="400"
                            allowFullScreen
                        ></iframe>
                    )}

                    <div className="episode-controls">
                        <button onClick={handlePrevEpisode}>Previous Episode</button>
                        <button onClick={handleNextEpisode}>Next Episode</button>
                    </div>

                    <div className="season-controls">
                        <button onClick={handlePrevSeason}>Previous Season</button>
                        <button onClick={handleNextSeason}>Next Season</button>
                    </div>

                    <div className="switch-container">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={autoSkip}
                                onChange={() => setAutoSkip(!autoSkip)}
                            />
                            <span className="slider"></span>
                        </label>
                        <span>Auto-Skip</span>
                    </div>

                    <div className="recommended-movies">
                        <h3>Recommended Shows</h3>
                        <div className="movies-container">
                            {recommendedShows.map((recShow) => (
                                <div className="movie-card" key={recShow.id} onClick={() => onTvShowSelect(recShow)}>
                                    <div className="movie-poster">
                                        <img
                                            src={recShow.poster_path ? `https://image.tmdb.org/t/p/w500/${recShow.poster_path}` : 'default-poster.jpg'}
                                            alt={recShow.name}
                                        />
                                    </div>
                                    <div className="movie-details">
                                        <h2>{recShow.name}</h2>
                                        <p>Rating: {recShow.vote_average || 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </Modal>
    );
};

export default TvModal;
