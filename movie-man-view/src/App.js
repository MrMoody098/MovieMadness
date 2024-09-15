import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MoviesList from './components/pages/MoviesList';
import NavBar from './components/NavBar';
import TVShowsList from './components/pages/TVShowsList';
import Filter from './components/pages/Filter';
import ExploreAll from './components/pages/ExploreAll';
import TvModal from './components/modals/TvModal';
import Modal from 'react-modal';

// Set the root element for accessibility
Modal.setAppElement('#root');

function App() {
    const [selectedTVShow, setSelectedTVShow] = useState(null);
    const [isTvModalOpen, setIsTvModalOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

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

    return (
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
            </div>
        </Router>
    );
}

export default App;