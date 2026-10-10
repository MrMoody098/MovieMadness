import React, { useEffect, useRef, useState } from 'react';
import useFetchItems from '../hooks/useFetchItems';
import MediaCard from '../MediaCard';
import ResultsStatus from '../ResultsStatus';
import Icon from '../Icon';
import '../css/MoviesList.css';

export default function Carousel({ onSelect, genreId, endpoint, heading = 'Trending movies' }) {
    const results = useFetchItems('movie', { endpoint: endpoint || (genreId ? 'discover/movie' : 'trending/movie/day'),
        params: genreId ? { with_genres: genreId } : {} });
    const rail = useRef(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const updatePosition = () => {
        const element = rail.current;
        if (!element) return;
        setAtStart(element.scrollLeft <= 1);
        setAtEnd(element.scrollLeft + element.clientWidth >= element.scrollWidth - 2);
    };
    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [results.items.length]);

    const onScroll = event => {
        updatePosition();
        const { scrollLeft, scrollWidth, clientWidth } = event.currentTarget;
        if (scrollLeft + clientWidth >= scrollWidth - 300) results.loadMore();
    };
    const scroll = direction => {
        const element = rail.current;
        if (!element) return;
        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        element.scrollBy({ left: direction * element.clientWidth * .85, behavior: reducedMotion ? 'auto' : 'smooth' });
        if (direction > 0 && atEnd) results.loadMore();
    };
    return <section className="catalog-section">
        <div className="section-heading"><h2>{heading}</h2>
            <div className="rail-controls">
                <button className="icon-button" aria-label={`Scroll ${heading} back`} disabled={atStart} onClick={() => scroll(-1)}><Icon name="left" /></button>
                <button className="icon-button" aria-label={`Scroll ${heading} forward`} disabled={atEnd && !results.hasMore} onClick={() => scroll(1)}><Icon name="right" /></button>
            </div>
        </div>
        <div className="carousel" ref={rail} onScroll={onScroll} aria-label={heading} tabIndex={0}>
            {results.items.map(item => <MediaCard key={item.id} item={item} type="movie" onSelect={onSelect} />)}
        </div>
        <ResultsStatus {...results} empty={!results.items.length} />
    </section>;
}
