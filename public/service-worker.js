const CACHE_NAME = 'incursio-cache-v3';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/styles.css',
    '/manifest.json',
    '/icon-192.svg',
    '/icon-512.svg',
    '/libs/earth/1.0.0/micro.js',
    '/libs/earth/1.0.0/globes.js',
    '/libs/earth/1.0.0/products.js',
    '/libs/earth/1.0.0/earth.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Network-First for API calls (data folder or external API)
    if (url.pathname.startsWith('/data/') || url.hostname.includes('nominatim')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-First for static assets
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then(response => {
                return response;
            });
        })
    );
});
