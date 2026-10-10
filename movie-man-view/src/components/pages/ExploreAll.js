import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import NavBar from '../NavBar';
import Carousel from '../carosel/Carosel';
import GenreCarousel from '../carosel/GenreCarousel';
import useFetchItems from '../hooks/useFetchItems';
import MediaCard from '../MediaCard';
import MediaDetails from '../MediaDetails';
import HistorySection from '../HistorySection';
import ResultsStatus from '../ResultsStatus';
import { getWatchlist, toggleWatchlist, LIBRARY_EVENT } from '../../utils/mediaLibrary';
import '../css/MoviesList.css';

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
            <p>{watchlistOnly ? 'The ones you’re saving for later.' : searchOnly ? 'Movies and TV shows, all in one place.' : 'A little inspiration for your next watch.'}</p>
        </div></div>
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
        </> : <>
            <Carousel onSelect={select} />
            <HistorySection onSelect={select} />
            <GenreCarousel genreId={28} heading="Action Movies" onSelect={select} />
            <GenreCarousel genreId={35} heading="Comedy Movies" onSelect={select} />
        </>}
        <MediaDetails selection={selection} onSelect={select} onClose={() => setSelection(null)} />
    </div>;
}
