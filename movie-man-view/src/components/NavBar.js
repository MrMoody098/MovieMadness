import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import '../App.css';
import { fetchTmdb, isCanceled } from '../utils/tmdb';

const NavBar = ({ isModalOpen = false }) => {
    const [params] = useSearchParams();
    const [query, setQuery] = useState(params.get('q') || '');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionState, setSuggestionState] = useState('');
    const [focused, setFocused] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const formRef = useRef(null);
    const suggestionsRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const urlQuery = params.get('q') || '';
    useEffect(() => { setQuery(urlQuery); }, [urlQuery]);
    useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname, location.search]);
    useEffect(() => {
        const controller = new AbortController();
        setSuggestions([]);
        setActiveSuggestion(-1);
        setSuggestionState('');
        if (!focused || query.trim().length < 2) return () => controller.abort();
        setSuggestionState('loading');
        const timer = setTimeout(() => {
            fetchTmdb('search/multi', { query: query.trim(), include_adult: false }, controller.signal)
                .then(data => {
                    if (controller.signal.aborted) return;
                    const items = Array.isArray(data.results) ? data.results.filter(item => item
                        && Number.isInteger(item.id) && ['movie', 'tv'].includes(item.media_type)
                        && typeof (item.title || item.name) === 'string').slice(0, 6) : [];
                    setSuggestions(items);
                    setSuggestionState(items.length ? 'ready' : 'empty');
                })
                .catch(error => {
                    if (!isCanceled(error, controller.signal)) setSuggestionState('error');
                });
        }, 300);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query, focused]);
    useEffect(() => {
        if (focused && activeSuggestion >= 0) suggestionsRef.current?.children[activeSuggestion]?.scrollIntoView({ block: 'nearest' });
    }, [activeSuggestion, focused]);
    const search = value => {
        setFocused(false);
        setActiveSuggestion(-1);
        navigate(value.trim() ? `/search?q=${encodeURIComponent(value.trim())}` : '/search');
    };
    const handleSearch = event => {
        event.preventDefault();
        const suggestion = suggestions[activeSuggestion];
        search(suggestion ? suggestion.title || suggestion.name : query);
    };
    const showSuggestions = focused && query.trim().length >= 2;
    const handleSearchKey = event => {
        if (event.key === 'Escape') { setFocused(false); setActiveSuggestion(-1); }
        if (!showSuggestions || !suggestions.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveSuggestion(previous => event.key === 'ArrowDown'
                ? (previous + 1) % suggestions.length : (previous <= 0 ? suggestions.length : previous) - 1);
        }
    };
    return <nav className="navbar visible" aria-label="Main navigation" hidden={isModalOpen}>
        <div className="navbar-content">
            <NavLink className="logo" to="/">MovieMan</NavLink>
            <form ref={formRef} className="search-form" role="search" onSubmit={handleSearch}
                onBlur={event => { if (!formRef.current?.contains(event.relatedTarget)) setFocused(false); }}>
                <label className="visually-hidden" htmlFor="site-search">Search movies and TV shows</label>
                <input id="site-search" type="search" className="search-bar" placeholder="Search movies and TV…"
                    role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions}
                    aria-controls="search-suggestions" aria-activedescendant={showSuggestions && activeSuggestion >= 0 ? `search-suggestion-${activeSuggestion}` : undefined}
                    autoComplete="off" value={query} onFocus={() => setFocused(true)} onKeyDown={handleSearchKey}
                    onChange={event => { setQuery(event.target.value); setFocused(true); }} />
                <button type="submit">Search</button>
                {showSuggestions && <div className="search-suggestions">
                    <ul ref={suggestionsRef} id="search-suggestions" role="listbox" aria-label="Suggested movies and TV shows">
                        {suggestions.map((item, index) => <li key={`${item.media_type}:${item.id}`} role="option"
                            id={`search-suggestion-${index}`} aria-selected={activeSuggestion === index}>
                            <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()}
                                onClick={() => search(item.title || item.name)}>
                                <span>{item.title || item.name}</span>
                                <small>{item.media_type === 'tv' ? 'TV show' : 'Movie'}{typeof (item.release_date || item.first_air_date) === 'string' && (item.release_date || item.first_air_date) ? ` · ${(item.release_date || item.first_air_date).slice(0, 4)}` : ''}</small>
                            </button>
                        </li>)}
                    </ul>
                    {suggestionState === 'loading' && <p role="status">Finding suggestions…</p>}
                    {suggestionState === 'empty' && <p role="status">No suggestions yet. Press Enter to search.</p>}
                    {suggestionState === 'error' && <p role="status">Suggestions unavailable. You can still submit your search.</p>}
                </div>}
            </form>
            <button className="mobile-menu-button" onClick={() => setIsMobileMenuOpen(open => !open)}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen} aria-controls="navigation-links">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
            <div id="navigation-links" className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
                <NavLink to="/explore">Explore</NavLink><NavLink to="/movies">Movies</NavLink>
                <NavLink to="/tv-shows">TV Shows</NavLink><NavLink to="/filter">Filter</NavLink>
                <NavLink to="/watchlist">Watchlist</NavLink>
            </div>
        </div>
    </nav>;
};
export default NavBar;
