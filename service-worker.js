const CACHE_NAME = 'wealthbridge-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/auth.css',
    '/dashboard.css',
    '/landing.css',
    '/testimonials.css',
    '/variables.css',
    '/main.js',
    '/auth.js',
    '/api-service.js',
    '/dashboard.js',
    '/investments.js',
    '/portfolio.js',
    '/profile.js',
    '/settings.js',
    '/kyc.js',
    '/admin.js',
    '/contact.js',
    '/testimonials.js',
    '/plan-details.js',
    '/forms-handler.js',
    '/ui-interactions.js',
    '/chart-renderer.js',
    '/ui.js',
    '/utils.js',
    '/config.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache).catch(() => {
                console.log('Cache addAll completed with some failures (expected for optional resources)');
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Skip certain file types
    if (request.url.includes('.map')) {
        return;
    }

    event.respondWith(
        caches.match(request).then((response) => {
            if (response) {
                // Update cache in background
                fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                }).catch(() => {});
                
                return response;
            }

            return fetch(request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                return caches.match('/index.html');
            });
        })
    );
});
