import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import NavBar from '../NavBar';
import useFetchItems from '../hooks/useFetchItems';
import MediaCard from '../MediaCard';
import MediaDetails from '../MediaDetails';
import ResultsStatus from '../ResultsStatus';
import { getWatchlist, toggleWatchlist, LIBRARY_EVENT } from '../../utils/mediaLibrary';
import { fetchTmdb, isCanceled } from '../../utils/tmdb';
import Icon from '../Icon';
import '../css/MoviesList.css';
import '../css/Explore.css';

function ExploreCatalog({ onSelect }) {
    const [params, setParams] = useSearchParams();
    const type = params.get('type') === 'tv' ? 'tv' : 'movie';
    const collection = ['top_rated', 'new'].includes(params.get('collection')) ? params.get('collection') : 'popular';
    const genre = /^\d+$/.test(params.get('genre') || '') ? params.get('genre') : '';
    const [genres, setGenres] = useState({ type: '', items: [], error: false });
    const [genreAttempt, setGenreAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        fetchTmdb(`genre/${type}/list`, {}, controller.signal).then(data => {
            if (controller.signal.aborted) return;
            if (!Array.isArray(data.genres)) throw new Error('Invalid genres');
            setGenres({ type, items: data.genres.filter(item => Number.isInteger(item?.id) && typeof item.name === 'string'), error: false });
        }).catch(error => {
            if (!isCanceled(error, controller.signal)) setGenres({ type, items: [], error: true });
        });
        return () => controller.abort();
    }, [type, genreAttempt]);
    const today = new Date().toISOString().slice(0, 10);
    const filters = {
        ...(genre ? { with_genres: genre } : {}),
        sort_by: collection === 'top_rated' ? 'vote_average.desc' : collection === 'new'
            ? type === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc' : 'popularity.desc',
        ...(collection === 'top_rated' ? { 'vote_count.gte': 300 } : {}),
        ...(collection === 'new' ? { [type === 'tv' ? 'first_air_date.lte' : 'primary_release_date.lte']: today,
            'vote_count.gte': 20 } : {})
    };
    const results = useFetchItems(type, { endpoint: `discover/${type}`, params: filters });
    const update = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value); else next.delete(key);
        if (key === 'type') next.delete('genre');
        setParams(next);
    };
    const activeGenres = genres.type === type ? genres.items : [];
    const genreName = activeGenres.find(item => String(item.id) === genre)?.name;
    const collectionName = collection === 'top_rated' ? 'Top rated' : collection === 'new' ? 'New releases' : 'Popular';
    return <>
        <div className="explore-toolbar">
            <nav className="browse-tabs" aria-label="Explore media type">
                <button aria-pressed={type === 'movie'} onClick={() => update('type', 'movie')}>Movies</button>
                <button aria-pressed={type === 'tv'} onClick={() => update('type', 'tv')}>TV shows</button>
            </nav>
            <label className="explore-sort">Collection
                <select value={collection} onChange={event => update('collection', event.target.value)}>
                    <option value="popular">Popular now</option><option value="top_rated">Top rated</option><option value="new">New releases</option>
                </select>
            </label>
        </div>
        <nav className="genre-picker" aria-label="Explore genres">
            <button aria-pressed={!genre} onClick={() => update('genre', '')}>All genres</button>
            {activeGenres.map(item => <button key={item.id} aria-pressed={genre === String(item.id)}
                onClick={() => update('genre', String(item.id))}>{item.name}</button>)}
        </nav>
        {genres.type === type && genres.error && <p className="genre-error" role="status">Genres couldn’t be loaded.
            <button className="text-button" onClick={() => setGenreAttempt(value => value + 1)}>Retry genres</button></p>}
        <div className="explore-results-heading"><h2>{collectionName}{genreName ? ` · ${genreName}` : ''}</h2>
            <span>{type === 'tv' ? 'TV shows' : 'Movies'}</span></div>
        <div className="movies-container" aria-label="Explore results">{results.items.map(item =>
            <MediaCard key={`${type}:${item.id}`} item={item} type={type} onSelect={onSelect} />)}</div>
        <ResultsStatus autoLoad {...results} empty={!results.items.length} />
    </>;
}

export default function ExploreAll({ searchOnly = false, watchlistOnly = false }) {
    const [params] = useSearchParams();
    const query = params.get('q') || '';
    const results = useFetchItems('multi', { query, enabled: searchOnly && Boolean(query.trim()) });
    const [selection, setSelection] = useState(null);
    const [watchlist, setWatchlist] = useState(getWatchlist);
    const select = (item, type) => setSelection({ item, type });
    useEffect(() => {
        const refresh = () => setWatchlist(getWatchlist());
        window.addEventListener(LIBRARY_EVENT, refresh);
        window.addEventListener('storage', refresh);
        return () => { window.removeEventListener(LIBRARY_EVENT, refresh); window.removeEventListener('storage', refresh); };
    }, []);
    return <div className="catalog-page">
        <NavBar isModalOpen={Boolean(selection)} />
        <div className="page-heading"><div>
            <h1>{watchlistOnly ? 'Your watchlist' : searchOnly ? query.trim() ? `Results for “${query.trim()}”` : 'Search' : 'Explore'}</h1>
            <p>{watchlistOnly ? 'The ones you’re saving for later.' : searchOnly ? 'Movies and TV shows, all in one place.' : 'Find your next watch. Follow a genre, try something new.'}</p>
        </div>{!watchlistOnly && !searchOnly && <Link className="button-link secondary" to="/filter"><Icon name="filters" size={18} />Advanced filters</Link>}</div>
        {watchlistOnly ? <>
            {!watchlist.length && <div className="empty-state" role="status"><h2>A good watch starts with a good list.</h2>
                <p>Save titles from their details to build your watchlist.</p><Link className="button-link" to="/movies">Browse movies</Link></div>}
            <div className="movies-container">{watchlist.map(item =>
                <MediaCard key={`${item.media_type}:${item.id}`} item={item} type={item.media_type} onSelect={select}>
                    <button className="text-button watchlist-remove" onClick={() => toggleWatchlist(item, item.media_type)} aria-label={`Remove ${item.title || item.name} from watchlist`}>Remove from watchlist</button>
                </MediaCard>)}</div>
        </> : searchOnly ? <>
            <div className="movies-container">{results.items.map(item =>
                <MediaCard key={`${item.media_type}:${item.id}`} item={item} type={item.media_type} onSelect={select} />)}</div>
            <ResultsStatus autoLoad {...results} empty={!results.items.length}
                emptyMessage={query.trim() ? 'No matching movies or TV shows. Try another title.' : 'Use the search above to find movies and TV shows.'} />
        </> : <ExploreCatalog onSelect={select} />}
        <MediaDetails selection={selection} onSelect={select} onClose={() => setSelection(null)} />
    </div>;
}
