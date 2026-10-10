import React, { useState } from 'react';
import '../css/MoviesList.css';
import '../css/MovieModal.css';
import Carousel from '../carosel/Carosel';
import Icon from '../Icon';
import WatchlistButton from '../WatchlistButton';
import ProgressControls from '../ProgressControls';

export default function MovieModal({ movie, onMovieSelect }) {
    const [playerLoaded, setPlayerLoaded] = useState(false);
    return <div className="movie-details-container">
        <header className="detail-heading"><h2>{movie.title}</h2>
            <div className="detail-meta"><span>Movie</span>{movie.release_date && <span>{movie.release_date.slice(0, 4)}</span>}
                {Number.isFinite(movie.vote_average) && movie.vote_average > 0 && <span className="rating"><Icon name="star" size={14} />{movie.vote_average.toFixed(1)}</span>}
            </div>
        </header>
        <p className="movie-description">{typeof movie.overview === 'string' && movie.overview ? movie.overview : 'No description available.'}</p>
        <div className="detail-actions"><WatchlistButton item={movie} type="movie" /></div>
        {!playerLoaded && <p role="status">Loading player…</p>}
        <div className="player-frame"><iframe src={`https://vidsrc.to/embed/movie/${movie.id}`} title={`Watch ${movie.title}`}
            allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen onLoad={() => setPlayerLoaded(true)} /></div>
        <ProgressControls id={movie.id} type="movie" runtime={movie.runtime} />
        <Carousel heading="More like this" endpoint={`movie/${movie.id}/recommendations`} onSelect={onMovieSelect} />
    </div>;
}
