const CACHE_NAME = 'movieman-shell-v1';
const APP_ROOT = new URL('./', self.registration.scope);
const SHELL_URL = new URL('index.html', APP_ROOT);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await cache.addAll([
        APP_ROOT.href,
        SHELL_URL.href,
        new URL('manifest.json', APP_ROOT).href,
        new URL('logo192.png', APP_ROOT).href,
        new URL('logo512.png', APP_ROOT).href,
        ]);
        const manifestResponse = await fetch(new URL('asset-manifest.json', APP_ROOT));
        if (manifestResponse.ok) {
          const { entrypoints = [] } = await manifestResponse.json();
          await cache.addAll(entrypoints.map(path => new URL(path.replace(/^\//, ''), APP_ROOT).href));
        }
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name.startsWith('movieman-shell-') && name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(APP_ROOT.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(SHELL_URL.href)));
    return;
  }

  if (!url.pathname.includes('/static/')) return;

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
