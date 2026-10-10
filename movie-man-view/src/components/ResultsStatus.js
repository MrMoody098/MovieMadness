import React, { useEffect, useRef } from 'react';

export default function ResultsStatus({ loading, error, retry, hasMore, loadMore, empty, autoLoad = false,
    emptyMessage = 'No titles found. Try another search or adjust your filters.' }) {
    const sentinel = useRef(null);

    useEffect(() => {
        if (!autoLoad || loading || error || !hasMore) return;
        const target = sentinel.current;
        if (!target) return;

        const preloadDistance = Math.max(1800, window.innerHeight * 3);
        let previousScrollY = window.scrollY;
        const preloadWhileScrolling = () => {
            const movingDown = window.scrollY > previousScrollY;
            previousScrollY = window.scrollY;
            if (movingDown && target.getBoundingClientRect().top <= window.innerHeight * 6) loadMore();
        };
        if (window.IntersectionObserver) {
            const observer = new IntersectionObserver(entries => {
                if (entries.some(entry => entry.isIntersecting)) loadMore();
            }, { rootMargin: `${preloadDistance}px 0px` });
            observer.observe(target);
            window.addEventListener('scroll', preloadWhileScrolling, { passive: true });
            return () => {
                observer.disconnect();
                window.removeEventListener('scroll', preloadWhileScrolling);
            };
        }

        const checkPosition = () => {
            if (target.getBoundingClientRect().top <= window.innerHeight + preloadDistance) loadMore();
        };
        checkPosition();
        window.addEventListener('scroll', preloadWhileScrolling, { passive: true });
        window.addEventListener('resize', checkPosition);
        return () => {
            window.removeEventListener('scroll', preloadWhileScrolling);
            window.removeEventListener('resize', checkPosition);
        };
    }, [autoLoad, loading, error, hasMore, loadMore]);

    return <div className="results-status" ref={sentinel}>
        {loading && empty && <div className="loading-grid" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => <div className="poster-skeleton" key={index} />)}
        </div>}
        {loading && <p className="loading-status" role="status"><span className="loading-dot" />Loading titles…</p>}
        {error && <div className="empty-state" role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div>}
        {!loading && !error && empty && <div className="empty-state" role="status"><p>{emptyMessage}</p></div>}
        {!loading && !error && !empty && !hasMore && autoLoad && <p className="end-of-results">You’ve reached the end.</p>}
    </div>;
}
