import React, { useState } from 'react';
import { getMovieProgress, getShowProgress, saveMovieProgress, saveWatchProgress, formatWatchTime } from '../utils/watchProgress';
import { recordPlayback } from '../utils/mediaLibrary';

export default function ProgressControls({ id, type, season = 1, episode = 1, runtime }) {
    const saved = type === 'tv' ? getShowProgress(id) : getMovieProgress(id);
    const matches = saved && (type === 'movie' || (saved.lastWatchedSeason === season && saved.lastWatchedEpisode === episode));
    const [minutes, setMinutes] = useState(matches ? String(Math.floor(saved.watchTime / 60)) : '');
    const [duration, setDuration] = useState(matches && saved.totalDuration > 0 ? String(Math.ceil(saved.totalDuration / 60)) : runtime ? String(runtime) : '');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const save = (watchTime, totalDuration, status) => {
        const success = type === 'tv' ? saveWatchProgress(id, season, episode, watchTime, totalDuration, status)
            : saveMovieProgress(id, watchTime, totalDuration, status);
        if (success) recordPlayback(type, id);
        return success;
    };
    const checkpoint = event => {
        event.preventDefault();
        const watchTime = Number(minutes) * 60;
        const totalDuration = Number(duration) * 60;
        if (minutes === '' || duration === '' || !Number.isFinite(watchTime) || !Number.isFinite(totalDuration)
            || watchTime < 0 || totalDuration <= 0 || watchTime > totalDuration) {
            setError('Enter a valid position and duration. Your position cannot exceed the duration.');
            return;
        }
        setError('');
        if (save(watchTime, totalDuration, 'watching')) setMessage(`Position saved at ${formatWatchTime(watchTime)}. Use the player controls to resume at this time.`);
    };
    const mark = status => {
        setError('');
        const totalDuration = Number(duration) > 0 && Number.isFinite(Number(duration)) ? Number(duration) * 60 : 0;
        const watchTime = status === 'watched' ? totalDuration : matches && saved.progressPercentage < 95 ? saved.watchTime : 0;
        if (save(watchTime,
            status === 'watching' && matches ? saved.totalDuration : totalDuration, status)) {
            setMessage(status === 'watching' ? 'Added to Continue Watching.' : 'Marked as watched.');
        }
    };
    return <section className="watch-controls" aria-label="Viewing progress">
        <div className="detail-actions"><button onClick={() => mark('watching')}>I’m watching</button>
            <button onClick={() => mark('watched')}>Mark {type === 'tv' ? 'episode' : 'movie'} watched</button></div>
        {matches && saved.watchTime > 0 && saved.progressPercentage < 95 && <p>Saved position: {formatWatchTime(saved.watchTime)}. Use the player controls to resume at this time.</p>}
        <form className="progress-form" onSubmit={checkpoint}>
            <label>Position (minutes)<input type="number" min="0" step="1" required value={minutes} onChange={event => setMinutes(event.target.value)} /></label>
            <label>Duration (minutes)<input type="number" min="1" step="1" required value={duration} onChange={event => setDuration(event.target.value)} /></label>
            <button type="submit">Save position</button>
        </form>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
    </section>;
}
