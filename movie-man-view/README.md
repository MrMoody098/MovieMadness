# MovieMan

A React movie and TV browser with TMDB discovery, unified search and suggestions, a local watchlist, and viewing history. VidSrc is the sole embedded player.

## Run locally

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set `REACT_APP_TMDB_API_KEY` to your TMDB API key.
3. Run `npm start`.

For deployment, configure the same environment variable before running `npm run build`. Serve `build/` with a fallback to `index.html` for client-side routes such as `/search` and `/watchlist`.

## Verification

- `CI=true npm test -- --watchAll=false --runInBand`
- `npm run build`

Tests mock TMDB responses and cover search pagination, cancellation, suggestions, filters, recommendations, history, watchlist storage, and VidSrc episode selection.

## Viewing progress

Watchlist, history, and checkpoints are stored in this browser. Opening a title does not mark it watched. Use **I’m watching**, **Mark watched**, or **Save position** in the details to update viewing history.

Continue Watching restores the saved TV season and episode. VidSrc.to does not document a parent-page playback-event or seek API, so timestamp checkpoints are manual: the app displays the saved time for seeking with the player's controls. It does not claim to restore playback time automatically.

Search terms and discovery filters are stored in the URL for sharing and browser navigation.
