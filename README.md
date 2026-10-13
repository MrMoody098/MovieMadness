# MovieMadness

MovieMadness is a React app for developers who want to browse TMDb movies and TV shows, search titles, and keep a watchlist in their browser.

<img width="1918" height="924" alt="Screenshot from 2026-10-13 20-05-48" src="https://github.com/user-attachments/assets/083003f6-a9ab-4f9d-8b2c-c79918578991" />


## Quickstart / Installation

From the repository root, with Node.js and npm installed:

```bash
cd movie-man-view
npm ci
cp .env.example .env.local
```

Edit `.env.local` and replace `your_tmdb_api_key` with a [TMDb API key](https://www.themoviedb.org/settings/api). Then start the development server:

```bash
npm start
```

Open <http://localhost:3000>. For a production build, run `npm run build` from `movie-man-view/` with the same environment variable set.

`npm start` also starts the local Torlink download bridge. Open a movie or TV episode and choose **Find downloads**; selected files download to this computer. The development Docker Compose setup maps the download folder to `~/Downloads`.

## Minimal usage example

With the server running, open this URL to search for a real title:

```text
http://localhost:3000/search?q=Arrival
```

Select a result to see its details. **Add to watchlist** saves that title in this browser. You can also open `/explore` to browse by media type, genre, or collection; those choices stay in the URL.

## Why this exists

TMDb provides catalog data, but browsing its API directly means assembling separate search, discovery, and detail requests. This app puts those requests behind one browser UI and keeps a small personal watchlist and viewing history in `localStorage`. Movie and TV playback is embedded from VidSrc; TMDb supplies the metadata, not the video.

## Configuration / Options

| Setting | Where | Purpose |
| --- | --- | --- |
| `REACT_APP_TMDB_API_KEY` | `movie-man-view/.env.local` | Required for TMDb search, discovery, and details. The app shows an error when it is missing. |
| Port | `npm start` | The development server uses port 3000 by default and prompts for another port if it is occupied. |

Environment variables prefixed with `REACT_APP_` are included in the browser bundle. Treat the TMDb key as a client-side API key, not a server secret. Restart the development server after changing `.env.local`.

The root `docker-compose.yml` and `docker-compose.prod.yml` provide container setups; see [DOCKER_README.md](DOCKER_README.md). For the production image, create `movie-man-view/.env.local` before building. The key is baked into the React bundle, so changing a container environment variable afterward has no effect.

## Gotchas / Limitations

- Watchlist and Recently watched titles live in browser storage. They do not sync between devices, and clearing site data removes them. Use **Mark as watched** in a title's details to add it to the list.
- The app does not track playback position or resume a video or episode.
- Search and catalog pages need access to TMDb. Embedded playback also depends on VidSrc being reachable and serving the selected title.
- The `src/utils/watchParty.js` helper is not wired into the app. It imports Firebase, which is not listed in `package.json`; watch parties are not a working feature.
- Client-side routes such as `/search` need a server fallback to `index.html` when serving a production build. The included Nginx configuration has that fallback.
