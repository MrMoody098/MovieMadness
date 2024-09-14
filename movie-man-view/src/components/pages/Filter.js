import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import "../css/Filter.css";
import NavBar from "../NavBar";
import Modal from 'react-modal';
import MovieModal from "../MovieModal";
import TvModal from "../TvModal";
import "../css/Modal.css";
const TMDB_API_KEY = 'f58bf4f31de2a8346b5841b863457b1f'; // Your API key

const Filter = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isMovieMode, setIsMovieMode] = useState(true); // Switch mode
    const [selectedItem, setSelectedItem] = useState(null); // State for selected item
    const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
    const [loading, setLoading] = useState(false); // Loading state
    const [minVoteCount, setMinVoteCount] = useState(20); // Minimum vote count
    const [minRating, setMinRating] = useState(0); // Minimum rating
    const [maxRating, setMaxRating] = useState(10); // Maximum rating
    const loaderRef = useRef(null);

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const { data } = await axios.get(
                    `https://api.themoviedb.org/3/genre/${isMovieMode ? 'movie' : 'tv'}/list?api_key=${TMDB_API_KEY}&language=en-US`
                );
                setGenres(data.genres);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };

        fetchGenres();
    }, [isMovieMode]);

    const fetchItemsByGenre = async (genreId, page) => {
        if (loading) return; // Prevent multiple fetches

        setLoading(true);
        try {
            const endpoint = isMovieMode
                ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&with_genres=${genreId}&page=${page}&vote_count.gte=${minVoteCount}&vote_average.gte=${minRating}&vote_average.lte=${maxRating}`
                : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&with_genres=${genreId}&page=${page}&vote_count.gte=${minVoteCount}&vote_average.gte=${minRating}&vote_average.lte=${maxRating}`;

            const { data } = await axios.get(endpoint);

            if (data.results.length === 0) {
                setHasMore(false);
            } else {
                setItems((prevItems) => [...prevItems, ...data.results]);
            }

            if (data.page >= data.total_pages) {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching items by genre:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedGenre) {
            setItems([]);
            setPage(1);
            setHasMore(true);
            fetchItemsByGenre(selectedGenre, 1);
        }
    }, [selectedGenre, isMovieMode, minVoteCount, minRating, maxRating]);

    useEffect(() => {
        if (selectedGenre && page > 1) {
            fetchItemsByGenre(selectedGenre, page);
        }
    }, [page]);


    const handleGenreChange = (event) => {
        const genreId = event.target.value;
        setSelectedGenre(genreId);
    };

    const handleScroll = useCallback(() => {
        if (
            window.innerHeight + document.documentElement.scrollTop + 50 >=
            document.documentElement.offsetHeight
        ) {
            if (hasMore && !loading) {
                setPage((prevPage) => prevPage + 1);
            }
        }
    }, [hasMore, loading]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="filter-container">
            <NavBar />

            <div className="filter-header">
                <h2>Filter by Genre</h2>
                <div className="switch-container">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isMovieMode}
                            onChange={() => setIsMovieMode(!isMovieMode)}
                        />
                        <span className="slider"></span>
                    </label>
                    <span>{isMovieMode ? 'Movies' : 'TV Shows'}</span>
                </div>
                <select value={selectedGenre} onChange={handleGenreChange}>
                    <option value="">All Genres</option>
                    {genres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                            {genre.name}
                        </option>
                    ))}
                </select>
                {/* Input fields for min votes and rating */}
                <div className="filter-inputs">
                    <label>
                        Min Vote Count:
                        <input
                            type="number"
                            value={minVoteCount}
                            onChange={(e) => setMinVoteCount(e.target.value)}
                        />
                    </label>
                    <label>
                        Min Rating:
                        <input
                            type="number"
                            step="0.1"
                            value={minRating}
                            onChange={(e) => setMinRating(e.target.value)}
                            min="0"
                            max="10"
                        />
                    </label>
                    <label>
                        Max Rating:
                        <input
                            type="number"
                            step="0.1"
                            value={maxRating}
                            onChange={(e) => setMaxRating(e.target.value)}
                            min="0"
                            max="10"
                        />
                    </label>
                </div>
            </div>


            <div className="movies-container">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="movie-card"
                        onClick={() => handleItemClick(item)}
                    >
                        <div className="movie-poster">
                            <img
                                src={item.poster_path
                                    ? `https://image.tmdb.org/t/p/w500/${item.poster_path}`
                                    : 'default-poster.jpg'}
                                alt={item.title || item.name}
                            />
                        </div>

                        <div className="movie-details">
                            <h2>{item.title || item.name}</h2>
                            <p>Rating: {item.vote_average || 'N/A'}</p>
                        </div>
                    </div>
                ))}
            </div>

            {loading && <div>Loading...</div>}
            {hasMore && !loading && <div ref={loaderRef} className="loader">Loading more...</div>}

            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                contentLabel="Details"
            >
                {selectedItem && (isMovieMode
                        ? <MovieModal movie={selectedItem} />
                        : <TvModal    isOpen={isModalOpen}
                                      onRequestClose={closeModal}
                                      tvShow={selectedItem} />
                )}
                <button onClick={closeModal}>Close</button>
            </Modal>
        </div>
    );
};

export default Filter;
