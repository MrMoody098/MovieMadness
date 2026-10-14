# MovieMan

A React movie and TV browser with TMDB discovery, unified search and suggestions, a local watchlist, and viewing history. VidSrc is the sole embedded player.

## Run locally

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set `REACT_APP_TMDB_API_KEY` to your TMDB API key.
3. Run `npm start`.

## Local movie downloads

`npm start` now starts the site and the local download bridge together. Open a movie or TV episode and choose **Find downloads**. For TV, the search starts with the selected season and episode; edit the search term to find a season pack if needed. The bridge runs on `127.0.0.1:3001`, searches with `npx torlnk`, and starts Torlink's downloader on `127.0.0.1:9161` when you select a result. Torlink saves the file in its configured downloads folder on your computer and continues downloading while the site is running. The first search can take longer while `npx` installs Torlink.

With Docker Compose, the bridge starts with either the development or production site and saves files to your host `~/Downloads` folder. A phone on the same Wi-Fi can open the site using the computer's local IP address and queue downloads on that computer through the site's `/local-downloads` route. The bridge itself stays on loopback for `npm start`; Docker publishes its port on host loopback. A static site hosted elsewhere cannot start a program on a visitor's computer, so a remote deployment still needs a local bridge. Use downloads you have permission to obtain.

For deployment, configure the same environment variable before running `npm run build`. Serve `build/` with a fallback to `index.html` for client-side routes such as `/search` and `/watchlist`.

## Install as a web app

Build and serve the app over HTTPS (or open it at `localhost` for local testing). Open the site in Chrome or Edge and choose **Install MovieMan** from the address bar or browser menu. On iPhone or iPad, open it in Safari, tap **Share**, then **Add to Home Screen**.

The installed app has its own window and caches its shell for offline launch. Movie and TV data still needs an internet connection. Keep the manifest, service worker, and icons in the deployed `build/` directory, and keep the route fallback described above.

## Verification

- `CI=true npm test -- --watchAll=false --runInBand`
- `npm run build`

Tests mock TMDB responses and cover search pagination, cancellation, suggestions, filters, recommendations, history, watchlist storage, and VidSrc episode selection.

## Recently watched

Watchlist and Recently watched are stored in this browser. Opening a title does not mark it watched. Use **Mark as watched** in the details to add a title to Recently watched.

The app does not save playback positions or resume a video or episode.

Search terms and discovery filters are stored in the URL for sharing and browser navigation.

Explore supports movies and TV, genre discovery, popular titles, top rated titles, and new releases. Explore and the movie/TV catalogs load additional pages automatically as you scroll.

The Anime section at `/anime` browses series and films using TMDB’s Animation genre, Japanese original language, and Japanese origin metadata. Popular, top rated, new releases, and additional genre filters retain these constraints. Classification depends on TMDB metadata.
