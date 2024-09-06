// MovieModal.js
import React from 'react';
import '../MoviesList.css'
const MovieModal = ({ movie, onClose }) => {
  return (
    <div className="movie-modal-overlay">
      <div className="movie-modal-content">
        <h2>{movie.title}</h2>
        <p>Rating: {movie.rating}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default MovieModal;
