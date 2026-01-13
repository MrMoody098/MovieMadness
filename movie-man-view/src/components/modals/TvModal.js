import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import '../css/TvModal.css';
import '../css/MoviesList.css';
import { addTvShowId } from '../utils/recentlyWatchedTv';
import { saveWatchProgress } from '../../utils/watchProgress';
import { useAuth } from '../../contexts/AuthContext';
import { getTvTrailer, getYouTubeEmbedUrl } from '../../utils/trailerService';

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const TvModal = ({ isOpen, onRequestClose, tvShow, onTvShowSelect }) => {
    const { user, isContributor } = useAuth();
    const [episodeUrl, setEpisodeUrl] = useState('');
    const [seasonNumber, setSeasonNumber] = useState(1);
    const [episodeNumber, setEpisodeNumber] = useState(1);
    const [totalSeasons, setTotalSeasons] = useState(1);
    const [totalEpisodes, setTotalEpisodes] = useState(1);
    const [useSourceA, setUseSourceA] = useState(true);
    const [trailerId, setTrailerId] = useState(null);
    const [loadingTrailer, setLoadingTrailer] = useState(false);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tvShow, seasonNumber]);

    useEffect(() => {
        if (!user && !isContributor && tvShow) {
            setLoadingTrailer(true);
            getTvTrailer(tvShow.id).then((videoId) => {
                setTrailerId(videoId);
                setLoadingTrailer(false);
            }).catch(() => {
                setLoadingTrailer(false);
            });
        } else {
            setTrailerId(null);
        }
    }, [tvShow, isContributor, user]);

    const getEpisodeUrl = (showId, season, episode, sourceA) => {
        if (sourceA) {
            return `https://www.vidking.net/embed/tv/${showId}/${season}/${episode}?autoPlay=true&nextEpisode=true&episodeSelector=true`;
        }
        return `https://vidsrc.xyz/embed/tv?tmdb=${showId}&season=${season}&episode=${episode}`;
    };

    useEffect(() => {
        if (isContributor && tvShow && seasonNumber <= totalSeasons && episodeNumber <= totalEpisodes) {
            setEpisodeUrl(getEpisodeUrl(tvShow.id, seasonNumber, episodeNumber, useSourceA));
        } else {
            setEpisodeUrl('');
        }
    }, [tvShow, seasonNumber, episodeNumber, totalSeasons, totalEpisodes, useSourceA, isContributor]);

    useEffect(() => {
        const handlePlayerMessage = (event) => {
            if (!useSourceA || !tvShow) return;
            
            try {
                const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                
                if (messageData.type === 'PLAYER_EVENT' && messageData.data) {
                    const { season, episode, event: playerEvent, currentTime, duration } = messageData.data;
                    
                    if (season && episode) {
                        if (season !== seasonNumber) {
                            setSeasonNumber(season);
                        }
                        if (episode !== episodeNumber) {
                            setEpisodeNumber(episode);
                        }
                    }
                    
                    if (playerEvent === 'play' && currentTime < 60) {
                        addTvShowId(tvShow.id);
                    }
                    
                    if (playerEvent === 'timeupdate' && currentTime && duration) {
                        const currentSeason = season || seasonNumber;
                        const currentEpisode = episode || episodeNumber;
                        saveWatchProgress(tvShow.id, currentSeason, currentEpisode, currentTime, duration);
                    }
                    
                    if (playerEvent === 'seeked' && currentTime && duration) {
                        const currentSeason = season || seasonNumber;
                        const currentEpisode = episode || episodeNumber;
                        saveWatchProgress(tvShow.id, currentSeason, currentEpisode, currentTime, duration);
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
    }, [useSourceA, tvShow, seasonNumber, episodeNumber]);

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="TV Show Episode">
            {tvShow && (
                <div className="movie-details-container" ref={topRef}>
                    <button onClick={onRequestClose}>Close</button>
                    <h2>{tvShow.name} - Season {seasonNumber} Episode {episodeNumber}</h2>
                    <p className="movie-description">{tvShow.overview}</p>
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

                    {isContributor && episodeUrl ? (
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
                    ) : user ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '500px',
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
                                    height: '500px',
                                    color: '#ffffff'
                                }}>
                                    Loading trailer...
                                </div>
                            ) : trailerId ? (
                                <div style={{position: 'relative', width: '100%', height: '500px', overflow: 'hidden'}}>
                                    <iframe
                                        src={getYouTubeEmbedUrl(trailerId)}
                                        title="TV Show Trailer"
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
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '500px',
                                    color: '#ffffff',
                                    backgroundColor: '#1a1a1a',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p>No trailer available for this show</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {isContributor && (
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
                    )}
                </div>
            )}
        </Modal>
    );
};

export default TvModal;
