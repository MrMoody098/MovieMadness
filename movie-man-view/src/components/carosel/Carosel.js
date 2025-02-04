import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import "../css/MoviesList.css";

const API_KEY = 'f58bf4f31de2a8346b5841b863457b1f';
const ITEMS_PER_BATCH = 12 * 5; // Load 10 pages worth of 5 items each

const Carousel = () => {
    const carouselRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [batch, setBatch] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const autoScrollIntervalRef = useRef(null);
    const scrollPauseTimeoutRef = useRef(null);

    useEffect(() => {
        loadBatch();
        setupAutoScroll();

        return () => {
            clearInterval(autoScrollIntervalRef.current);
            clearTimeout(scrollPauseTimeoutRef.current);
        };
    }, []);

    const loadBatch = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const response = await axios.get(
                `https://api.themoviedb.org/3/trending/movie/day`,
                {
                    params: {
                        api_key: API_KEY,
                        page: batch,
                    },
                }
            );
            setTrendingMovies(prevMovies => [
                ...prevMovies,
                ...response.data.results.slice(0, ITEMS_PER_BATCH),
            ]);
            setBatch(prevBatch => prevBatch + 1);
        } catch (error) {
            console.error("Error fetching trending movies:", error);
        }
        setLoading(false);
    };

    const setupAutoScroll = () => {
        autoScrollIntervalRef.current = setInterval(() => {
            if (carouselRef.current && isAutoScrolling) {
                carouselRef.current.scrollLeft += 1; // Adjust for scroll speed
            }
        }, 20);
    };

    const pauseAutoScroll = () => {
        clearInterval(autoScrollIntervalRef.current);
        clearTimeout(scrollPauseTimeoutRef.current);
        setIsAutoScrolling(false);

        scrollPauseTimeoutRef.current = setTimeout(() => {
            setIsAutoScrolling(true);
            setupAutoScroll();
        }, 3000);
    };

    const startDrag = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - carouselRef.current.offsetLeft);
        setScrollLeft(carouselRef.current.scrollLeft);
        pauseAutoScroll();
    };

    const onDrag = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - carouselRef.current.offsetLeft;
        const walk = (x - startX) * 3;
        carouselRef.current.scrollLeft = scrollLeft - walk;
    };

    const endDrag = () => {
        setIsDragging(false);
    };

    // Check if the user has scrolled near the end of the carousel
    const checkScrollPosition = () => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 100) { // Load more when 100px from end
                loadBatch();
            }
        }
    };

    useEffect(() => {
        if (carouselRef.current) {
            carouselRef.current.addEventListener("scroll", checkScrollPosition);
        }
        return () => {
            if (carouselRef.current) {
                carouselRef.current.removeEventListener("scroll", checkScrollPosition);
            }
        };
    }, []);

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>&#9733;</span>
            );
        }
        return stars;
    };

    return (
        <div className="recently-watched">
            <h2>Trending Movies</h2>
            <div
                className="carousel"
                ref={carouselRef}
                onMouseDown={startDrag}
                onMouseMove={onDrag}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
            >
                {trendingMovies.map((movie) => (
                    <div className="movie-card" key={movie.id}>
                        <div className="movie-poster">
                            <img src={`https://image.tmdb.org/t/p/w500/${movie.poster_path}`} alt={movie.title} />
                        </div>
                        <div className="movie-details">
                            <div className="movie-title"><h2>{movie.title}</h2></div>
                            <div className="movie-rating">
                                <p>Rating: {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                                <div className="star-rating">
                                    {renderStars(Math.round(movie.vote_average / 2))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {loading && <div>Loading...</div>}
        </div>
    );
};

export default Carousel;
