// Service Worker - Versão 3 (limpeza de cache)
const CACHE_NAME = 'ventila-beira-leito-clean-v11';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});
