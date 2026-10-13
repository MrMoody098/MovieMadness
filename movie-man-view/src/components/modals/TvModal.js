import React, { useEffect, useState } from 'react';
import '../css/TvModal.css';
import '../css/MoviesList.css';
import '../css/MovieModal.css';
import { fetchTmdb, isCanceled } from '../../utils/tmdb';
import WatchlistButton from '../WatchlistButton';
import MarkWatchedButton from '../MarkWatchedButton';
import Icon from '../Icon';

export default function TvModal({ isOpen, tvShow }) {
    const [selection, setSelection] = useState({ season: 1, episode: 1 });
    const [totalSeasons, setTotalSeasons] = useState(0);
    const [episodes, setEpisodes] = useState({ season: 0, items: [] });
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [playerLoaded, setPlayerLoaded] = useState(false);
    const id = tvShow?.id;
    useEffect(() => {
        if (!id || !isOpen) return;
        const controller = new AbortController();
        setError('');
        fetchTmdb(`tv/${id}`, {}, controller.signal).then(data => {
            if (controller.signal.aborted) return;
            if (!Number.isInteger(data.number_of_seasons) || data.number_of_seasons < 1) throw new Error('No seasons');
            setTotalSeasons(data.number_of_seasons);
            setSelection(previous => previous.season <= data.number_of_seasons ? previous : { season: 1, episode: 1 });
        }).catch(failure => { if (!isCanceled(failure, controller.signal)) setError('Show details could not be loaded.'); });
        return () => controller.abort();
    }, [id, isOpen, attempt]);
    useEffect(() => {
        if (!id || !isOpen || !totalSeasons || selection.season > totalSeasons) return;
        const controller = new AbortController();
        setError('');
        setEpisodes({ season: 0, items: [] });
        fetchTmdb(`tv/${id}/season/${selection.season}`, {}, controller.signal).then(data => {
            if (controller.signal.aborted) return;
            const items = Array.isArray(data.episodes) ? data.episodes.filter(item => item && Number.isInteger(item.episode_number) && item.episode_number > 0) : [];
            if (!items.length) throw new Error('No episodes');
            setEpisodes({ season: selection.season, items });
            setSelection(previous => items.some(item => item.episode_number === previous.episode)
                ? previous : { ...previous, episode: items[0].episode_number });
        }).catch(failure => { if (!isCanceled(failure, controller.signal)) setError('Episode details could not be loaded.'); });
        return () => controller.abort();
    }, [id, isOpen, selection.season, totalSeasons, attempt]);
    const changeSelection = next => { setSelection(next); setPlayerLoaded(false); };
    if (!tvShow) return null;
    return <div className="movie-details-container">
            <header className="detail-heading"><h2>{tvShow.name}</h2>
                <div className="detail-meta"><span>TV show</span><span>Season {selection.season}, episode {selection.episode}</span>
                    {Number.isFinite(tvShow.vote_average) && tvShow.vote_average > 0 && <span className="rating"><Icon name="star" size={14} />{tvShow.vote_average.toFixed(1)}</span>}
                </div>
            </header>
            <p className="movie-description">{typeof tvShow.overview === 'string' && tvShow.overview ? tvShow.overview : 'No description available.'}</p>
            <div className="detail-actions"><WatchlistButton item={tvShow} type="tv" /><MarkWatchedButton id={id} type="tv" /></div>
            {error && <div role="alert"><p>{error}</p><button onClick={() => setAttempt(value => value + 1)}>Retry show details</button></div>}
            {!totalSeasons && !error && <p role="status">Loading show details…</p>}
            {totalSeasons > 0 && <>
                <div className="controls">
                    <label>Select season<select value={selection.season} onChange={event => changeSelection({ season: Number(event.target.value), episode: 1 })}>
                        {Array.from({ length: totalSeasons }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
                    </select></label>
                    <label>Select episode<select value={selection.episode} disabled={episodes.season !== selection.season}
                        onChange={event => changeSelection({ ...selection, episode: Number(event.target.value) })}>
                        {episodes.season !== selection.season ? <option value={selection.episode}>Loading episodes…</option> : episodes.items.map(item => <option key={item.episode_number} value={item.episode_number}>{item.episode_number}{item.name ? ` — ${item.name}` : ''}</option>)}
                    </select></label>
                </div>
                {!playerLoaded && <p role="status">Loading player…</p>}
                <div className="player-frame"><iframe title={`${tvShow.name} — S${selection.season}E${selection.episode}`}
                    src={`https://vidsrc.to/embed/tv/${id}/${selection.season}/${selection.episode}`}
                    allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen onLoad={() => setPlayerLoaded(true)} /></div>

            </>}
        </div>;
}
