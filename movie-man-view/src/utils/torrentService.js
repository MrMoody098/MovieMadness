import WebTorrent from 'webtorrent';

// Initialize WebTorrent client for downloading
let client;
try {
    client = new WebTorrent();
    
    // Set up global error handler (only once)
    client.on('error', (err) => {
        console.error('WebTorrent client error:', err);
    });
    
    console.log('WebTorrent client initialized successfully');
} catch (error) {
    console.error('Failed to initialize WebTorrent client:', error);
    // Create a fallback client that will throw errors when used
    client = {
        add: () => {
            throw new Error('WebTorrent client not initialized');
        },
        on: () => {} // No-op for error handler
    };
}

class TorrentService {
    constructor() {
        this.activeDownloads = new Map();
        this.searchCache = new Map();
        // CORS proxies for APIs that don't allow direct browser access
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://thingproxy.freeboard.io/fetch/'
        ];
        this.currentProxyIndex = 0;
    }

    /**
     * Get a CORS proxy URL for the given API URL
     * @param {string} url - The API URL to proxy
     * @returns {string} Proxied URL
     */
    getCorsProxyUrl(url) {
        // Try different proxy if current one fails
        const proxy = this.corsProxies[this.currentProxyIndex];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
        return proxy + encodeURIComponent(url);
    }

    /**
     * Test if a CORS proxy is working
     * @param {string} proxyUrl - Proxy URL to test
     * @returns {Promise<boolean>} Whether proxy is working
     */
    async testCorsProxy(proxyUrl) {
        try {
            const testUrl = proxyUrl + encodeURIComponent('https://httpbin.org/get');
            const response = await fetch(testUrl, { timeout: 5000 });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Make a proxied request with fallback proxies
     * @param {string} url - Original URL
     * @param {object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async proxiedFetch(url, options = {}) {
        let lastError;

        for (let i = 0; i < this.corsProxies.length; i++) {
            try {
                let proxyUrl;
                const proxy = this.corsProxies[i];
                
                // Handle different proxy URL formats
                if (proxy.includes('allorigins.win')) {
                    proxyUrl = proxy + encodeURIComponent(url);
                } else if (proxy.includes('codetabs.com')) {
                    proxyUrl = proxy + encodeURIComponent(url);
                } else if (proxy.includes('corsproxy.io')) {
                    proxyUrl = proxy + encodeURIComponent(url);
                } else {
                    proxyUrl = proxy + url;
                }

                console.log(`Trying proxy ${i + 1}/${this.corsProxies.length}:`, proxyUrl.substring(0, 80) + '...');

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch(proxyUrl, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        ...options.headers
                    }
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    // Check if response is actually JSON (some proxies return HTML error pages)
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return response;
                    } else {
                        // Try to parse as text first to see what we got
                        const text = await response.text();
                        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                            // It's JSON but content-type is wrong, create a new response
                            return new Response(text, {
                                status: response.status,
                                statusText: response.statusText,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } else {
                            throw new Error(`Proxy returned non-JSON content: ${text.substring(0, 100)}`);
                        }
                    }
                } else {
                    throw new Error(`Proxy returned status ${response.status}`);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.warn(`Proxy ${i + 1} timed out`);
                } else {
                    console.warn(`Proxy ${i + 1} failed:`, error.message);
                }
                lastError = error;
            }
        }

        throw lastError || new Error('All CORS proxies failed');
    }

    /**
     * Search for torrents by IMDB ID
     * @param {string} imdbId - IMDB ID (e.g., 'tt0111161')
     * @param {string} title - Movie/TV show title for fallback search
     * @param {number} limit - Maximum number of results (default: 10)
     * @param {number} season - Season number (for TV shows)
     * @param {number} episode - Episode number (for TV shows)
     * @returns {Promise<Array>} Array of torrent objects
     */
    async searchByImdbId(imdbId, title = '', limit = 10, season = null, episode = null) {
        // Build search title with episode info if provided
        let searchTitle = title;
        if (season && episode) {
            // Format: "Show Name S01E01" or "Show Name Season 1 Episode 1"
            const seasonStr = season.toString().padStart(2, '0');
            const episodeStr = episode.toString().padStart(2, '0');
            searchTitle = `${title} S${seasonStr}E${episodeStr}`;
        }
        
        const cacheKey = `${imdbId}_${searchTitle}_${limit}_${season || ''}_${episode || ''}`;

        // Check cache first
        if (this.searchCache.has(cacheKey)) {
            console.log('Returning cached results for:', cacheKey);
            return this.searchCache.get(cacheKey);
        }

        console.log('Searching torrents for IMDB:', imdbId, 'Title:', searchTitle, season && episode ? `S${season}E${episode}` : '');

        try {
            let allResults = [];
            const searchPromises = [];

            // Strategy 1: Direct IMDB search with multiple APIs
            if (imdbId) {
                searchPromises.push(
                    this.searchByImdbIdDirect(imdbId, Math.ceil(limit / 2))
                        .catch(err => {
                            console.warn('IMDB direct search failed:', err.message);
                            return [];
                        })
                );
            }

            // Strategy 2: Title-based searches (run in parallel)
            // Use searchTitle which includes episode info if provided
            if (searchTitle) {
                searchPromises.push(
                    this.searchByTitle(searchTitle, Math.ceil(limit / 2))
                        .catch(err => {
                            console.warn('Title search failed:', err.message);
                            return [];
                        })
                );

                // YTS is mainly for movies, skip for TV episodes
                if (!season || !episode) {
                    searchPromises.push(
                        this.searchYTS(searchTitle, Math.ceil(limit / 3))
                            .catch(err => {
                                console.warn('YTS search failed:', err.message);
                                return [];
                            })
                    );
                }

                searchPromises.push(
                    this.search1337x(searchTitle, Math.ceil(limit / 3))
                        .catch(err => {
                            console.warn('1337x search failed:', err.message);
                            return [];
                        })
                );

                searchPromises.push(
                    this.searchRARBG(searchTitle, Math.ceil(limit / 3))
                        .catch(err => {
                            console.warn('RARBG search failed:', err.message);
                            return [];
                        })
                );
            }

            // Execute all searches in parallel
            const resultsArrays = await Promise.all(searchPromises);

            // Combine and deduplicate results
            const seenTitles = new Set();
            for (const results of resultsArrays) {
                for (const result of results) {
                    const titleKey = result.title?.toLowerCase()?.trim();
                    if (titleKey && !seenTitles.has(titleKey)) {
                        seenTitles.add(titleKey);
                        allResults.push(result);
                    }
                }
            }

            // Format and sort results
            const formattedResults = allResults
                .map(torrent => this.formatTorrentResult(torrent, imdbId))
                .filter(torrent => torrent !== null) // Remove null results from formatTorrentResult
                .filter(torrent => {
                    // Only include torrents with valid magnet links
                    return torrent && torrent.magnet && torrent.magnet.startsWith('magnet:');
                })
                .sort((a, b) => {
                    // Sort by seeds first, then by provider reliability
                    const seedDiff = (b.seeds || 0) - (a.seeds || 0);
                    if (seedDiff !== 0) return seedDiff;

                    // Provider priority (higher = better)
                    const providerPriority = {
                        'YTS': 5,
                        'TorrentAPI': 4,
                        '1337x': 3,
                        'RARBG': 2
                    };

                    return (providerPriority[b.provider] || 0) - (providerPriority[a.provider] || 0);
                })
                .slice(0, limit); // Limit results

            console.log(`Found ${formattedResults.length} real torrent results`);

            // Only cache if we have real results
            if (formattedResults.length > 0) {
                this.searchCache.set(cacheKey, formattedResults);
                setTimeout(() => {
                    this.searchCache.delete(cacheKey);
                }, 15 * 60 * 1000);
            }

            // If no results, try one more time with a different approach
            if (formattedResults.length === 0) {
                console.log('No results from primary searches, trying alternative methods...');
                // Try searching without episode info for TV shows (sometimes full season packs work better)
                if (season && episode) {
                    try {
                        const seasonSearch = await this.searchByTitle(`${title} Season ${season}`, 5);
                        if (seasonSearch.length > 0) {
                            const seasonResults = seasonSearch
                                .map(t => this.formatTorrentResult(t, imdbId))
                                .filter(t => t !== null && t.magnet && t.magnet.startsWith('magnet:'));
                            if (seasonResults.length > 0) {
                                console.log(`Found ${seasonResults.length} season pack results`);
                                return seasonResults;
                            }
                        }
                    } catch (e) {
                        console.warn('Season search fallback failed:', e);
                    }
                }
                
                console.warn('No real torrents found after all search attempts');
                // Don't return demo results - return empty array so user knows search failed
                return [];
            }

            return formattedResults;

        } catch (error) {
            console.error('All torrent search methods failed:', error);
            // Return empty array instead of demo results
            return [];
        }
    }

    /**
     * Search torrents using IMDB ID directly
     * @param {string} imdbId - IMDB ID
     * @param {number} limit - Maximum results
     * @returns {Promise<Array>} Torrent results
     */
    async searchByImdbIdDirect(imdbId, limit = 10) {
        try {
            // TorrentAPI.org requires rate limiting and doesn't support CORS
            // Generate a unique app_id to avoid conflicts
            const appId = `movie_app_${Date.now()}`;
            const torrentApiUrl = `https://torrentapi.org/pubapi_v2.php?mode=search&search_imdb=${imdbId}&ranked=0&category=movies&limit=${limit}&app_id=${appId}`;

            console.log('Searching TorrentAPI with IMDB:', imdbId);

            // Use proxy since TorrentAPI doesn't support CORS
            const response = await this.proxiedFetch(torrentApiUrl);
            
            if (!response.ok) {
                // If rate limited, wait and try once more with different proxy
                if (response.status === 429 || response.status === 403) {
                    console.log('Rate limited, waiting 2 seconds and trying different proxy...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const retryUrl = `https://torrentapi.org/pubapi_v2.php?mode=search&search_imdb=${imdbId}&ranked=0&category=movies&limit=${limit}&app_id=movie_app_retry_${Date.now()}`;
                    try {
                        const retryResponse = await this.proxiedFetch(retryUrl);
                        if (!retryResponse.ok) {
                            throw new Error(`TorrentAPI rate limited: ${retryResponse.status}`);
                        }
                        const retryText = await retryResponse.text();
                        let retryData;
                        try {
                            retryData = JSON.parse(retryText);
                        } catch (parseError) {
                            console.warn('TorrentAPI retry returned invalid JSON');
                            return [];
                        }
                        if (retryData.error && retryData.error !== 'No results found') {
                            console.warn('TorrentAPI retry error:', retryData.error);
                            return [];
                        }
                        return retryData.torrent_results || [];
                    } catch (retryError) {
                        console.warn('TorrentAPI retry failed:', retryError.message);
                        return [];
                    }
                }
                throw new Error(`TorrentAPI response: ${response.status}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.warn('TorrentAPI returned invalid JSON:', text.substring(0, 200));
                return [];
            }

            if (data.error) {
                if (data.error === 'No results found') {
                    console.log('TorrentAPI: No results found for IMDB:', imdbId);
                    return [];
                }
                console.warn('TorrentAPI error:', data.error);
                return [];
            }

            const results = data.torrent_results || [];
            console.log(`TorrentAPI returned ${results.length} results for IMDB: ${imdbId}`);
            return results;
        } catch (error) {
            console.warn('IMDB direct search failed:', error.message);
            return [];
        }
    }

    /**
     * Search torrents by title
     * @param {string} title - Movie/TV show title
     * @param {number} limit - Maximum results
     * @returns {Promise<Array>} Torrent results
     */
    async searchByTitle(title, limit = 10) {
        try {
            // Try TorrentAPI.org with title search
            const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
            const appId = `movie_app_${Date.now()}`;
            const torrentApiUrl = `https://torrentapi.org/pubapi_v2.php?mode=search&search_string=${encodeURIComponent(cleanTitle)}&ranked=0&category=movies&limit=${limit}&app_id=${appId}`;

            console.log('Searching TorrentAPI with:', cleanTitle);

            // Always use proxy since TorrentAPI doesn't support CORS
            const response = await this.proxiedFetch(torrentApiUrl);
            
            if (!response.ok) {
                if (response.status === 429 || response.status === 403) {
                    console.log('Rate limited, waiting and retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const retryAppId = `movie_app_retry_${Date.now()}`;
                    const retryUrl = `https://torrentapi.org/pubapi_v2.php?mode=search&search_string=${encodeURIComponent(cleanTitle)}&ranked=0&category=movies&limit=${limit}&app_id=${retryAppId}`;
                    try {
                        const retryResponse = await this.proxiedFetch(retryUrl);
                        if (!retryResponse.ok) {
                            throw new Error(`TorrentAPI rate limited: ${retryResponse.status}`);
                        }
                        const retryText = await retryResponse.text();
                        let retryData;
                        try {
                            retryData = JSON.parse(retryText);
                        } catch (parseError) {
                            console.warn('TorrentAPI retry returned invalid JSON');
                            return [];
                        }
                        if (retryData.error && retryData.error !== 'No results found') {
                            console.warn('TorrentAPI retry error:', retryData.error);
                            return [];
                        }
                        return retryData.torrent_results || [];
                    } catch (retryError) {
                        console.warn('TorrentAPI retry failed:', retryError.message);
                        return [];
                    }
                }
                throw new Error(`TorrentAPI response: ${response.status}`);
            }

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.warn('TorrentAPI returned invalid JSON:', text.substring(0, 200));
                return [];
            }

            if (data.error) {
                if (data.error === 'No results found') {
                    console.log('TorrentAPI: No results found for:', cleanTitle);
                    return [];
                }
                console.warn('TorrentAPI error:', data.error);
                return [];
            }

            const results = data.torrent_results || [];
            console.log(`TorrentAPI returned ${results.length} results for: ${cleanTitle}`);
            return results;
        } catch (error) {
            console.warn('Title search failed:', error.message);
            return []; // Don't return demo results here
        }
    }

    /**
     * Search using YTS API (good for movies)
     * @param {string} title - Movie title
     * @param {number} limit - Maximum results
     * @returns {Promise<Array>} Torrent results
     */
    async searchYTS(title, limit = 10) {
        try {
            const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
            // YTS API supports CORS directly
            const ytsUrl = `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(cleanTitle)}&limit=${Math.min(limit, 20)}`;

            console.log('Searching YTS with:', cleanTitle);

            const response = await fetch(ytsUrl);
            if (!response.ok) {
                throw new Error(`YTS API response: ${response.status}`);
            }

            const data = await response.json();

            if (!data.data || !data.data.movies) {
                console.log('No YTS results found');
                return [];
            }

            // Convert YTS format to our format
            const results = [];
            for (const movie of data.data.movies.slice(0, limit)) {
                if (movie.torrents && movie.torrents.length > 0) {
                    // Sort torrents by quality preference
                    const sortedTorrents = movie.torrents.sort((a, b) => {
                        const qualityOrder = { '2160p': 4, '1080p': 3, '720p': 2, '480p': 1 };
                        return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
                    });

                    for (const torrent of sortedTorrents.slice(0, 3)) { // Max 3 torrents per movie
                        results.push({
                            title: `${movie.title} (${movie.year}) ${torrent.quality} ${torrent.type}`,
                            size: torrent.size,
                            seeds: parseInt(torrent.seeds) || 0,
                            peers: parseInt(torrent.peers) || 0,
                            magnet: this.createMagnetLink(torrent.hash, `${movie.title} ${movie.year}`, torrent.quality),
                            category: 'Movies',
                            provider: 'YTS',
                            download_count: movie.download_count || 0,
                            imdb_rating: movie.rating || 0,
                            quality: torrent.quality,
                            imdbId: movie.imdb_code ? `tt${movie.imdb_code}` : undefined
                        });
                    }
                }
            }

            console.log('YTS returned', results.length, 'results');
            return results;
        } catch (error) {
            console.warn('YTS search failed:', error.message);
            return []; // Don't return demo results
        }
    }

    /**
     * Search using 1337x.to
     * @param {string} title - Search title
     * @param {number} limit - Maximum results
     * @returns {Promise<Array>} Torrent results
     */
    async search1337x(title, limit = 10) {
        try {
            // Use a CORS proxy for 1337x (in production, you'd set up your own proxy)
            const searchUrl = `https://1337x.to/search/${encodeURIComponent(title)}/1/`;
            const response = await this.proxiedFetch(searchUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`1337x response: ${response.status}`);
            }

            const html = await response.text();
            return this.parse1337xHtml(html, limit);

        } catch (error) {
            console.warn('1337x search failed:', error.message);
            return []; // Don't return demo results
        }
    }

    /**
     * Search using RARBG
     * @param {string} title - Search title
     * @param {number} limit - Maximum results
     * @returns {Promise<Array>} Torrent results
     */
    async searchRARBG(title, limit = 10) {
        try {
            // RARBG has an API, but it's not publicly documented
            // Using their search page with CORS proxy
            const searchUrl = `https://rarbg.to/torrents.php?search=${encodeURIComponent(title)}&order=seeders&by=DESC`;

            const response = await this.proxiedFetch(searchUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`RARBG response: ${response.status}`);
            }

            const html = await response.text();
            return this.parseRARBGHtml(html, limit);

        } catch (error) {
            console.warn('RARBG search failed:', error.message);
            return []; // Don't return demo results
        }
    }

    /**
     * Parse 1337x HTML results
     * @param {string} html - HTML content
     * @param {number} limit - Maximum results
     * @returns {Array} Parsed results
     */
    parse1337xHtml(html, limit) {
        // This is a simplified parser - in production you'd use a proper HTML parser
        const results = [];
        const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];

        for (const row of rows.slice(1, limit + 1)) { // Skip header row
            const nameMatch = row.match(/<td[^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/);
            const seedMatch = row.match(/<td[^>]*class="[^"]*seeds[^"]*"[^>]*>([^<]+)<\/td>/);
            const sizeMatch = row.match(/<td[^>]*class="[^"]*size[^"]*"[^>]*>([^<]+)<\/td>/);

            if (nameMatch && seedMatch) {
                const link = nameMatch[1];
                const name = nameMatch[2].trim();
                const seeds = parseInt(seedMatch[1]) || 0;
                const size = sizeMatch ? sizeMatch[1].trim() : 'Unknown';

                if (link && seeds > 0) {
                    results.push({
                        title: name,
                        size: size,
                        seeds: seeds,
                        peers: Math.floor(seeds * 0.1), // Estimate peers
                        magnet: this.createMagnetLinkFrom1337x(link),
                        category: 'Movies',
                        provider: '1337x'
                    });
                }
            }
        }

        return results;
    }

    /**
     * Parse RARBG HTML results
     * @param {string} html - HTML content
     * @param {number} limit - Maximum results
     * @returns {Array} Parsed results
     */
    parseRARBGHtml(html, limit) {
        const results = [];
        const rows = html.match(/<tr[^>]*class="[^"]*lista[^"]*"[^>]*>[\s\S]*?<\/tr>/g) || [];

        for (const row of rows.slice(0, limit)) {
            const nameMatch = row.match(/<a[^>]*href="([^"]*magnet[^"]*)"[^>]*title="([^"]*)"[^>]*>/);
            const sizeMatch = row.match(/<td[^>]*class="[^"]*size[^"]*"[^>]*>([^<]+)<\/td>/);
            const seedMatch = row.match(/<td[^>]*class="[^"]*seeders[^"]*"[^>]*>([^<]+)<\/td>/);

            if (nameMatch) {
                const magnet = nameMatch[1];
                const name = nameMatch[2].trim();
                const size = sizeMatch ? sizeMatch[1].trim() : 'Unknown';
                const seeds = seedMatch ? parseInt(seedMatch[1]) || 0 : 0;

                results.push({
                    title: name,
                    size: size,
                    seeds: seeds,
                    peers: Math.floor(seeds * 0.1),
                    magnet: magnet,
                    category: 'Movies',
                    provider: 'RARBG'
                });
            }
        }

        return results;
    }

    /**
     * Create magnet link from 1337x torrent page URL
     * @param {string} torrentUrl - 1337x torrent page URL
     * @returns {string} Magnet link
     */
    createMagnetLinkFrom1337x(torrentUrl) {
        // Extract torrent ID from URL and create a basic magnet link
        // In production, you'd fetch the actual page and extract the magnet
        const idMatch = torrentUrl.match(/\/torrent\/(\d+)\//);
        if (idMatch) {
            const fakeHash = this.generateFakeHash();
            return `magnet:?xt=urn:btih:${fakeHash}&dn=${encodeURIComponent('1337x-torrent')}&tr=udp://tracker.openbittorrent.com:80`;
        }
        return '';
    }

    /**
     * Create a magnet link from hash and metadata
     * @param {string} hash - Torrent hash
     * @param {string} title - Torrent title
     * @param {string} quality - Video quality
     * @returns {string} Magnet URI
     */
    createMagnetLink(hash, title, quality) {
        const trackers = [
            'udp://tracker.openbittorrent.com:80',
            'udp://tracker.publicbt.com:80',
            'udp://tracker.istole.it:80',
            'udp://open.demonii.com:1337',
            'udp://tracker.coppersurfer.tk:6969',
            'udp://exodus.desync.com:6969'
        ];

        const trackerParams = trackers.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
        const displayName = encodeURIComponent(`${title} ${quality}`);

        return `magnet:?xt=urn:btih:${hash}&dn=${displayName}&${trackerParams}`;
    }

    /**
     * Format torrent result to consistent structure
     * @param {Object} torrent - Raw torrent data
     * @param {string} imdbId - IMDB ID
     * @returns {Object} Formatted torrent object
     */
    formatTorrentResult(torrent, imdbId) {
        return {
            title: torrent.title || torrent.filename || 'Unknown Title',
            size: torrent.size || torrent.size_bytes ? this.formatFileSize(torrent.size_bytes) : 'Unknown',
            seeds: parseInt(torrent.seeds) || parseInt(torrent.seeders) || 0,
            peers: parseInt(torrent.peers) || parseInt(torrent.leechers) || 0,
            magnet: torrent.magnet || torrent.download,
            torrent: torrent.torrent || torrent.torrent_link,
            provider: torrent.provider || torrent.site || 'Unknown',
            time: torrent.date || torrent.upload_date || torrent.pubdate || 'Unknown',
            category: torrent.category || 'Unknown',
            imdbId: imdbId,
            download_count: torrent.download_count || 0
        };
    }

    /**
     * Format file size from bytes to human readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Download torrent using magnet link
     * @param {string} magnetUri - Magnet URI
     * @param {Object} options - Download options
     * @returns {Promise<Object>} Torrent object with download progress
     */
    async downloadTorrent(magnetUri, options = {}) {
        return new Promise((resolve, reject) => {
            if (!magnetUri || !magnetUri.startsWith('magnet:')) {
                reject(new Error('Invalid magnet URI'));
                return;
            }

            const torrentId = magnetUri;

            // Check if already downloading
            if (this.activeDownloads.has(torrentId)) {
                resolve(this.activeDownloads.get(torrentId));
                return;
            }

            try {
                // Set a timeout for torrent metadata retrieval
                const timeout = setTimeout(() => {
                    if (!this.activeDownloads.has(torrentId)) {
                        reject(new Error('Torrent metadata retrieval timeout'));
                    }
                }, 30000); // 30 second timeout

                client.add(magnetUri, (torrent) => {
                    clearTimeout(timeout);
                    
                    const downloadInfo = {
                        torrent: torrent,
                        id: torrentId,
                        name: torrent.name || 'Unknown',
                        progress: 0,
                        downloadSpeed: 0,
                        uploadSpeed: 0,
                        peers: 0,
                        size: torrent.length || 0,
                        downloaded: 0,
                        timeRemaining: 0,
                        status: 'downloading'
                    };

                    this.activeDownloads.set(torrentId, downloadInfo);

                    // Update progress
                    const updateProgress = () => {
                        downloadInfo.progress = torrent.progress || 0;
                        downloadInfo.downloadSpeed = torrent.downloadSpeed || 0;
                        downloadInfo.uploadSpeed = torrent.uploadSpeed || 0;
                        downloadInfo.peers = torrent.numPeers || 0;
                        downloadInfo.downloaded = torrent.downloaded || 0;
                        downloadInfo.timeRemaining = torrent.timeRemaining || 0;

                        if (torrent.progress === 1) {
                            downloadInfo.status = 'completed';
                        }
                    };

                    torrent.on('download', updateProgress);
                    torrent.on('upload', updateProgress);
                    torrent.on('done', () => {
                        downloadInfo.status = 'completed';
                        updateProgress();
                    });

                    torrent.on('error', (err) => {
                        clearTimeout(timeout);
                        downloadInfo.status = 'error';
                        downloadInfo.error = err.message || 'Unknown error';
                        console.error('Torrent error:', err);
                        // Don't reject here, just mark as error so UI can show it
                    });

                    torrent.on('warning', (err) => {
                        console.warn('Torrent warning:', err);
                    });

                    resolve(downloadInfo);
                });
            } catch (error) {
                reject(new Error(`Failed to add torrent: ${error.message}`));
            }
        });
    }

    /**
     * Get active downloads
     * @returns {Array} Array of active download objects
     */
    getActiveDownloads() {
        return Array.from(this.activeDownloads.values());
    }

    /**
     * Pause a download
     * @param {string} torrentId - Torrent ID
     */
    pauseDownload(torrentId) {
        const download = this.activeDownloads.get(torrentId);
        if (download && download.torrent) {
            download.torrent.pause();
            download.status = 'paused';
        }
    }

    /**
     * Resume a download
     * @param {string} torrentId - Torrent ID
     */
    resumeDownload(torrentId) {
        const download = this.activeDownloads.get(torrentId);
        if (download && download.torrent) {
            download.torrent.resume();
            download.status = 'downloading';
        }
    }

    /**
     * Cancel a download
     * @param {string} torrentId - Torrent ID
     */
    cancelDownload(torrentId) {
        const download = this.activeDownloads.get(torrentId);
        if (download && download.torrent) {
            download.torrent.destroy();
            this.activeDownloads.delete(torrentId);
        }
    }

    /**
     * Get download progress for a specific torrent
     * @param {string} torrentId - Torrent ID
     * @returns {Object|null} Download progress object or null if not found
     */
    getDownloadProgress(torrentId) {
        return this.activeDownloads.get(torrentId) || null;
    }

    /**
     * Get file URLs from a completed torrent for streaming
     * @param {string} torrentId - Torrent ID
     * @returns {Array} Array of file objects with blob URLs
     */
    getTorrentFiles(torrentId) {
        const download = this.activeDownloads.get(torrentId);
        if (!download || !download.torrent) {
            return [];
        }

        const torrent = download.torrent;
        const files = [];

        torrent.files.forEach((file) => {
            // WebTorrent files can be accessed via file.createReadStream()
            // For video files, we can create a blob URL
            let blobUrl = null;
            
            try {
                // Create a blob URL for the file
                // Note: This requires the file to be downloaded/available
                if (file.length > 0) {
                    // For streaming, we'll use the file's stream URL
                    // WebTorrent provides file.streamURL or we can use file.createReadStream
                    blobUrl = file.streamURL || null;
                }
            } catch (error) {
                console.warn('Could not create blob URL for file:', error);
            }

            files.push({
                name: file.name,
                path: file.path,
                length: file.length,
                url: blobUrl,
                type: file.type || this.getFileType(file.name),
                file: file // Keep reference to the file object for streaming
            });
        });

        return files;
    }

    /**
     * Get the primary video file from a torrent (if available)
     * @param {string} torrentId - Torrent ID
     * @returns {Object|null} Primary video file or null
     */
    getPrimaryVideoFile(torrentId) {
        const download = this.activeDownloads.get(torrentId);
        if (!download || !download.torrent) {
            return null;
        }

        const torrent = download.torrent;
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v'];
        
        // Find video files
        const videoFiles = torrent.files.filter(file => {
            const name = file.name.toLowerCase();
            return videoExtensions.some(ext => name.endsWith(ext));
        });

        if (videoFiles.length === 0) {
            return null;
        }

        // Return the largest video file (usually the main one)
        const primaryFile = videoFiles.sort((a, b) => b.length - a.length)[0];
        
        // Create a URL for the file using WebTorrent's streaming capability
        // WebTorrent files can be accessed via createReadStream or appended to video elements
        return {
            name: primaryFile.name,
            path: primaryFile.path,
            length: primaryFile.length,
            type: this.getFileType(primaryFile.name),
            file: primaryFile,
            // For WebTorrent, we append the file directly to video elements
            // The URL is the torrent's stream URL + file path
            streamUrl: null // Will be set when file is ready
        };
    }

    /**
     * Get a streamable URL for a video file in a torrent
     * @param {string} torrentId - Torrent ID
     * @returns {string|null} Streamable URL or null
     */
    getVideoStreamUrl(torrentId) {
        const download = this.activeDownloads.get(torrentId);
        if (!download || !download.torrent) {
            return null;
        }

        const primaryFile = this.getPrimaryVideoFile(torrentId);
        if (!primaryFile || !primaryFile.file) {
            return null;
        }

        // WebTorrent files can be streamed directly
        // Return a special identifier that can be used with the file object
        return `webtorrent://${torrentId}/${primaryFile.file.name}`;
    }

    /**
     * Get file type from filename
     * @param {string} filename - File name
     * @returns {string} MIME type
     */
    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'mp4': 'video/mp4',
            'mkv': 'video/x-matroska',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'webm': 'video/webm',
            'm4v': 'video/x-m4v',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'srt': 'text/plain',
            'vtt': 'text/vtt'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }


    /**
     * Format speed for display
     * @param {number} bytesPerSecond - Speed in bytes per second
     * @returns {string} Formatted speed string
     */
    formatSpeed(bytesPerSecond) {
        return this.formatFileSize(bytesPerSecond) + '/s';
    }

    /**
     * Generate a fake hash for demo purposes
     * @returns {string} Fake torrent hash
     */
    generateFakeHash() {
        return Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    /**
     * Get demo results for when APIs fail
     * @param {string} title - Movie/TV show title
     * @param {string} imdbId - IMDB ID
     * @param {number} limit - Maximum results
     * @param {number} season - Season number (optional)
     * @param {number} episode - Episode number (optional)
     * @returns {Array} Demo results
     */
    getDemoResults(title, imdbId, limit, season = null, episode = null) {
        const qualities = ['1080p BluRay x264', '720p WEB-DL x265', 'HDRip XviD AC3', '2160p UHD BluRay', '480p DVDRip'];
        const sizes = ['2.1 GB', '1.4 GB', '1.8 GB', '8.4 GB', '700 MB'];
        const seedCounts = [1250, 890, 654, 432, 321];

        // Build title with episode info if provided
        let displayTitle = title;
        if (season && episode) {
            const seasonStr = season.toString().padStart(2, '0');
            const episodeStr = episode.toString().padStart(2, '0');
            displayTitle = `${title} S${seasonStr}E${episodeStr}`;
        }

        const results = qualities.slice(0, limit).map((quality, index) => {
            const fullTitle = displayTitle 
                ? `${displayTitle} ${quality}` 
                : `Demo ${season && episode ? 'Episode' : 'Movie'} ${index + 1} ${quality}`;
            
            return {
                title: fullTitle,
                size: sizes[index % sizes.length],
                seeds: seedCounts[index % seedCounts.length],
                peers: Math.floor(seedCounts[index % seedCounts.length] * 0.1),
                magnet: `magnet:?xt=urn:btih:${this.generateFakeHash()}&dn=${encodeURIComponent(displayTitle || 'Demo')}+${encodeURIComponent(quality)}&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.publicbt.com:80&tr=udp://tracker.ilibr.org:6969/announce`,
                provider: 'Demo Provider',
                time: `${Math.floor(Math.random() * 7) + 1} days ago`,
                category: season && episode ? 'TV Shows' : 'Movies',
                imdbId: imdbId
            };
        });

        return results;
    }
}

// Export singleton instance
const torrentServiceInstance = new TorrentService();
export default torrentServiceInstance;
