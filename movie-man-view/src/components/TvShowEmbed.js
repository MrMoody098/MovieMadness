import React from 'react';

const TvShowEmbed = ({ tmdbId }) => {
    const embedUrl = `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=1&episode=1`;

    return (
        <div className="embed-container">
            <iframe
                src={embedUrl}
                frameBorder="0"
                allow="fullscreen"
                width="100%"
                height="500px"
                title="TV Show Player"
            ></iframe>
        </div>
    );
};

export default TvShowEmbed;
