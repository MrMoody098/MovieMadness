import React, { useState, useEffect } from 'react';
import NavBar from '../NavBar';
import '../css/MoviesList.css';
import useFetchItems from '../hooks/useFetchItems';
import MediaCard from '../MediaCard';
import MediaDetails from '../MediaDetails';
import HistorySection from '../HistorySection';
import ResultsStatus from '../ResultsStatus';
import { LIBRARY_EVENT, getHistoryIds } from '../../utils/mediaLibrary';

const MoviesList = ({ type = 'movie' }) => {
    const results = useFetchItems(type);
    const [lastWatched, setLastWatched] = useState(() => getHistoryIds('movie')[0]);
    useEffect(() => {
        const refresh = () => setLastWatched(getHistoryIds('movie')[0]);
        window.addEventListener(LIBRARY_EVENT, refresh);
        window.addEventListener('storage', refresh);
        return () => { window.removeEventListener(LIBRARY_EVENT, refresh); window.removeEventListener('storage', refresh); };
    }, []);
    const recommendations = useFetchItems('movie', {
        endpoint: `movie/${lastWatched}/recommendations`, enabled: type === 'movie' && Boolean(lastWatched)
    });
    const [selection, setSelection] = useState(null);
    const select = (item, mediaType) => setSelection({ item, type: mediaType });
    return <div>
        <NavBar isModalOpen={Boolean(selection)} />
        <HistorySection type={type} onSelect={select} />
        {type === 'movie' && lastWatched && <section>
            <h2>Recommended Movies</h2>
            <div className="carousel">{recommendations.items.map(item =>
                <MediaCard key={item.id} item={item} type="movie" onSelect={select} />)}</div>
            <ResultsStatus {...recommendations} empty={!recommendations.items.length} emptyMessage="No recommendations found for your latest watch." />
        </section>}
        <h1>{type === 'tv' ? 'Trending TV Shows' : 'Trending Movies'}</h1>
        <div className="movies-container">{results.items.map(item =>
            <MediaCard key={item.id} item={item} type={type} onSelect={select} />)}</div>
        <ResultsStatus autoLoad {...results} empty={!results.items.length} />
        <MediaDetails selection={selection} onSelect={select} onClose={() => setSelection(null)} />
    </div>;
};
export default MoviesList;
