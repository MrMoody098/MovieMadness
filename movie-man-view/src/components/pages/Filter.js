import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import "../Filter.css";
import NavBar from "../NavBar";

const TMDB_API_KEY = 'f58bf4f31de2a8346b5841b863457b1f'; // Your API key

const Filter = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isMovieMode, setIsMovieMode] = useState(true); // Switch mode
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
        try {
            const endpoint = isMovieMode
                ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}`
                : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&page=${page}`;

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
        }
    };

    useEffect(() => {
        if (selectedGenre) {
            setItems([]);
            setPage(1);
            setHasMore(true);
            fetchItemsByGenre(selectedGenre, 1);
        }
    }, [selectedGenre, isMovieMode]);

    const handleGenreChange = (event) => {
        const genreId = event.target.value;
        setSelectedGenre(genreId);
    };

    useEffect(() => {
        const fetchMoreItems = async () => {
            if (hasMore) {
                await fetchItemsByGenre(selectedGenre, page);
            }
        };

        fetchMoreItems();
    }, [page]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    console.log('Loader is in view');
                    setPage((prevPage) => prevPage + 1);
                }
            },
            { threshold: 1 }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (loaderRef.current) {
                observer.unobserve(loaderRef.current);
            }
        };
    }, [hasMore]);

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
            </div>

            <select value={selectedGenre} onChange={handleGenreChange}>
                <option value="">All Genres</option>
                {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                        {genre.name}
                    </option>
                ))}
            </select>

            <div className="movies-container">
                {items.map((item) => (
                    <div key={item.id} className="movie-card">
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

            {hasMore && <div ref={loaderRef} className="loader">Loading more...</div>}
        </div>
    );
};

export default Filter;
