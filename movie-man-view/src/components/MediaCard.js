import React from 'react';
import { getMovieProgress, getShowProgress } from '../utils/watchProgress';

export default function MediaCard({ item, type, onSelect, selected = false, selectionMode = false, children }) {
    const title = item.title || item.name;
    const progress = type === 'tv' ? getShowProgress(item.id) : getMovieProgress(item.id);
    return (
        <article className={`movie-card ${selectionMode ? 'delete-mode' : ''} ${selected ? 'selected' : ''}`}>
            <button className="card-open" onClick={() => onSelect(item, type)}
                aria-label={`${selectionMode ? 'Select' : 'Open'} ${title}`}
                aria-pressed={selectionMode ? selected : undefined}>
                <div className="movie-poster">
                    <img src={typeof item.poster_path === 'string' && item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/default-poster.svg'}
                        alt={title} loading="lazy" width="342" height="513"
                        onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/default-poster.svg'; }} />
                    {progress && progress.progressPercentage > 0 && <>
                        {type === 'tv' && <span className="episode-badge">S{progress.lastWatchedSeason} E{progress.lastWatchedEpisode}</span>}
                        <div className="progress-bar-container" role="progressbar" aria-label={`${title} watch progress`}
                            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.progressPercentage)}>
                            <div className="progress-bar" style={{ transform: `scaleX(${progress.progressPercentage / 100})` }} />
                        </div>
                    </>}
                </div>
                <div className="movie-details">
                    <h3>{title}</h3>
                    <p className="movie-rating">Rating: {Number.isFinite(item.vote_average) && item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A'}</p>
                    <span className="star-rating" aria-hidden="true">{Array.from({ length: 5 }, (_, index) =>
                        <span key={index} className={`star ${index < Math.round((item.vote_average || 0) / 2) ? 'filled' : ''}`}>★</span>)}</span>
                </div>
            </button>
            {children}
        </article>
    );
}
