import React from 'react';
import ReviewsList from './ReviewsList';
import MovieEmbed from './MovieEmbed';

const MovieDetails = ({ movie }) => {
    if (!movie) {
        return <div>Loading...</div>; // Or any other loading indicator
    }

    // Create the embed URL dynamically using backticks
    const movieEmbedUrl = `https://vidsrc.xyz/embed/movie/${movie.id}`;

    return (
        <div className="movie-details-container">
            <MovieEmbed movieUrl={movieEmbedUrl} />
        </div>
    );
};

export default MovieDetails;
