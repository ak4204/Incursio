// CACHE VERSION — bump this to force ALL clients to clear old cache instantly
const CACHE_NAME = 'incursio-v11';

const PRECACHE = [
    '/home.html',
    '/alerts.html',
    '/forecast.html',
    '/profile.html',
    '/index.html',
    '/app.css',
    '/nav.js',
    '/styles/styles.css',
    '/manifest.json',
    '/libs/earth/1.0.0/micro.js',
    '/libs/earth/1.0.0/globes.js',
    '/libs/earth/1.0.0/products.js',
    '/libs/earth/1.0.0/earth.js'
];

// Install: cache all static assets
self.addEventListener('install', event => {
    self.skipWaiting(); // take over immediately, don't wait
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
    );
});

// Activate: delete ALL old caches immediately
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Deleting old cache:', key);
                    return caches.delete(key);
                }
            }))
        ).then(() => self.clients.claim()) // take control of all pages now
    );
});

// Fetch: NETWORK FIRST for HTML pages so we always get fresh content
// Cache first for static assets (JS, CSS)
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Always bypass cache for external APIs
    if (url.hostname !== location.hostname) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Root URL → serve home.html (mirror what dev-server does)
    if (url.pathname === '/' || url.pathname === '') {
        event.respondWith(
            fetch('/home.html').catch(() => caches.match('/home.html'))
        );
        return;
    }

    // Network-first for HTML pages so updates are always reflected
    if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for JS/CSS/fonts
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            });
        })
    );
});
