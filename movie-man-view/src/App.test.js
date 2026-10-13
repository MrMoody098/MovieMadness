import React, { act } from 'react';
import Modal from 'react-modal';
import { render as renderReact, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import axios from 'axios';
import App from './App';
import NavBar from './components/NavBar';
import MoviesList from './components/pages/MoviesList';
import Filter from './components/pages/Filter';
import ExploreAll from './components/pages/ExploreAll';
import MediaDetails from './components/MediaDetails';
import MovieModal from './components/modals/MovieModal';
import TvModal from './components/modals/TvModal';
import HistorySection from './components/HistorySection';
import useFetchItems from './components/hooks/useFetchItems';
import { getHistoryIds, recordPlayback, getWatchlist, toggleWatchlist } from './utils/mediaLibrary';

jest.mock('axios', () => ({ get: jest.fn(), isCancel: jest.fn(() => false) }));
const movie = { id: 12, title: 'Test Movie', poster_path: null, vote_average: 8, overview: 'A movie.' };
const tv = { id: 34, name: 'Test Show', poster_path: null, vote_average: 7 };
const response = (results, total_pages = 1) => ({ data: { results, total_pages } });

const render = (ui, options) => renderReact(ui, { container: document.getElementById('root'), ...options });

beforeEach(() => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    Modal.setAppElement(root);
    Element.prototype.scrollIntoView = jest.fn();
    localStorage.clear();
    jest.clearAllMocks();
    process.env.REACT_APP_TMDB_API_KEY = 'test-key';
    window.history.replaceState({}, '', '/');
    axios.get.mockImplementation((url) => {
        if (url.endsWith('/configuration/languages')) return Promise.resolve({ data: [{ iso_639_1: 'en', english_name: 'English' }] });
        if (url.includes('/genre/')) return Promise.resolve({ data: { genres: [{ id: 28, name: 'Action' }] } });
        if (url.includes('/season/')) return Promise.resolve({ data: { episodes: Array.from({ length: 10 }, (_, index) => ({ episode_number: index + 1 })) } });
        if (url.endsWith('/tv/34')) return Promise.resolve({ data: { ...tv, number_of_seasons: 3 } });
        if (url.endsWith('/movie/12')) return Promise.resolve({ data: movie });
        return Promise.resolve(response([movie]));
    });
});

function HookHarness({ query }) {
    const result = useFetchItems('movie', { query });
    return <><div data-testid="items">{result.items.map(item => item.title).join(',')}</div>
        {result.loading && <span>Loading</span>}{result.error && <span>{result.error}</span>}
        <button disabled={result.loading} onClick={result.loadMore}>More</button><button onClick={result.retry}>Retry</button></>;
}

function Location() {
    const location = useLocation();
    return <output data-testid="location">{location.pathname}{location.search}</output>;
}

test('renders the movie site and opens titles without marking them watched', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByRole('heading', { name: 'Movies' })).toBeInTheDocument();
    const movieCard = await screen.findByRole('button', { name: 'Open Test Movie' });
    await act(async () => { fireEvent.click(movieCard); });
    expect(await screen.findByTitle('Watch Test Movie')).toBeInTheDocument();
    expect(getHistoryIds('movie')).toEqual([]);
    expect(screen.getByRole('button', { name: 'Add to watchlist' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Loading titles…')).not.toBeInTheDocument());
});

test('search pagination preserves encoded query and deduplicates results', async () => {
    axios.get.mockResolvedValue(response([movie], 2));
    await act(async () => { render(<HookHarness query="A & B" />); });
    await waitFor(() => expect(screen.queryByText('Loading')).not.toBeInTheDocument());
    await act(async () => { fireEvent.click(screen.getByText('More')); });
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    expect(axios.get.mock.calls[1][0]).toContain('/search/movie');
    expect(axios.get.mock.calls[1][1].params).toMatchObject({ query: 'A & B', page: 2 });
    await waitFor(() => expect(screen.queryByText('Loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('items')).toHaveTextContent(/^Test Movie$/);
});

test('ignores stale search responses and restarts pagination when returning to a query', async () => {
    let resolveOld;
    axios.get.mockImplementation((url, { params }) => params.query === 'old'
        ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(response([{ ...movie, title: 'New Result' }], 2)));
    let view;
    await act(async () => { view = render(<HookHarness query="old" />); });
    const oldSignal = axios.get.mock.calls[0][1].signal;
    await act(async () => { view.rerender(<HookHarness query="new" />); });
    await screen.findByText('New Result');
    await act(async () => { resolveOld(response([{ ...movie, title: 'Old Result' }])); });
    expect(oldSignal.aborted).toBe(true);
    expect(screen.getByTestId('items')).toHaveTextContent('New Result');
    await act(async () => { fireEvent.click(screen.getByText('More')); });
    await waitFor(() => expect(axios.get.mock.calls.at(-1)[1].params.page).toBe(2));
    await act(async () => { view.rerender(<HookHarness query="another" />); });
    await waitFor(() => expect(axios.get.mock.calls.at(-1)[1].params.query).toBe('another'));
    await act(async () => { view.rerender(<HookHarness query="new" />); });
    await waitFor(() => expect(axios.get.mock.calls.at(-1)[1].params).toMatchObject({ query: 'new', page: 1 }));
    await waitFor(() => expect(screen.queryByText('Loading')).not.toBeInTheDocument());
});

test('failed requests show a recoverable error', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network failed')).mockResolvedValue(response([movie]));
    await act(async () => { render(<HookHarness query="test" />); });
    await screen.findByText(/Titles could not be loaded/);
    fireEvent.click(screen.getByText('Retry'));
    await screen.findByText('Test Movie');
});

test('navigation searches both media types and keeps browse links visible', async () => {
    await act(async () => { render(<MemoryRouter><NavBar /><Location /></MemoryRouter>); });
    fireEvent.change(screen.getByRole('combobox', { name: 'Search movies and TV shows' }), { target: { value: 'A & B' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=A%20%26%20B');
    expect(screen.getByRole('link', { name: 'Movies' })).toHaveAttribute('href', '/movies');
    expect(screen.getByRole('link', { name: 'TV shows' })).toHaveAttribute('href', '/tv-shows');
});

test('unified search ignores people and opens TV results', async () => {
    axios.get.mockImplementation(url => url.endsWith('/search/multi')
        ? Promise.resolve(response([{ ...movie, media_type: 'movie' }, { ...tv, media_type: 'tv' }, { id: 99, name: 'Person', media_type: 'person' }]))
        : url.includes('/season/') ? Promise.resolve({ data: { episodes: [{ episode_number: 1 }] } })
        : url.endsWith('/tv/34') ? Promise.resolve({ data: { ...tv, number_of_seasons: 1 } }) : Promise.resolve(response([])));
    await act(async () => { render(<MemoryRouter initialEntries={['/search?q=test']}><ExploreAll searchOnly /></MemoryRouter>); });
    fireEvent.click(await screen.findByRole('button', { name: 'Open Test Show' }));
    expect(screen.queryByText('Person')).not.toBeInTheDocument();
    expect(await screen.findByTitle('Test Show — S1E1')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Select episode')).not.toBeDisabled());
});

test('filters restore URL values, update discover requests, and open recommendations', async () => {
    await act(async () => { render(<MemoryRouter initialEntries={['/filter?year=2020&minRating=7&sort=popularity.desc']}><Filter /><Location /></MemoryRouter>); });
    expect(screen.getByLabelText('Release year')).toHaveValue(2020);
    expect(screen.getByLabelText('Minimum rating')).toHaveValue(7);
    await screen.findByRole('button', { name: 'Open Test Movie' });
    expect(axios.get.mock.calls.find(([url]) => url.endsWith('/discover/movie'))[1].params).toMatchObject({ primary_release_year: 2020, sort_by: 'popularity.desc' });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Open Test Movie' })); });
    const recommendation = await screen.findByRole('button', { name: 'Open Test Movie' });
    await act(async () => { fireEvent.click(recommendation); });
    expect(screen.getByTitle('Watch Test Movie')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByText('Reset filters'));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/filter$/);
    expect(screen.getByLabelText('Release year')).toHaveValue(null);
    await screen.findByRole('button', { name: 'Open Test Movie' });
});

test('watchlist is independent of viewing history and persists removal', async () => {
    toggleWatchlist(movie, 'movie');
    expect(getWatchlist()).toHaveLength(1);
    expect(getHistoryIds('movie')).toEqual([]);
    await act(async () => { render(<MemoryRouter><ExploreAll watchlistOnly /></MemoryRouter>); });
    fireEvent.click(screen.getByRole('button', { name: 'Remove Test Movie from watchlist' }));
    expect(getWatchlist()).toEqual([]);
    expect(screen.getByText(/Save titles from their details/)).toBeInTheDocument();
});

test('recently watched deduplicates titles and survives an individual title fetch failure', async () => {
    recordPlayback('movie', 12);
    recordPlayback('movie', 99);
    recordPlayback('movie', 12);
    expect(getHistoryIds('movie')).toEqual([12, 99]);
    axios.get.mockImplementation(url => url.endsWith('/movie/99') ? Promise.reject(new Error('Missing title')) : Promise.resolve({ data: movie }));
    await act(async () => { render(<HistorySection type="movie" onSelect={jest.fn()} />); });
    expect(await screen.findByRole('button', { name: 'Open Test Movie' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recently watched' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue watching' })).not.toBeInTheDocument();
    expect(screen.getByText('Some watched titles could not be loaded.')).toBeInTheDocument();
});

test('corrupt and malformed stored data does not crash the library', () => {
    localStorage.setItem('recentlyWatched', '{broken');
    localStorage.setItem('recentlyWatchedTv', JSON.stringify({ id: 1 }));
    localStorage.setItem('watchlist', JSON.stringify([null, { id: '12', media_type: 'movie' }]));
    expect(getHistoryIds('movie')).toEqual([]);
    expect(getHistoryIds('tv')).toEqual([]);
    expect(getWatchlist()).toEqual([]);
});

test('movie history changes only after marking the title watched', async () => {
    await act(async () => { render(<MovieModal movie={movie} onMovieSelect={jest.fn()} />); });
    const frame = screen.getByTitle('Watch Test Movie');
    expect(frame.src).toBe('https://vidsrc.to/embed/movie/12');
    expect(screen.queryByText(/Switch to/)).not.toBeInTheDocument();
    act(() => { window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.example', source: frame.contentWindow,
        data: { type: 'PLAYER_EVENT', data: { event: 'play', currentTime: 100, duration: 1000 } } })); });
    expect(getHistoryIds('movie')).toEqual([]);
    expect(screen.queryByText('Save a playback position')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark as watched' }));
    expect(getHistoryIds('movie')).toEqual([12]);
    expect(screen.getByText('Added to Recently watched.')).toBeInTheDocument();
    expect(localStorage.getItem('movieProgress_12')).toBeNull();
});

test('movie downloads search locally and queue the selected Torlink result', async () => {
    const originalFetch = global.fetch;
    const magnet = 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567';
    global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ infoHash: 'abc', name: 'Test Movie 2020',
            sizeBytes: 1073741824, seeders: 12, source: 'yts', magnet }] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, outcome: 'added' }) });
    try {
        await act(async () => { render(<MovieModal movie={{ ...movie, release_date: '2020-01-01' }} onMovieSelect={jest.fn()} />); });
        fireEvent.click(screen.getByRole('button', { name: 'Find downloads' }));
        expect(await screen.findByText('Test Movie 2020')).toBeInTheDocument();
        expect(global.fetch.mock.calls[0][0]).toBe('/local-downloads/search?query=Test%20Movie%202020&category=movies');
        fireEvent.click(screen.getByRole('button', { name: 'Download' }));
        expect(await screen.findByText('Download added to Torlink on the computer running MovieMadness.')).toBeInTheDocument();
        expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual({ magnet });
    } finally { global.fetch = originalFetch; }
});

test('TV episode downloads use the selected episode and TV category', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    try {
        await act(async () => { render(<TvModal isOpen tvShow={tv} />); });
        await waitFor(() => expect(screen.getByLabelText('Select episode')).not.toBeDisabled());
        fireEvent.change(screen.getByLabelText('Select episode'), { target: { value: '3' } });
        fireEvent.click(screen.getByRole('button', { name: 'Find downloads' }));
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        expect(global.fetch.mock.calls[0][0]).toBe('/local-downloads/search?query=Test%20Show%20S01E03&category=tv');
        expect(await screen.findByText('No downloads found. Try a different search term.')).toBeInTheDocument();
    } finally { global.fetch = originalFetch; }
});

test('TV history is title-only and selecting an episode does not save playback progress', async () => {
    await act(async () => { render(<TvModal isOpen tvShow={tv} onRequestClose={jest.fn()} />); });
    const frame = await screen.findByTitle('Test Show — S1E1');
    expect(frame.src).toBe('https://vidsrc.to/embed/tv/34/1/1');
    await waitFor(() => expect(screen.getByLabelText('Select episode')).not.toBeDisabled());
    expect(screen.getByLabelText('Select episode')).toHaveValue('1');
    await act(async () => { fireEvent.change(screen.getByLabelText('Select season'), { target: { value: '3' } }); });
    await waitFor(() => expect(screen.getByLabelText('Select episode')).not.toBeDisabled());
    expect(screen.getByLabelText('Select episode')).toHaveValue('1');
    expect(screen.getByTitle('Test Show — S3E1').src).toBe('https://vidsrc.to/embed/tv/34/3/1');
    expect(getHistoryIds('tv')).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Mark as watched' }));
    expect(getHistoryIds('tv')).toEqual([34]);
    expect(localStorage.getItem('tvWatchProgress')).toBeNull();
});

test('search suggestions support keyboard selection and dismiss without submitting', async () => {
    axios.get.mockResolvedValue(response([{ ...movie, media_type: 'movie' }, { ...tv, media_type: 'tv' }, { id: 99, name: 'Person', media_type: 'person' }]));
    await act(async () => { render(<MemoryRouter><NavBar /><Location /></MemoryRouter>); });
    const input = screen.getByRole('combobox', { name: 'Search movies and TV shows' });
    fireEvent.change(input, { target: { value: 'test' } });
    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(2);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'search-suggestion-0');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=Test%20Show');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'again' } });
    await screen.findAllByRole('option');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=Test%20Show');
});

test('search suggestions cancel obsolete requests and support pointer selection', async () => {
    let resolveOld;
    axios.get.mockImplementation((url, { params }) => params.query === 'old'
        ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(response([{ ...movie, title: 'New Suggestion', media_type: 'movie' }])));
    await act(async () => { render(<MemoryRouter><NavBar /><Location /></MemoryRouter>); });
    const input = screen.getByRole('combobox', { name: 'Search movies and TV shows' });
    fireEvent.change(input, { target: { value: 'old' } });
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    const signal = axios.get.mock.calls[0][1].signal;
    fireEvent.change(input, { target: { value: 'new' } });
    await screen.findByRole('button', { name: /New Suggestion/ });
    await act(async () => { resolveOld(response([{ ...movie, title: 'Old Suggestion', media_type: 'movie' }])); });
    expect(signal.aborted).toBe(true);
    expect(screen.queryByText('Old Suggestion')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /New Suggestion/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=New%20Suggestion');
});


test.each(['movie', 'tv'])('%s automatically loads the next page and resets when changing collections', async type => {
    let intersect;
    const disconnect = jest.fn();
    window.IntersectionObserver = jest.fn(callback => {
        intersect = callback;
        return { observe: jest.fn(), disconnect };
    });
    axios.get.mockImplementation((url, { params }) => Promise.resolve(response([
        { ...movie, id: params.page, title: `Page ${params.page}` }
    ], 2)));
    try {
        await act(async () => { render(<MemoryRouter><MoviesList type={type} /><Location /></MemoryRouter>); });
        await screen.findByRole('button', { name: 'Open Page 1' });
        expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
        await act(async () => { intersect([{ isIntersecting: true }]); intersect([{ isIntersecting: true }]); });
        await screen.findByRole('button', { name: 'Open Page 2' });
        expect(axios.get.mock.calls.map(([, config]) => config.params.page)).toEqual([1, 2]);
        expect(screen.getByRole('button', { name: 'Open Page 1' })).toBeInTheDocument();
        expect(screen.getByText('You’ve reached the end.')).toBeInTheDocument();
        expect(disconnect).toHaveBeenCalled();
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Top rated' })); });
        await waitFor(() => expect(axios.get.mock.calls.at(-1)[0]).toContain(`/${type}/top_rated`));
        expect(axios.get.mock.calls.at(-1)[1].params.page).toBe(1);
        expect(screen.queryByRole('button', { name: 'Open Page 2' })).not.toBeInTheDocument();
        expect(screen.getByTestId('location')).toHaveTextContent('view=top_rated');
    } finally {
        delete window.IntersectionObserver;
    }
});

test('infinite loading retains existing titles after failure and retries the same page', async () => {
    let intersect;
    window.IntersectionObserver = jest.fn(callback => {
        intersect = callback;
        return { observe: jest.fn(), disconnect: jest.fn() };
    });
    axios.get.mockResolvedValueOnce(response([movie], 2))
        .mockRejectedValueOnce(new Error('Offline'))
        .mockResolvedValueOnce(response([{ ...movie, id: 13, title: 'Next Movie' }], 2));
    try {
        await act(async () => { render(<MemoryRouter><MoviesList /></MemoryRouter>); });
        await screen.findByRole('button', { name: 'Open Test Movie' });
        await act(async () => { intersect([{ isIntersecting: true }]); });
        expect(await screen.findByRole('alert')).toHaveTextContent('Titles could not be loaded');
        expect(screen.getByRole('button', { name: 'Open Test Movie' })).toBeInTheDocument();
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Try again' })); });
        await screen.findByRole('button', { name: 'Open Next Movie' });
        expect(axios.get.mock.calls.map(([, config]) => config.params.page)).toEqual([1, 2, 2]);
    } finally {
        delete window.IntersectionObserver;
    }
});

test('Explore discovers genres, shares filters in the URL, and clears movie genres when switching to TV', async () => {
    window.IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }));
    try {
        await act(async () => { render(<MemoryRouter initialEntries={['/explore']}><ExploreAll /><Location /></MemoryRouter>); });
        await screen.findByRole('button', { name: 'Action' });
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Action' })); });
        await waitFor(() => expect(axios.get.mock.calls.filter(([url]) => url.endsWith('/discover/movie')).at(-1)[1].params.with_genres).toBe('28'));
        expect(screen.getByRole('heading', { name: 'Popular · Action' })).toBeInTheDocument();
        await act(async () => { fireEvent.change(screen.getByLabelText('Collection'), { target: { value: 'top_rated' } }); });
        await waitFor(() => expect(axios.get.mock.calls.filter(([url]) => url.endsWith('/discover/movie')).at(-1)[1].params).toMatchObject({ sort_by: 'vote_average.desc', 'vote_count.gte': 300 }));
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'TV shows' })); });
        await waitFor(() => expect(axios.get.mock.calls.some(([url]) => url.endsWith('/discover/tv'))).toBe(true));
        expect(screen.getByTestId('location')).toHaveTextContent('type=tv');
        expect(screen.getByTestId('location')).not.toHaveTextContent('genre=');
        expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    } finally {
        delete window.IntersectionObserver;
    }
});

test('Anime retains Japanese animation constraints across genres, collections, and movie switching', async () => {
    window.IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }));
    try {
        await act(async () => { render(<MemoryRouter initialEntries={['/anime']}><ExploreAll animeOnly /><Location /></MemoryRouter>); });
        expect(screen.getByRole('heading', { name: 'Anime', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Anime' })).toHaveAttribute('href', '/anime');
        await screen.findByRole('button', { name: 'Action' });
        const latestDiscover = type => axios.get.mock.calls.filter(([url]) => url.endsWith(`/discover/${type}`)).at(-1)[1].params;
        expect(latestDiscover('tv')).toMatchObject({ with_genres: '16', with_original_language: 'ja', with_origin_country: 'JP' });
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Action' })); });
        expect(latestDiscover('tv')).toMatchObject({ with_genres: '16,28', with_original_language: 'ja', with_origin_country: 'JP' });
        await act(async () => { fireEvent.change(screen.getByLabelText('Collection'), { target: { value: 'top_rated' } }); });
        expect(latestDiscover('tv')).toMatchObject({ with_genres: '16,28', sort_by: 'vote_average.desc', with_original_language: 'ja' });
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Movies' })); });
        expect(latestDiscover('movie')).toMatchObject({ with_genres: '16', with_original_language: 'ja', with_origin_country: 'JP', page: 1 });
        expect(screen.getByTestId('location')).not.toHaveTextContent('genre=');
        expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    } finally {
        delete window.IntersectionObserver;
    }
});


function ModalHarness() {
    const [selection, setSelection] = React.useState(null);
    return <><button onClick={() => setSelection({ item: movie, type: 'movie' })}>Show movie</button>
        <button onClick={() => setSelection({ item: tv, type: 'tv' })}>Show TV</button>
        <MediaDetails selection={selection} onSelect={(item, type) => setSelection({ item, type })} onClose={() => setSelection(null)} /></>;
}

test('closing movie and TV details in Strict Mode releases the page scroll lock', async () => {
    await act(async () => { render(<React.StrictMode><ModalHarness /></React.StrictMode>); });
    for (const label of ['Show movie', 'Show TV', 'Show movie']) {
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: label })); });
        expect(document.body).toHaveClass('ReactModal__Body--open');
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Close' })); });
        expect(document.body).not.toHaveClass('ReactModal__Body--open');
        expect(document.getElementById('root')).not.toHaveAttribute('aria-hidden', 'true');
    }
});

test('leaving a page with open details releases the scroll lock', async () => {
    let view;
    await act(async () => { view = render(<React.StrictMode><ModalHarness /></React.StrictMode>); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Show TV' })); });
    expect(document.body).toHaveClass('ReactModal__Body--open');
    await act(async () => { view.unmount(); });
    expect(document.body).not.toHaveClass('ReactModal__Body--open');
    expect(document.getElementById('root')).not.toHaveAttribute('aria-hidden', 'true');
});

test('catalog loading starts several screens ahead and warms incoming poster images', async () => {
    let intersect;
    window.IntersectionObserver = jest.fn(callback => {
        intersect = callback;
        return { observe: jest.fn(), disconnect: jest.fn() };
    });
    const OriginalImage = window.Image;
    const posters = [];
    window.Image = jest.fn(() => {
        const image = {};
        posters.push(image);
        return image;
    });
    axios.get.mockResolvedValueOnce(response([{ ...movie, poster_path: '/first.jpg' }], 2))
        .mockResolvedValueOnce(response([{ ...movie, id: 13, title: 'Next Movie', poster_path: '/next.jpg' }], 2));
    try {
        await act(async () => { render(<MemoryRouter><MoviesList /></MemoryRouter>); });
        await screen.findByRole('button', { name: 'Open Test Movie' });
        expect(window.IntersectionObserver).toHaveBeenLastCalledWith(expect.any(Function), {
            rootMargin: `${Math.max(1800, window.innerHeight * 3)}px 0px`
        });
        expect(posters[0].src).toBe('https://image.tmdb.org/t/p/w342/first.jpg');
        await act(async () => { intersect([{ isIntersecting: true }]); });
        await screen.findByRole('button', { name: 'Open Next Movie' });
        expect(posters[1].src).toBe('https://image.tmdb.org/t/p/w342/next.jpg');
        expect(axios.get.mock.calls.map(([, config]) => config.params.page)).toEqual([1, 2]);
    } finally {
        window.Image = OriginalImage;
        delete window.IntersectionObserver;
    }
});

test('scrolling down fetches ahead before the bottom observer becomes visible', async () => {
    window.IntersectionObserver = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }));
    const originalScrollY = window.scrollY;
    axios.get.mockResolvedValueOnce(response([movie], 2))
        .mockResolvedValueOnce(response([{ ...movie, id: 13, title: 'Ready Ahead' }], 2));
    try {
        await act(async () => { render(<MemoryRouter><MoviesList /></MemoryRouter>); });
        await screen.findByRole('button', { name: 'Open Test Movie' });
        const sentinel = document.querySelector('.results-status');
        sentinel.getBoundingClientRect = () => ({ top: window.innerHeight * 5 });
        await act(async () => { fireEvent.scroll(window); });
        expect(axios.get).toHaveBeenCalledTimes(1);
        Object.defineProperty(window, 'scrollY', { configurable: true, value: originalScrollY + 100 });
        await act(async () => { fireEvent.scroll(window); fireEvent.scroll(window); });
        await screen.findByRole('button', { name: 'Open Ready Ahead' });
        expect(axios.get.mock.calls.map(([, config]) => config.params.page)).toEqual([1, 2]);
    } finally {
        Object.defineProperty(window, 'scrollY', { configurable: true, value: originalScrollY });
        delete window.IntersectionObserver;
    }
});
