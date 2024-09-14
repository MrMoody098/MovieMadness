import React from 'react';
import "./css/MoviesList.css";
import "./css/MovieModal.css";

const MovieModal = ({ movie }) => {
    if (!movie) {
        return <div>Loading...</div>; // Or any other loading indicator
    }

    // Create the embed URL dynamically using backticks
    const movieEmbedUrl = `https://vidsrc.xyz/embed/movie/${movie.id}`;

    return (
        <div className="movie-details-container">
            <div>
                <h2>{movie.title} -
                    Rating {parseFloat(movie.vote_average).toFixed(1) || 'N/A'}</h2>

                {/* Add TV Show description here */}
                <p className="movie-description">{movie.overview}</p>

                <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden'}}>
                    <iframe
                        src={movieEmbedUrl}
                        title="Embedded Movie"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default MovieModal;