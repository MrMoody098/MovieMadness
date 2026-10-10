import React from 'react';
import Carousel from './Carosel';
export default function GenreCarousel({ genreId, heading, onSelect }) {
    return <Carousel genreId={genreId} heading={heading} onSelect={onSelect} />;
}
