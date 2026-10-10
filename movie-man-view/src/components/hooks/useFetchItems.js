import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchTmdb, isCanceled } from '../../utils/tmdb';

const useFetchItems = (type, options = {}) => {
    const { query = '', endpoint = '', params = {}, enabled = true } = options;
    const requestKey = JSON.stringify({ type, query: query.trim(), endpoint, params, enabled });
    const [pagination, setPagination] = useState({ key: requestKey, page: 1 });
    const page = pagination.key === requestKey ? pagination.page : 1;
    const [result, setResult] = useState({ key: '', items: [], hasMore: true });
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const busy = useRef(false);

    useEffect(() => {
        const controller = new AbortController();
        setPagination(previous => previous.key === requestKey ? previous : { key: requestKey, page: 1 });
        const request = JSON.parse(requestKey);
        if (!request.enabled) {
            busy.current = false;
            setLoading(false);
            setError('');
            return () => controller.abort();
        }
        busy.current = true;
        setLoading(true);
        setError('');
        const path = request.endpoint || (request.query ? `search/${request.type}` : `trending/${request.type}/day`);
        fetchTmdb(path, { ...request.params, page, include_adult: false,
            ...(request.query ? { query: request.query } : {}) }, controller.signal)
            .then(data => {
                if (controller.signal.aborted) return;
                if (!Array.isArray(data.results)) throw new Error('Invalid results');
                const incoming = data.results.filter(item => item && Number.isInteger(item.id) && item.id > 0 && typeof (item.title || item.name) === 'string'
                    && (request.type !== 'multi' || ['movie', 'tv'].includes(item.media_type)));
                setResult(previous => {
                    const items = page === 1 || previous.key !== requestKey ? [] : previous.items;
                    const seen = new Set(items.map(item => `${item.media_type || request.type}:${item.id}`));
                    return { key: requestKey, items: [...items, ...incoming.filter(item => {
                        const key = `${item.media_type || request.type}:${item.id}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    })], hasMore: page < Math.min(Number(data.total_pages) || 0, 500) };
                });
            })
            .catch(failure => {
                if (!isCanceled(failure, controller.signal)) {
                    setError(process.env.REACT_APP_TMDB_API_KEY
                        ? 'Titles could not be loaded. Check your connection and try again.'
                        : 'Movie data is unavailable. The site needs a TMDB API key configured.');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    busy.current = false;
                    setLoading(false);
                }
            });
        return () => controller.abort();
    }, [requestKey, page, attempt]);

    const hasMore = enabled && (result.key !== requestKey || result.hasMore);
    const loadMore = useCallback(() => {
        if (busy.current || loading || error || !hasMore) return;
        busy.current = true;
        setLoading(true);
        setPagination(previous => ({ key: requestKey,
            page: previous.key === requestKey ? previous.page + 1 : 2 }));
    }, [requestKey, loading, error, hasMore]);

    return { items: result.key === requestKey ? result.items : [], loading, error, hasMore,
        loadMore, retry: () => setAttempt(value => value + 1) };
};
export default useFetchItems;
