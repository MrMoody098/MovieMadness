import React, { useState, useEffect } from 'react';
import { LIBRARY_EVENT, getHistoryIds, readStored, removeHistory } from '../utils/mediaLibrary';
import { getShowProgress, getMovieProgress } from '../utils/watchProgress';
import { fetchTmdb } from '../utils/tmdb';
import MediaCard from './MediaCard';

export default function HistorySection({ type, onSelect }) {
    const [version, setVersion] = useState(0);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteMode, setDeleteMode] = useState(false);
    const [selected, setSelected] = useState([]);
    const [, setStorageVersion] = useState(0);
    const ids = JSON.stringify(type ? getHistoryIds(type).map(id => ({ id, type })) :
        [...getHistoryIds('movie').map(id => ({ id, type: 'movie' })), ...getHistoryIds('tv').map(id => ({ id, type: 'tv' }))]);
    useEffect(() => {
        const refresh = () => setStorageVersion(value => value + 1);
        window.addEventListener(LIBRARY_EVENT, refresh);
        window.addEventListener('storage', refresh);
        return () => { window.removeEventListener(LIBRARY_EVENT, refresh); window.removeEventListener('storage', refresh); };
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        const entries = JSON.parse(ids);
        setLoading(true);
        setError('');
        Promise.allSettled(entries.map(entry => fetchTmdb(`${entry.type}/${entry.id}`, {}, controller.signal)
            .then(item => {
                if (!Number.isInteger(item.id) || typeof (item.title || item.name) !== 'string') throw new Error('Invalid title');
                return { ...item, media_type: entry.type };
            })))
            .then(results => {
                if (controller.signal.aborted) return;
                setItems(results.filter(result => result.status === 'fulfilled').map(result => result.value));
                if (results.some(result => result.status === 'rejected')) setError('Some watched titles could not be loaded.');
                setLoading(false);
            });
        return () => controller.abort();
    }, [ids, version]);
    const storedDates = readStored('viewingDates', {});
    const dates = storedDates && typeof storedDates === 'object' ? storedDates : {};
    const sortedItems = [...items].sort((a, b) => (Date.parse(dates[`${b.media_type}:${b.id}`]) || 0)
        - (Date.parse(dates[`${a.media_type}:${a.id}`]) || 0));
    const continuing = sortedItems.filter(item => {
        const progress = item.media_type === 'tv' ? getShowProgress(item.id) : getMovieProgress(item.id);
        return progress && (progress.watchTime > 0 || progress.status === 'watching') && progress.progressPercentage < 95;
    });
    const select = (item, mediaType) => {
        if (!deleteMode) { onSelect(item, mediaType); return; }
        const key = `${mediaType}:${item.id}`;
        setSelected(previous => previous.includes(key) ? previous.filter(value => value !== key) : [...previous, key]);
    };
    const remove = () => {
        for (const mediaType of ['movie', 'tv']) removeHistory(mediaType, selected.filter(key => key.startsWith(`${mediaType}:`)).map(key => Number(key.split(':')[1])));
        setSelected([]);
        setDeleteMode(false);
    };
    return <section className="recently-watched">
        {continuing.length > 0 && <><h2>Continue Watching</h2><div className="carousel">{continuing.map(item =>
            <MediaCard key={`${item.media_type}:${item.id}`} item={item} type={item.media_type} onSelect={onSelect} />)}</div></>}
        <h2>Recently Watched{type === 'tv' ? ' TV Shows' : type === 'movie' ? ' Movies' : ''}</h2>
        {loading && <p role="status">Loading viewing history…</p>}
        {error && <div role="alert"><p>{error}</p><button onClick={() => setVersion(value => value + 1)}>Retry history</button></div>}
        {!loading && !error && sortedItems.length === 0 && <p>Mark a title as watching or watched to add it here.</p>}
        {sortedItems.length > 0 && <>
            <button onClick={() => { setDeleteMode(value => !value); setSelected([]); }}>{deleteMode ? 'Cancel' : 'Remove from history'}</button>
            {deleteMode && <><button onClick={() => setSelected(selected.length === sortedItems.length ? [] : sortedItems.map(item => `${item.media_type}:${item.id}`))}>
                {selected.length === sortedItems.length ? 'Deselect all' : 'Select all'}</button>
                <button onClick={remove} disabled={!selected.length}>Remove selected</button></>}
            <div className="carousel">{sortedItems.map(item => <MediaCard key={`${item.media_type}:${item.id}`} item={item}
                type={item.media_type} onSelect={select} selectionMode={deleteMode} selected={selected.includes(`${item.media_type}:${item.id}`)} />)}</div>
        </>}
    </section>;
}
