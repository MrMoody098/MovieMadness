import React from 'react';
import Icon from './Icon';

export default function MediaCard({ item, type, onSelect, selected = false, selectionMode = false, children }) {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date;
    const year = typeof date === 'string' ? date.slice(0, 4) : '';
    const rating = Number.isFinite(item.vote_average) && item.vote_average > 0 ? item.vote_average.toFixed(1) : null;

    return <article className={`movie-card ${selectionMode ? 'delete-mode' : ''} ${selected ? 'selected' : ''}`}>
        <button className="card-open" onClick={() => onSelect(item, type)}
            aria-label={`${selectionMode ? 'Select' : 'Open'} ${title}`}
            aria-pressed={selectionMode ? selected : undefined}>
            <div className="movie-poster">
                <img src={typeof item.poster_path === 'string' && item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/default-poster.svg'}
                    alt="" loading="lazy" width="342" height="513"
                    onError={event => {
                        if (!event.currentTarget.src.endsWith('/default-poster.svg')) event.currentTarget.src = '/default-poster.svg';
                    }} />
                <span className="poster-action" aria-hidden="true"><Icon name={selectionMode ? selected ? 'check' : 'plus' : 'play'} /></span>
            </div>
            <div className="movie-details">
                <h3 title={title}>{title}</h3>
                <div className="card-meta"><span>{year || (type === 'tv' ? 'TV show' : 'Movie')}</span>
                    {rating && <span className="movie-rating" aria-label={`Rated ${rating} out of 10`}><Icon name="star" size={12} />{rating}</span>}
                </div>
            </div>
        </button>
        {children}
    </article>;
}
