import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NavBar from '../NavBar';
import MediaCard from '../MediaCard';
import MediaDetails from '../MediaDetails';
import ResultsStatus from '../ResultsStatus';
import useFetchItems from '../hooks/useFetchItems';
import { fetchTmdb, isCanceled } from '../../utils/tmdb';
import '../css/Filter.css';

function numericParam(params, key, fallback, min, max) {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

export default function Filter() {
    const [params, setParams] = useSearchParams();
    const type = params.get('type') === 'tv' ? 'tv' : 'movie';
    const genre = params.get('genre') || '';
    const language = params.get('language') || '';
    const sortOptions = ['vote_average.desc', 'popularity.desc', type === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc'];
    const sort = sortOptions.includes(params.get('sort')) ? params.get('sort') : sortOptions[0];
    const minVotes = numericParam(params, 'votes', 200, 0, 1000000);
    const minRating = numericParam(params, 'minRating', 0, 0, 10);
    const maxRating = numericParam(params, 'maxRating', 10, 0, 10);
    const minLength = numericParam(params, 'minLength', 0, 0, 300);
    const maxLength = numericParam(params, 'maxLength', 300, 0, 300);
    const year = numericParam(params, 'year', 0, 0, new Date().getFullYear() + 5);
    const valid = minRating <= maxRating && minLength <= maxLength;
    const results = useFetchItems(type, { endpoint: `discover/${type}`, enabled: valid, params: {
        sort_by: sort, 'vote_count.gte': minVotes, 'vote_average.gte': minRating,
        'vote_average.lte': maxRating, ...(genre ? { with_genres: genre } : {}),
        ...(language ? { with_original_language: language } : {}),
        ...(year ? { [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']: year } : {}),
        ...(type === 'movie' ? { 'with_runtime.gte': minLength, 'with_runtime.lte': maxLength } : {})
    } });
    const [genres, setGenres] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [metadataError, setMetadataError] = useState('');
    const [metadataAttempt, setMetadataAttempt] = useState(0);
    const [selection, setSelection] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        setGenres([]);
        setMetadataError('');
        Promise.all([fetchTmdb(`genre/${type}/list`, {}, controller.signal), fetchTmdb('configuration/languages', {}, controller.signal)])
            .then(([genreData, languageData]) => {
                if (controller.signal.aborted) return;
                setGenres(Array.isArray(genreData.genres) ? genreData.genres : []);
                setLanguages(Array.isArray(languageData) ? [...languageData].sort((a, b) => a.english_name.localeCompare(b.english_name)) : []);
            })
            .catch(error => { if (!isCanceled(error, controller.signal)) setMetadataError('Filter choices could not be loaded.'); });
        return () => controller.abort();
    }, [type, metadataAttempt]);
    const update = (key, value) => {
        const next = new URLSearchParams(params);
        const numeric = ['year', 'votes', 'minRating', 'maxRating', 'minLength', 'maxLength'].includes(key);
        if (value === '' && !numeric) next.delete(key); else next.set(key, String(value));
        if (key === 'type') { next.delete('genre'); next.delete('sort'); }
        setParams(next, { replace: numeric });
    };
    const select = (item, mediaType) => setSelection({ item, type: mediaType });
    return <div className="filter-container">
        <NavBar isModalOpen={Boolean(selection)} />
        <div className="page-heading"><div><h1>Find your next watch</h1><p>Narrow it down by genre, year, and rating.</p></div>
            <button className="text-button" onClick={() => setParams({})}>Reset filters</button>
        </div>
        <div className="filter-header">
            <label>Title type<select value={type} onChange={event => update('type', event.target.value)}><option value="movie">Movies</option><option value="tv">TV Shows</option></select></label>
            <label>Genre<select value={genre} onChange={event => update('genre', event.target.value)}><option value="">All genres</option>{genres.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Language<select value={language} onChange={event => update('language', event.target.value)}><option value="">All languages</option>{languages.map(item => <option key={item.iso_639_1} value={item.iso_639_1}>{item.english_name}</option>)}</select></label>
            <label>Sort by<select value={sort} onChange={event => update('sort', event.target.value)}><option value={sortOptions[0]}>Highest rated</option><option value={sortOptions[1]}>Most popular</option><option value={sortOptions[2]}>Newest releases</option></select></label>
            <label>Release year<input type="number" min="1870" max={new Date().getFullYear() + 5} value={params.get('year') ?? (year || '')} placeholder="Any year" onChange={event => update('year', event.target.value)} /></label>
            <label>Minimum rating<input type="number" min="0" max="10" step="0.1" value={params.get('minRating') ?? minRating} onChange={event => update('minRating', event.target.value)} /></label>
        </div>
        <details className="advanced-filters">
            <summary>More filters</summary>
            <div className="filter-header">
                <label>Minimum votes<input type="number" min="0" max="1000000" value={params.get('votes') ?? minVotes} onChange={event => update('votes', event.target.value)} /></label>
                <label>Maximum rating<input type="number" min="0" max="10" step="0.1" value={params.get('maxRating') ?? maxRating} onChange={event => update('maxRating', event.target.value)} /></label>
                {type === 'movie' && <>
                    <label>Minimum runtime (minutes)<input type="number" min="0" max="300" value={params.get('minLength') ?? minLength} onChange={event => update('minLength', event.target.value)} /></label>
                    <label>Maximum runtime (minutes)<input type="number" min="0" max="300" value={params.get('maxLength') ?? maxLength} onChange={event => update('maxLength', event.target.value)} /></label>
                </>}
            </div>
        </details>
        {!valid && <p role="alert">Minimum rating and runtime must not exceed their maximum values.</p>}
        {metadataError && <div role="alert"><p>{metadataError}</p><button onClick={() => setMetadataAttempt(value => value + 1)}>Retry filter choices</button></div>}
        <div className="movies-container">{results.items.map(item => <MediaCard key={item.id} item={item} type={type} onSelect={select} />)}</div>
        {valid && <ResultsStatus autoLoad {...results} empty={!results.items.length} />}
        <MediaDetails selection={selection} onSelect={select} onClose={() => setSelection(null)} />
    </div>;
}
