import React, { useState, useEffect } from 'react';
import { LIBRARY_EVENT, getHistoryIds, readStored, removeHistory } from '../utils/mediaLibrary';
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
    if (ids === '[]') return null;
    return <section className="catalog-section">
        <div className="section-heading">
            <h2>Recently watched</h2>
            <div className="section-actions">
                <button className="text-button" onClick={() => { setDeleteMode(value => !value); setSelected([]); }}>
                    {deleteMode ? 'Cancel' : 'Manage'}</button>
            </div>
        </div>
        {loading && <p className="muted" role="status">Loading viewing history…</p>}
        {error && <div role="alert"><p>{error}</p><button onClick={() => setVersion(value => value + 1)}>Retry history</button></div>}
        {deleteMode && <div className="history-actions">
            <button className="secondary" onClick={() => setSelected(selected.length === sortedItems.length ? [] : sortedItems.map(item => `${item.media_type}:${item.id}`))}>
                {selected.length === sortedItems.length ? 'Deselect all' : 'Select all'}</button>
            <button className="secondary" onClick={remove} disabled={!selected.length}>Remove selected{selected.length ? ` (${selected.length})` : ''}</button>
        </div>}
        <div className="carousel">{sortedItems.map(item => <MediaCard key={`${item.media_type}:${item.id}`} item={item}
            type={item.media_type} onSelect={select} selectionMode={deleteMode} selected={selected.includes(`${item.media_type}:${item.id}`)} />)}</div>
    </section>;
}
