import React from 'react';
import useFetchItems from '../hooks/useFetchItems';
import MediaCard from '../MediaCard';
import ResultsStatus from '../ResultsStatus';
import '../css/MoviesList.css';

export default function Carousel({ onSelect, genreId, heading = 'Trending Movies' }) {
    const results = useFetchItems('movie', genreId ? {
        endpoint: 'discover/movie', params: { with_genres: genreId }
    } : {});
    const onScroll = event => {
        const { scrollLeft, scrollWidth, clientWidth } = event.currentTarget;
        if (scrollLeft + clientWidth >= scrollWidth - 100) results.loadMore();
    };
    return <section className="recently-watched">
        <h2>{heading}</h2>
        <div className="carousel" onScroll={onScroll} aria-label={heading} tabIndex={0}>
            {results.items.map(item => <MediaCard key={item.id} item={item} type="movie" onSelect={onSelect} />)}
        </div>
        <ResultsStatus {...results} empty={!results.items.length} />
    </section>;
}
