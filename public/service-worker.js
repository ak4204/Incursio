// Incursio Service Worker — clean pass-through & cache clearer
const CACHE_NAME = 'incursio-clean-v1';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // Clear ALL caches immediately so no stale/broken files exist
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

// Pass all requests directly through to the network so pages and maps never fail with ERR_FAILED
self.addEventListener('fetch', event => {
    return;
});
