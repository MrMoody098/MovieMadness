import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import '../css/TvModal.css';
import '../css/MoviesList.css';

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const TvModal = ({ isOpen, onRequestClose, tvShow, onTvShowSelect }) => {
    const [episodeUrl, setEpisodeUrl] = useState('');
    const [seasonNumber, setSeasonNumber] = useState(1);
    const [episodeNumber, setEpisodeNumber] = useState(1);
    const [totalSeasons, setTotalSeasons] = useState(1);
    const [totalEpisodes, setTotalEpisodes] = useState(1);
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
            const episodeEmbedUrl = `https://vidsrc.xyz/embed/tv?tmdb=${tvShow.id}&season=${seasonNumber}&episode=${episodeNumber}`;
            setEpisodeUrl(episodeEmbedUrl);
        } else {
            setEpisodeUrl('');
        }
    }, [tvShow, seasonNumber, episodeNumber, totalSeasons, totalEpisodes]);

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

                    <div className="episode-controls">
                        <button onClick={handlePrevEpisode}>Previous Episode</button>
                        <button onClick={handleNextEpisode}>Next Episode</button>
                    </div>

                    <div className="season-controls">
                        <button onClick={handlePrevSeason}>Previous Season</button>
                        <button onClick={handleNextSeason}>Next Season</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default TvModal;
