import React from 'react';

const paths = {
    search: 'm21 21-4.5-4.5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z',
    close: 'm6 6 12 12M6 18 18 6',
    plus: 'M12 5v14M5 12h14',
    check: 'm5 12 4 4L19 6',
    left: 'm14 6-6 6 6 6',
    right: 'm10 6 6 6-6 6',
    filters: 'M4 7h9m4 0h3M4 17h3m4 0h9M13 4v6M7 14v6',
    bookmark: 'M6 3h12v18l-6-4-6 4V3Z',
    play: 'm9 5 11 7-11 7V5Z',
    star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z'
};

export default function Icon({ name, size = 20, className = '' }) {
    return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24"
        fill={name === 'star' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d={paths[name]} />
    </svg>;
}
