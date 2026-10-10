import React from 'react';
import Icon from './Icon';
import Modal from 'react-modal';
import MovieModal from './modals/MovieModal';
import TvModal from './modals/TvModal';
import './css/Modal.css';

export default function MediaDetails({ selection, onSelect, onClose }) {
    return <Modal isOpen={Boolean(selection)} onRequestClose={onClose}
        contentLabel={selection?.type === 'tv' ? 'TV show episode' : 'Movie details'}>
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        {selection?.type === 'tv' ? <TvModal key={`tv:${selection.item.id}`} isOpen tvShow={selection.item} />
            : selection && <MovieModal key={`movie:${selection.item.id}`} movie={selection.item}
                onMovieSelect={movie => onSelect(movie, 'movie')} />}
    </Modal>;
}
