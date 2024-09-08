import React from 'react';
const MovieEmbed = ({ movieUrl }) => {
  return (

    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
        {console.log(movieUrl)}
      <iframe

        src={movieUrl}
        title="Embedded Movie"
        frameBorder="0"
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
  );
};

export default MovieEmbed;
