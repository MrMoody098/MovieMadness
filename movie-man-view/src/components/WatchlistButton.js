import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { getWatchlist, toggleWatchlist, LIBRARY_EVENT } from '../utils/mediaLibrary';

export default function WatchlistButton({ item, type }) {
    const [items, setItems] = useState(getWatchlist);
    useEffect(() => {
        const refresh = () => setItems(getWatchlist());
        window.addEventListener(LIBRARY_EVENT, refresh);
        window.addEventListener('storage', refresh);
        return () => { window.removeEventListener(LIBRARY_EVENT, refresh); window.removeEventListener('storage', refresh); };
    }, []);
    const saved = items.some(value => value.id === item.id && value.media_type === type);
    return <button className="secondary" aria-pressed={saved} onClick={() => toggleWatchlist(item, type)}>
        <Icon name={saved ? 'check' : 'plus'} size={18} />{saved ? 'Remove from watchlist' : 'Add to watchlist'}
    </button>;
}
