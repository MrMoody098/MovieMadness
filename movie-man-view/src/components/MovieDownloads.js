import React, { useEffect, useState } from 'react';

const BRIDGE = '/local-downloads';

function sizeLabel(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return 'Size unknown';
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default function MovieDownloads({ title, searchQuery, category = 'movies' }) {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState('');
    const [query, setQuery] = useState(searchQuery);
    const [draftQuery, setDraftQuery] = useState(searchQuery);

    useEffect(() => {
        setQuery(searchQuery);
        setDraftQuery(searchQuery);
        setOpen(false);
        setResults([]);
        setStatus('');
        setError('');
    }, [searchQuery]);

    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        setBusy(true);
        setError('');
        setStatus('Searching Torlink…');
        fetch(`${BRIDGE}/search?query=${encodeURIComponent(query)}&category=${category}`, { signal: controller.signal })
            .then(async response => {
                const data = await response.json().catch(() => null);
                if (!response.ok || !Array.isArray(data?.results)) throw new Error(data?.error || 'Downloads are unavailable. Restart the site on your computer.');
                return data;
            })
            .then(data => { setResults(data.results); setStatus(data.results.length ? '' : 'No downloads found. Try a different search term.'); })
            .catch(failure => {
                if (controller.signal.aborted) return;
                setError(failure instanceof TypeError ? 'Downloads are offline. Restart the site on your computer.' : failure.message);
                setStatus('');
            })
            .finally(() => { if (!controller.signal.aborted) setBusy(false); });
        return () => controller.abort();
    }, [open, query, category]);

    async function download(result) {
        setSelected(result.infoHash);
        setError('');
        setStatus('Starting download…');
        try {
            const response = await fetch(`${BRIDGE}/download`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ magnet: result.magnet })
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.ok) throw new Error(data?.error || 'Download could not start.');
            setStatus(data.status === 'duplicate' || data.outcome === 'duplicate'
                ? 'Already in your Torlink downloads.' : 'Download added to Torlink on the computer running MovieMadness.');
        } catch (failure) {
            setError(failure instanceof TypeError ? 'Downloads are offline. Restart the site on your computer.' : failure.message);
            setStatus('');
        } finally { setSelected(''); }
    }

    return <section className="movie-downloads" aria-label={`${title} downloads`}>
        <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open}>
            {open ? 'Hide downloads' : 'Find downloads'}
        </button>
        {open && <div className="movie-downloads-panel">
            <p>Choose a result to download on the computer running MovieMadness.</p>
            <form onSubmit={event => { event.preventDefault(); if (draftQuery.trim()) setQuery(draftQuery.trim()); }}>
                <label>Search term<input value={draftQuery} onChange={event => setDraftQuery(event.target.value)} /></label>
                <button type="submit" disabled={!draftQuery.trim() || busy}>Search</button>
            </form>
            {busy && <p role="status">Searching Torlink…</p>}
            {error && <p role="alert">{error}</p>}
            {!busy && status && <p role="status">{status}</p>}
            <ul>{results.map(result => <li key={result.infoHash}>
                <div><strong>{result.name}</strong><small>{sizeLabel(result.sizeBytes)} · {result.seeders ?? 0} seeders · {result.source}</small></div>
                <button type="button" disabled={Boolean(selected)} onClick={() => download(result)}>
                    {selected === result.infoHash ? 'Adding…' : 'Download'}
                </button>
            </li>)}</ul>
        </div>}
    </section>;
}
