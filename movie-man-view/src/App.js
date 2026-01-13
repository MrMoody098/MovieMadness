import './App.css';
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MoviesList from './components/pages/MoviesList';
import TVShowsList from './components/pages/TVShowsList';
import Filter from './components/pages/Filter';
import ExploreAll from './components/pages/ExploreAll';
import AdminPanel from './components/admin/AdminPanel';
import TvModal from './components/modals/TvModal';
import AuthModal from './components/auth/AuthModal';
import Modal from 'react-modal';

// Set the root element for accessibility
Modal.setAppElement('#root');

function App() {
    const [selectedTVShow, setSelectedTVShow] = useState(null);
    const [isTvModalOpen, setIsTvModalOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const openTvModal = (tvShow) => {
        setSelectedTVShow(tvShow);
        setIsTvModalOpen(true);
    };

    const closeTvModal = () => {
        setIsTvModalOpen(false);
        setSelectedTVShow(null);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Secret keyboard shortcut to access auth (Ctrl+Shift+A or Cmd+Shift+A)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                setIsAuthModalOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <AuthProvider>
            <Router>
                <div className={`App ${isScrolled ? 'scrolled' : ''}`}>
                    <main>
                        <Routes>
                            <Route path="/" element={<MoviesList />} />
                            <Route path="/explore" element={<ExploreAll />} />
                            <Route path="/movies" element={<MoviesList />} />
                            <Route
                                path="/tv-shows"
                                element={<TVShowsList openTvModal={openTvModal} />}
                            />
                            <Route path="/filter" element={<Filter />} />
                            <Route path="/admin" element={<AdminPanel />} />
                        </Routes>
                    </main>

                    {/* TvModal */}
                    <Modal
                        isOpen={isTvModalOpen}
                        onRequestClose={closeTvModal}
                        contentLabel="TV Show Details"
                    >
                        {selectedTVShow && <TvModal tvShow={selectedTVShow} />}
                        <button onClick={closeTvModal}>Close</button>
                    </Modal>

                    {/* Secret Auth Modal - accessible via Ctrl+Shift+A / Cmd+Shift+A */}
                    <AuthModal
                        isOpen={isAuthModalOpen}
                        onRequestClose={() => setIsAuthModalOpen(false)}
                    />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;