import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MoviesList from './components/pages/MoviesList';
import TVShowsList from './components/pages/TVShowsList';
import Filter from './components/pages/Filter';
import ExploreAll from './components/pages/ExploreAll';
import Modal from 'react-modal';
import { STORAGE_ERROR_EVENT } from './utils/mediaLibrary';

if (document.getElementById('root')) Modal.setAppElement('#root');

function App() {
    const [storageError, setStorageError] = useState('');
    useEffect(() => {
        const report = event => setStorageError(event.detail);
        window.addEventListener(STORAGE_ERROR_EVENT, report);
        return () => window.removeEventListener(STORAGE_ERROR_EVENT, report);
    }, []);
    return <Router>
        <div className="App">
            <a className="skip-link" href="#main-content">Skip to content</a>
            {storageError && <div className="storage-error" role="alert">{storageError} <button onClick={() => setStorageError('')}>Dismiss</button></div>}
            <main id="main-content" tabIndex={-1}>
                <Routes>
                    <Route path="/" element={<MoviesList />} />
                    <Route path="/explore" element={<ExploreAll />} />
                    <Route path="/search" element={<ExploreAll key="search" searchOnly />} />
                    <Route path="/watchlist" element={<ExploreAll key="watchlist" watchlistOnly />} />
                    <Route path="/movies" element={<MoviesList />} />
                    <Route path="/tv-shows" element={<TVShowsList />} />
                    <Route path="/filter" element={<Filter />} />
                    <Route path="*" element={<div><h1>Page not found</h1><Link to="/">Back to movies</Link></div>} />
                </Routes>
            </main>
        </div>
    </Router>;
}
export default App;
