import axios from 'axios';

export async function fetchTmdb(path, params = {}, signal) {
    const apiKey = process.env.REACT_APP_TMDB_API_KEY;
    if (!apiKey) throw new Error('Movie data is unavailable. The site needs a TMDB API key configured.');
    const { data } = await axios.get(`https://api.themoviedb.org/3/${path}`, {
        params: { api_key: apiKey, language: 'en-US', ...params }, signal
    });
    if (!data || typeof data !== 'object') throw new Error('Movie data could not be loaded.');
    return data;
}

export function isCanceled(error, signal) {
    return signal.aborted || axios.isCancel(error);
}
