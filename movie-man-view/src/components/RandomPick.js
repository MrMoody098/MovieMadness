import React, { useEffect, useRef, useState } from 'react';
import { fetchTmdb, isCanceled } from '../utils/tmdb';
import MediaDetails from './MediaDetails';
import { CHECKED_PLAYER_ORIGIN, hasPlayableMedia } from '../utils/playbackAvailability';

export default function RandomPick() {
    const [selection, setSelection] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const request = useRef(null);
    useEffect(() => () => request.current?.abort(), []);

    const pick = async () => {
        if (request.current) return;
        const controller = new AbortController();
        request.current = controller;
        setLoading(true);
        setError('');
        const type = Math.random() < 0.5 ? 'movie' : 'tv';
        const params = { include_adult: false, sort_by: 'popularity.desc' };
        try {
            const first = await fetchTmdb(`discover/${type}`, { ...params, page: 1 }, controller.signal);
            if (controller.signal.aborted) return;
            // TMDB only allows access to the first 500 pages.
            const pages = Number.isInteger(first.total_pages) ? Math.max(1, Math.min(first.total_pages, 500)) : 1;
            const page = Math.floor(Math.random() * pages) + 1;
            const data = page === 1 ? first : await fetchTmdb(`discover/${type}`, { ...params, page }, controller.signal);
            if (controller.signal.aborted) return;
            const items = Array.isArray(data.results) ? data.results.filter(item => item
                && Number.isInteger(item.id) && item.id > 0 && !item.adult
                && typeof item[type === 'movie' ? 'title' : 'name'] === 'string'
                && item[type === 'movie' ? 'title' : 'name'].trim()) : [];
            if (!items.length) throw new Error('No titles');
            // Try a bounded random sample; never fall back to an unchecked title.
            for (let attempt = 0; attempt < 8 && items.length; attempt += 1) {
                const [item] = items.splice(Math.floor(Math.random() * items.length), 1);
                const available = await hasPlayableMedia(item, type, controller.signal);
                if (controller.signal.aborted) return;
                if (available) {
                    setSelection({ item, type, playerOrigin: CHECKED_PLAYER_ORIGIN });
                    return;
                }
            }
            setError('No playable title found. Please try another pick.');
        } catch (failure) {
            if (!isCanceled(failure, controller.signal)) setError('Could not pick a title. Please try again.');
        } finally {
            if (!controller.signal.aborted) setLoading(false);
            if (request.current === controller) request.current = null;
        }
    };

    return <>
        <div className="random-picker">
            {error && <p role="alert">{error}</p>}
            <button type="button" onClick={pick} disabled={loading} aria-busy={loading}
                title="Pick a random movie or TV show with available media">{loading ? 'Checking media…' : 'Pick something random'}</button>
        </div>
        <MediaDetails selection={selection} onSelect={(item, type) => setSelection({ item, type })}
            onClose={() => setSelection(null)} />
    </>;
}
