import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import './css/TvModal.css'; // Import CSS for styling

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';

const TvModal = ({ isOpen, onRequestClose, tvShow }) => {
    const [episodeUrl, setEpisodeUrl] = useState('');
    const [seasonNumber, setSeasonNumber] = useState(1);
    const [episodeNumber, setEpisodeNumber] = useState(1);

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

    const handlePrevEpisode = () => {
        if (episodeNumber > 1) {
            setEpisodeNumber(prev => prev - 1);
        } else if (seasonNumber > 1) {
            setSeasonNumber(prev => prev - 1);
            setEpisodeNumber(10); // Adjust as needed for the number of episodes per season
        }
    };

    const handleNextEpisode = () => {
        setEpisodeNumber(prev => prev + 1); // Increment episode number
        // Optionally, you can add logic to handle season changes based on the total number of episodes per season
    };

    const handlePrevSeason = () => {
        if (seasonNumber > 1) {
            setSeasonNumber(prev => prev - 1);
            setEpisodeNumber(1); // Reset to first episode of the previous season
        }
    };

    const handleNextSeason = () => {
        setSeasonNumber(prev => prev + 1);
        setEpisodeNumber(1); // Reset to first episode of the next season
    };

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="TV Show Episode">
            {tvShow && (
                <div>
                    <h2>{tvShow.name} - Season {seasonNumber} Episode {episodeNumber} -
                        Rating {parseFloat(tvShow.vote_average).toFixed(1)|| 'N/A'}</h2>


                    {/* Add TV Show description here */}
                    <p className="tv-description">{tvShow.overview}</p>

                    {episodeUrl && (
                        <iframe
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

                    <button onClick={onRequestClose}>Close</button>
                </div>
            )}
        </Modal>
    );
};

export default TvModal;
