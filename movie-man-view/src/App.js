// src/App.js
import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MoviesList from './components/MoviesList';
import NavBar from './components/NavBar';
import TVShows from './components/pages/TVShows';
import Filter from './components/pages/Filter';
import ExploreAll from './components/pages/ExploreAll';
import TvModal from './components/TvModal';
import Modal from 'react-modal';

// Set the root element for accessibility
Modal.setAppElement('#root');

function App() {
    const [selectedTVShow, setSelectedTVShow] = useState(null);
    const [isTvModalOpen, setIsTvModalOpen] = useState(false);

    const openTvModal = (tvShow) => {
        setSelectedTVShow(tvShow);
        setIsTvModalOpen(true);
    };

    const closeTvModal = () => {
        setIsTvModalOpen(false);
        setSelectedTVShow(null);
    };

    return (
        <Router>
            <div className="App">
                <NavBar />
                <main>
                    <Routes>
                        <Route path="/explore" element={<ExploreAll />} />
                        <Route path="/movies" element={<MoviesList />} />
                        <Route
                            path="/tv-shows"
                            element={<TVShows openTvModal={openTvModal} />}
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
