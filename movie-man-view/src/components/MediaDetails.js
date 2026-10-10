import React from 'react';
import Modal from 'react-modal';
import MovieModal from './modals/MovieModal';
import TvModal from './modals/TvModal';
import './css/Modal.css';

export default function MediaDetails({ selection, onSelect, onClose }) {
    if (!selection) return null;
    const { item, type } = selection;
    if (type === 'tv') return <TvModal key={`tv:${item.id}`} isOpen onRequestClose={onClose} tvShow={item} />;
    return <Modal isOpen onRequestClose={onClose} contentLabel="Movie details">
        <button onClick={onClose}>Close</button>
        <MovieModal key={`movie:${item.id}`} movie={item} onMovieSelect={movie => onSelect(movie, 'movie')} />
    </Modal>;
}
