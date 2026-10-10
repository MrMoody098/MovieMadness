import React, { useState } from 'react';
import '../css/MoviesList.css';
import '../css/MovieModal.css';
import useFetchItems from '../hooks/useFetchItems';
import MediaCard from '../MediaCard';
import ResultsStatus from '../ResultsStatus';
import WatchlistButton from '../WatchlistButton';
import ProgressControls from '../ProgressControls';

export default function MovieModal({ movie, onMovieSelect }) {
    const [playerLoaded, setPlayerLoaded] = useState(false);
    const results = useFetchItems('movie', { endpoint: `movie/${movie.id}/recommendations` });
    return <div className="movie-details-container">
        <h2>{movie.title} — Rating {Number.isFinite(movie.vote_average) && movie.vote_average > 0 ? movie.vote_average.toFixed(1) : 'N/A'}</h2>
        <p className="movie-description">{typeof movie.overview === 'string' && movie.overview ? movie.overview : 'No description available.'}</p>
        <div className="detail-actions"><WatchlistButton item={movie} type="movie" /></div>
        {!playerLoaded && <p role="status">Loading player…</p>}
        <div className="player-frame"><iframe src={`https://vidsrc.to/embed/movie/${movie.id}`} title={`Watch ${movie.title}`}
            allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen onLoad={() => setPlayerLoaded(true)} /></div>
        <ProgressControls id={movie.id} type="movie" runtime={movie.runtime} />
        <section className="recommended-movies">
            <h3>Recommended Movies</h3>
            <div className="movies-container">{results.items.map(item => <MediaCard key={item.id} item={item} type="movie" onSelect={onMovieSelect} />)}</div>
            <ResultsStatus {...results} empty={!results.items.length} emptyMessage="No recommendations found for this title." />
        </section>
    </div>;
}
