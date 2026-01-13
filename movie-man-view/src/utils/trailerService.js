import axios from 'axios';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'f58bf4f31de2a8346b5841b863457b1f';

/**
 * Fetches YouTube trailer for a movie
 * @param {number} movieId - TMDB movie ID
 * @returns {Promise<string|null>} YouTube video ID or null
 */
export const getMovieTrailer = async (movieId) => {
  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`
    );

    // Find the first YouTube trailer
    const trailer = data.results.find(
      (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
    );

    if (trailer) {
      return trailer.key; // YouTube video ID
    }

    // Fallback to any YouTube video
    const anyYouTubeVideo = data.results.find((video) => video.site === 'YouTube');
    return anyYouTubeVideo ? anyYouTubeVideo.key : null;
  } catch (error) {
    console.error('Error fetching movie trailer:', error);
    return null;
  }
};

/**
 * Fetches YouTube trailer for a TV show
 * @param {number} tvId - TMDB TV show ID
 * @returns {Promise<string|null>} YouTube video ID or null
 */
export const getTvTrailer = async (tvId) => {
  try {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/tv/${tvId}/videos?api_key=${API_KEY}`
    );

    // Find the first YouTube trailer
    const trailer = data.results.find(
      (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
    );

    if (trailer) {
      return trailer.key; // YouTube video ID
    }

    // Fallback to any YouTube video
    const anyYouTubeVideo = data.results.find((video) => video.site === 'YouTube');
    return anyYouTubeVideo ? anyYouTubeVideo.key : null;
  } catch (error) {
    console.error('Error fetching TV trailer:', error);
    return null;
  }
};

/**
 * Gets YouTube embed URL from video ID
 * @param {string} videoId - YouTube video ID
 * @returns {string} YouTube embed URL
 */
export const getYouTubeEmbedUrl = (videoId) => {
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
};
