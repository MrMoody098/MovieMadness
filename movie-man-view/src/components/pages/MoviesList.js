import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../Icon';
import Carousel from '../carosel/Carosel';
import NavBar from '../NavBar';
import '../css/MoviesList.css';
import useFetchItems from '../hooks/useFetchItems';
import MediaCard from '../MediaCard';
import MediaDetails from '../MediaDetails';
import HistorySection from '../HistorySection';
import ResultsStatus from '../ResultsStatus';
import { LIBRARY_EVENT, getHistoryIds } from '../../utils/mediaLibrary';

const MoviesList = ({ type = 'movie' }) => {
    const [params, setParams] = useSearchParams();
    const views = [{ value: 'trending', label: 'Trending' }, { value: 'popular', label: 'Popular' }, { value: 'top_rated', label: 'Top rated' }];
    const view = views.some(item => item.value === params.get('view')) ? params.get('view') : 'trending';
    const results = useFetchItems(type, { endpoint: view === 'trending' ? `trending/${type}/day` : `${type}/${view}` });
    const [lastWatched, setLastWatched] = useState(() => getHistoryIds('movie')[0]);
    useEffect(() => {
        const refresh = () => setLastWatched(getHistoryIds('movie')[0]);
        window.addEventListener(LIBRARY_EVENT, refresh);
        window.addEventListener('storage', refresh);
        return () => { window.removeEventListener(LIBRARY_EVENT, refresh); window.removeEventListener('storage', refresh); };
    }, []);
    const [selection, setSelection] = useState(null);
    const select = (item, mediaType) => setSelection({ item, type: mediaType });
    return <div className="catalog-page">
        <NavBar isModalOpen={Boolean(selection)} />
        <div className="page-heading">
            <div><h1>{type === 'tv' ? 'TV shows' : 'Movies'}</h1><p>{type === 'tv' ? 'One more episode starts here.' : 'Something worth watching.'}</p></div>
            <Link className="button-link secondary" to={`/filter?type=${type}`}><Icon name="filters" size={18} />Filters</Link>
        </div>
        <HistorySection type={type} onSelect={select} />
        {type === 'movie' && lastWatched && <Carousel heading="Recommended for you"
            endpoint={`movie/${lastWatched}/recommendations`} onSelect={select} />}
        <div className="browse-bar">
            <nav className="browse-tabs" aria-label={`${type === 'tv' ? 'TV show' : 'Movie'} collections`}>
                {views.map(item => <button key={item.value} aria-pressed={view === item.value}
                    onClick={() => { const next = new URLSearchParams(params); next.set('view', item.value); setParams(next); }}>{item.label}</button>)}
            </nav>
            <span className="browse-note">{view === 'trending' ? 'Updated daily' : view === 'popular' ? 'Popular right now' : 'Audience favourites'}</span>
        </div>
        <div className="movies-container" aria-label={type === 'tv' ? 'TV shows' : 'Movies'}>{results.items.map(item =>
            <MediaCard key={item.id} item={item} type={type} onSelect={select} />)}</div>
        <ResultsStatus autoLoad {...results} empty={!results.items.length} />
        <MediaDetails selection={selection} onSelect={select} onClose={() => setSelection(null)} />
    </div>;
};
export default MoviesList;
