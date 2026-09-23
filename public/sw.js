/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'fastplayer-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-cache warning during install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== 'fastplayer-media-cache') {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. Never intercept non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // 2. Only intercept same-origin requests (app scripts, CSS, HTML).
  // NEVER intercept cross-origin requests (Dropbox, external videos, APIs, CDNs).
  // Passing cross-origin video/media through event.respondWith causes CORS blocks
  // and "TypeError: Failed to convert value to 'Response'".
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. Skip API and dynamic backend routes
  if (url.pathname.includes('/api/')) {
    return;
  }

  // 4. Never intercept video or audio media elements (browser needs native Range request pipeline)
  if (
    event.request.destination === 'video' ||
    event.request.destination === 'audio' ||
    event.request.headers.has('range')
  ) {
    return;
  }

  // For same-origin app assets:
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-while-revalidate for local app shell
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(async () => {
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('./index.html') || await caches.match('/index.html');
          if (fallback) return fallback;
        }
        return new Response('Network error occurred', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});

