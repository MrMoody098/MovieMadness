import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from "../NavBar";
import TvModal from "../TvModal";
const TMDB_API_KEY = 'f58bf4f31de2a8346b5841b863457b1f'; // Your API key

const TVShows = () => {
    const [tvShows, setTVShows] = useState([]);
    const [selectedTVShow, setSelectedTVShow] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTVShows = async (query = '') => {
        try {
            let url;
            if (query) {
                url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${query}&include_adult=false&language=en-US&page=1`;
            } else {
                url = `https://api.themoviedb.org/3/trending/tv/day?api_key=${TMDB_API_KEY}`;
            }

            const { data } = await axios.get(url);

            // Modify the TV show data to include poster URL from TMDb
            const modifiedTVShows = data.results.map((tvShow) => ({
                ...tvShow,
                poster: tvShow.poster_path
                    ? `https://image.tmdb.org/t/p/w500/${tvShow.poster_path}`
                    : 'default-poster.jpg', // Placeholder for missing poster
            }));

            setTVShows(modifiedTVShows);
        } catch (error) {
            console.error('Error fetching TV shows:', error);
        }
    };

    useEffect(() => {
        fetchTVShows(); // Fetch trending TV shows when the component mounts
    }, []);

    useEffect(() => {
        if (searchQuery) {
            fetchTVShows(searchQuery); // Fetch TV shows based on the search query
        }
    }, [searchQuery]);

    const handleTVShowClick = (tvShow) => {
        setSelectedTVShow(tvShow);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    return (
        <div>
            <NavBar isModalOpen={isModalOpen} onSearch={handleSearch} />
            <div className="movies-container">
                {tvShows.map((tvShow) => (
                    <div
                        className="movie-card"
                        key={tvShow.id}
                        onClick={() => handleTVShowClick(tvShow)}
                    >
                        {/* TV show poster */}
                        <div className="movie-poster">
                            <img src={tvShow.poster} alt={tvShow.name} />
                        </div>

                        {/* TV show details */}
                        <div className="movie-details">
                            <h2>{tvShow.name}</h2>
                            <p>Rating: {tvShow.vote_average || 'N/A'}</p>
                        </div>
                    </div>
                ))}

                {/* TvModal to show first episode of the TV show */}
                <TvModal
                    isOpen={isModalOpen}
                    onRequestClose={closeModal}
                    tvShow={selectedTVShow}
                />
            </div>
        </div>
    );
};

export default TVShows;
