import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import '../css/TvModal.css';
import '../css/MoviesList.css';
import { addTvShowId } from '../utils/recentlyWatchedTv';
import { saveWatchProgress } from '../../utils/watchProgress';

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const TvModal = ({ isOpen, onRequestClose, tvShow, onTvShowSelect }) => {
    const [episodeUrl, setEpisodeUrl] = useState('');
    const [seasonNumber, setSeasonNumber] = useState(1);
    const [episodeNumber, setEpisodeNumber] = useState(1);
    const [totalSeasons, setTotalSeasons] = useState(1);
    const [totalEpisodes, setTotalEpisodes] = useState(1);
    const [useVidKing, setUseVidKing] = useState(true);
    const topRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        const fetchShowDetails = async () => {
            if (tvShow) {
                try {
                    const { data } = await axios.get(
                        `https://api.themoviedb.org/3/tv/${tvShow.id}?api_key=${API_KEY}`
                    );
                    setTotalSeasons(data.number_of_seasons);
                    setSeasonNumber(1);
                } catch (error) {
                    console.error('Error fetching show details:', error);
                }
            }
        };
        fetchShowDetails();
    }, [tvShow]);

    useEffect(() => {
        const fetchSeasonDetails = async () => {
            if (tvShow && seasonNumber > 0 && seasonNumber <= totalSeasons) {
                try {
                    const { data } = await axios.get(
                        `https://api.themoviedb.org/3/tv/${tvShow.id}/season/${seasonNumber}?api_key=${API_KEY}`
                    );
                    setTotalEpisodes(data.episodes.length);
                    setEpisodeNumber(1);
                } catch (error) {
                    console.error('Error fetching season details:', error);
                }
            }
        };
        fetchSeasonDetails();
    }, [tvShow, seasonNumber]);

    useEffect(() => {
        if (tvShow && seasonNumber <= totalSeasons && episodeNumber <= totalEpisodes) {
            const episodeEmbedUrl = useVidKing
                ? `https://www.vidking.net/embed/tv/${tvShow.id}/${seasonNumber}/${episodeNumber}?autoPlay=true&nextEpisode=true&episodeSelector=true`
                : `https://vidsrc.xyz/embed/tv?tmdb=${tvShow.id}&season=${seasonNumber}&episode=${episodeNumber}`;
            setEpisodeUrl(episodeEmbedUrl);
        } else {
            setEpisodeUrl('');
        }
    }, [tvShow, seasonNumber, episodeNumber, totalSeasons, totalEpisodes, useVidKing]);

    // Listen for VidKing player events to sync episode changes and track watch progress
    useEffect(() => {
        const handlePlayerMessage = (event) => {
            if (!useVidKing || !tvShow) return;
            
            try {
                const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                
                // Check if it's a VidKing player event
                if (messageData.type === 'PLAYER_EVENT' && messageData.data) {
                    const { season, episode, event: playerEvent, currentTime, duration } = messageData.data;
                    
                    // Update state if season/episode changed (from auto-skip)
                    if (season && episode) {
                        if (season !== seasonNumber) {
                            setSeasonNumber(season);
                        }
                        if (episode !== episodeNumber) {
                            setEpisodeNumber(episode);
                        }
                    }
                    
                    // Add to recently watched when playback starts
                    if (playerEvent === 'play' && currentTime < 60) {
                        addTvShowId(tvShow.id);
                    }
                    
                    // Save watch progress periodically during playback
                    if (playerEvent === 'timeupdate' && currentTime && duration) {
                        const currentSeason = season || seasonNumber;
                        const currentEpisode = episode || episodeNumber;
                        saveWatchProgress(tvShow.id, currentSeason, currentEpisode, currentTime, duration);
                    }
                    
                    // Update progress when user seeks
                    if (playerEvent === 'seeked' && currentTime && duration) {
                        const currentSeason = season || seasonNumber;
                        const currentEpisode = episode || episodeNumber;
                        saveWatchProgress(tvShow.id, currentSeason, currentEpisode, currentTime, duration);
                    }
                }
            } catch (error) {
                // Ignore non-JSON messages
            }
        };

        window.addEventListener('message', handlePlayerMessage);

        return () => {
            window.removeEventListener('message', handlePlayerMessage);
        };
    }, [useVidKing, tvShow, seasonNumber, episodeNumber]);

    const handleNextEpisode = () => {
        setEpisodeNumber(prev => (prev < totalEpisodes ? prev + 1 : prev));
    };

    const handlePrevEpisode = () => {
        setEpisodeNumber(prev => (prev > 1 ? prev - 1 : prev));
    };

    const handleNextSeason = () => {
        setSeasonNumber(prev => (prev < totalSeasons ? prev + 1 : prev));
        setEpisodeNumber(1);
    };

    const handlePrevSeason = () => {
        setSeasonNumber(prev => (prev > 1 ? prev - 1 : prev));
        setEpisodeNumber(1);
    };

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="TV Show Episode">
            {tvShow && (
                <div className="movie-details-container" ref={topRef}>
                    <button onClick={onRequestClose}>Close</button>
                    <h2>{tvShow.name} - Season {seasonNumber} Episode {episodeNumber}</h2>
                    <p className="movie-description">{tvShow.overview}</p>
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

                    {episodeUrl && (
                        <div style={{position: 'relative', width: '100%', height: '500px', overflow: 'hidden'}}>
                            <iframe
                                ref={videoRef}
                                title={`${tvShow.name} - S${seasonNumber}E${episodeNumber}`}
                                src={episodeUrl}
                                allowFullScreen
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    border: 'none'
                                }}
                            ></iframe>
                        </div>
                    )}

                    <div className="controls">
                        <label>
                            Select Season:
                            <select value={seasonNumber} onChange={(e) => setSeasonNumber(Number(e.target.value))}>
                                {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(season => (
                                    <option key={season} value={season}>{season}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Select Episode:
                            <select value={episodeNumber} onChange={(e) => setEpisodeNumber(Number(e.target.value))}>
                                {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map(episode => (
                                    <option key={episode} value={episode}>{episode}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default TvModal;
