import React from 'react';
import { getMovieProgress, getShowProgress } from '../utils/watchProgress';
import Icon from './Icon';

export default function MediaCard({ item, type, onSelect, selected = false, selectionMode = false, children }) {
    const title = item.title || item.name;
    const progress = type === 'tv' ? getShowProgress(item.id) : getMovieProgress(item.id);
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
                {progress && type === 'tv' && <span className="episode-badge">S{progress.lastWatchedSeason} E{progress.lastWatchedEpisode}</span>}
                {progress && progress.progressPercentage > 0 && <div className="progress-bar-container" role="progressbar"
                    aria-label={`${title} watch progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.progressPercentage)}>
                    <div className="progress-bar" style={{ transform: `scaleX(${progress.progressPercentage / 100})` }} />
                </div>}
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
