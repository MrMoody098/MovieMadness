import React, { useEffect, useRef } from 'react';
export default function ResultsStatus({ loading, error, retry, hasMore, loadMore, empty, autoLoad = false, emptyMessage = 'No titles found. Try another search or adjust your filters.' }) {
    const sentinel = useRef(null);
    useEffect(() => {
        if (!autoLoad || loading || error || !hasMore || empty || !window.IntersectionObserver) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) loadMore();
        }, { rootMargin: '150px' });
        if (sentinel.current) observer.observe(sentinel.current);
        return () => observer.disconnect();
    }, [autoLoad, loading, error, hasMore, empty, loadMore]);
    return <div className="results-status" ref={sentinel}>
        {loading && <p role="status">Loading titles…</p>}
        {error && <div role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div>}
        {!loading && !error && empty && <p role="status">{emptyMessage}</p>}
        {!loading && !error && hasMore && <button onClick={loadMore}>Load more</button>}
    </div>;
}
