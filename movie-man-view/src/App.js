import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MoviesList from './components/pages/MoviesList';
import NavBar from './components/NavBar';
import TVShowsList from './components/pages/TVShowsList';
import Filter from './components/pages/Filter';
import ExploreAll from './components/pages/ExploreAll';
import TvModal from './components/modals/TvModal';
import MovieModal from './components/modals/MovieModal';
import JoinRoomModal from './components/modals/JoinRoomModal';
import Modal from 'react-modal';

// Set the root element for accessibility
Modal.setAppElement('#root');

function App() {
    const [selectedTVShow, setSelectedTVShow] = useState(null);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [isTvModalOpen, setIsTvModalOpen] = useState(false);
    const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
    const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [watchPartyRoomId, setWatchPartyRoomId] = useState(null);

    const openTvModal = (tvShow) => {
        setSelectedTVShow(tvShow);
        setIsTvModalOpen(true);
    };

    const closeTvModal = () => {
        setIsTvModalOpen(false);
        setSelectedTVShow(null);
        setWatchPartyRoomId(null);
    };

    const openMovieModal = (movie) => {
        setSelectedMovie(movie);
        setIsMovieModalOpen(true);
    };

    const closeMovieModal = () => {
        setIsMovieModalOpen(false);
        setSelectedMovie(null);
        setWatchPartyRoomId(null);
    };

    const openJoinRoomModal = () => {
        setIsJoinRoomModalOpen(true);
    };

    const closeJoinRoomModal = () => {
        setIsJoinRoomModalOpen(false);
    };

    const handleJoinSuccess = (roomData, roomId) => {
        setWatchPartyRoomId(roomId);
        
        if (roomData.contentType === 'tv') {
            // For TV shows, we need to fetch the TV show data
            setSelectedTVShow({
                id: roomData.tvShowId,
                name: roomData.tvShowName
            });
            setIsTvModalOpen(true);
        } else {
            // For movies, we need to fetch the movie data
            setSelectedMovie({
                id: roomData.movieId,
                title: roomData.movieName
            });
            setIsMovieModalOpen(true);
        }
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
                <NavBar 
                    onSearch={(query) => console.log('Search:', query)} 
                    isModalOpen={isTvModalOpen || isMovieModalOpen || isJoinRoomModalOpen}
                    onJoinRoom={openJoinRoomModal}
                />
                <main>
                    <Routes>
                        <Route path="/" element={<MoviesList openMovieModal={openMovieModal} />} />
                        <Route path="/explore" element={<ExploreAll openMovieModal={openMovieModal} />} />
                        <Route path="/movies" element={<MoviesList openMovieModal={openMovieModal} />} />
                        <Route
                            path="/tv-shows"
                            element={<TVShowsList openTvModal={openTvModal} />}
                        />
                        <Route path="/filter" element={<Filter openMovieModal={openMovieModal} />} />
                    </Routes>
                </main>

                {/* TvModal */}
                <Modal
                    isOpen={isTvModalOpen}
                    onRequestClose={closeTvModal}
                    contentLabel="TV Show Details"
                >
                    {selectedTVShow && (
                        <TvModal 
                            tvShow={selectedTVShow} 
                            watchPartyRoomId={watchPartyRoomId}
                        />
                    )}
                    <button onClick={closeTvModal}>Close</button>
                </Modal>

                {/* MovieModal */}
                <Modal
                    isOpen={isMovieModalOpen}
                    onRequestClose={closeMovieModal}
                    contentLabel="Movie Details"
                >
                    {selectedMovie && (
                        <MovieModal 
                            movie={selectedMovie} 
                            watchPartyRoomId={watchPartyRoomId}
                        />
                    )}
                    <button onClick={closeMovieModal}>Close</button>
                </Modal>

                {/* Join Room Modal */}
                <JoinRoomModal
                    isOpen={isJoinRoomModalOpen}
                    onClose={closeJoinRoomModal}
                    onJoinSuccess={handleJoinSuccess}
                />
            </div>
        </Router>
    );
}

export default App;