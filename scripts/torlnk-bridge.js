const http = require('node:http');
const { execFile, spawn } = require('node:child_process');

const PORT = 3001;
const HOST = process.env.MOVIEMADNESS_BRIDGE_HOST || '127.0.0.1';
const TORLNK_URL = 'http://127.0.0.1:9161';
const allowedOrigins = new Set(['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost', 'http://127.0.0.1']);
if (process.env.MOVIEMADNESS_ORIGIN) allowedOrigins.add(process.env.MOVIEMADNESS_ORIGIN.replace(/\/$/, ''));

let torlnkProcess;
let starting;

function json(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
}

function runSearch(query, category) {
    return new Promise((resolve, reject) => {
        execFile('npx', ['--yes', 'torlnk', 'search', query, '--category', category, '--timeout', '20s'],
            { timeout: 30000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout) => {
                try {
                    const data = JSON.parse(stdout);
                    if (!Array.isArray(data.results)) throw new Error('Invalid search response');
                    resolve(data);
                } catch (_) {
                    reject(error || new Error('Torlink did not return search results.'));
                }
            });
    });
}

async function ensureTorlnk() {
    try {
        const response = await fetch(`${TORLNK_URL}/health`, { signal: AbortSignal.timeout(1500) });
        if (response.ok) return;
    } catch (_) { /* Start the local downloader below. */ }
    if (starting) return starting;
    starting = new Promise((resolve, reject) => {
        const args = ['--yes', 'torlnk', 'serve', '--host', '127.0.0.1', '--port', '9161'];
        if (process.env.MOVIEMADNESS_DOWNLOAD_DIR) args.push('--to', process.env.MOVIEMADNESS_DOWNLOAD_DIR);
        torlnkProcess = spawn('npx', args, {
            stdio: ['ignore', 'ignore', 'pipe']
        });
        torlnkProcess.stderr.on('data', chunk => process.stderr.write(chunk));
        torlnkProcess.on('error', reject);
        const deadline = Date.now() + 60000;
        const poll = async () => {
            try {
                const response = await fetch(`${TORLNK_URL}/health`, { signal: AbortSignal.timeout(1500) });
                if (response.ok) return resolve();
            } catch (_) { /* The downloader is still starting. */ }
            if (torlnkProcess.exitCode !== null || torlnkProcess.signalCode !== null || Date.now() > deadline) return reject(new Error('Torlink could not start. Run npx torlnk serve in a terminal to inspect the error.'));
            setTimeout(poll, 500);
        };
        poll();
    }).finally(() => { starting = null; });
    return starting;
}

const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (!allowedOrigins.has(origin) || req.headers.host !== `127.0.0.1:${PORT}` && req.headers.host !== `localhost:${PORT}`) {
        return json(res, 403, { error: 'Origin not allowed.' });
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();

    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    try {
        if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, service: 'moviemadness-downloads' });
        if (req.method === 'GET' && url.pathname === '/search') {
            const query = (url.searchParams.get('query') || '').trim();
            if (!query || query.length > 120) return json(res, 400, { error: 'Enter a search term under 120 characters.' });
            const category = url.searchParams.get('category') || 'movies';
            if (!['movies', 'tv'].includes(category)) return json(res, 400, { error: 'Invalid search category.' });
            const data = await runSearch(query, category);
            return json(res, 200, { results: data.results.map(({ infoHash, name, sizeBytes, seeders, source, magnet }) =>
                ({ infoHash, name, sizeBytes, seeders, source, magnet })).filter(item => item.infoHash && item.magnet) });
        }
        if (req.method === 'POST' && url.pathname === '/download') {
            let body = '';
            for await (const chunk of req) {
                body += chunk;
                if (body.length > 8192) return json(res, 413, { error: 'Request too large.' });
            }
            const { magnet } = JSON.parse(body);
            if (typeof magnet !== 'string' || !/^magnet:\?xt=urn:btih:[a-z0-9]{32,40}(?:&|$)/i.test(magnet)) {
                return json(res, 400, { error: 'Invalid magnet link.' });
            }
            await ensureTorlnk();
            const response = await fetch(`${TORLNK_URL}/add`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ magnet }),
                signal: AbortSignal.timeout(10000)
            });
            const result = await response.json();
            return json(res, response.status, result);
        }
        return json(res, 404, { error: 'Not found.' });
    } catch (error) {
        console.error(error);
        return json(res, 502, { error: error.message || 'Torlink is unavailable.' });
    }
});

server.listen(PORT, HOST, () => console.log(`MovieMadness downloads listening on ${HOST}:${PORT}`));
function stop() { torlnkProcess?.kill(); server.close(); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
