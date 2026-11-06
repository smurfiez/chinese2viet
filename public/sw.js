/* Chinese2Viet service worker — hand-written, no build plugin.
 * Works with hashed Vite assets because runtime caching keys on the full URL,
 * so a new hash is simply a new cache entry and old entries age out with the
 * version bump.
 */

const VERSION = 'v1';
const STATIC_CACHE = `c2v-static-${VERSION}`;
const ASSET_CACHE = `c2v-assets-${VERSION}`;
const FONT_CACHE = `c2v-fonts-${VERSION}`;
const KEEP = new Set([STATIC_CACHE, ASSET_CACHE, FONT_CACHE]);
const PREFIX = 'c2v-';

// All relative: the SW scope is the app root, which matches Vite base './'.
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

const FONT_ORIGINS = new Set(['https://fonts.googleapis.com', 'https://fonts.gstatic.com']);
const FONT_CACHE_MAX = 40;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Individually, so one 404 cannot abort the whole install.
      Promise.all(
        PRECACHE.map((url) =>
          fetch(new Request(url, { cache: 'reload' }))
            .then((response) => {
              if (response.ok) return cache.put(url, response);
            })
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(PREFIX) && !KEEP.has(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// Only opt into the new worker when the page asks for it, so an in-flight
// session is never replaced underneath the user.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function cacheable(response) {
  if (!response) return false;
  // Opaque responses are only cacheable as long as they did not fail.
  return response.ok || response.type === 'opaque';
}

function trimCache(cacheName, maxEntries) {
  return caches.open(cacheName).then(async (cache) => {
    const keys = await cache.keys();
    const excess = keys.length - maxEntries;
    if (excess <= 0) return;
    await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
  });
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (cacheable(response)) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response.clone());
      // Always keep the app shell fresh for offline navigation on any route.
      if (response.ok) await cache.put('./index.html', response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const shell = (await caches.match('./index.html')) || (await caches.match('./'));
    if (shell) return shell;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (cacheable(response)) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const fresh = await network;
  if (fresh) return fresh;
  return new Response('', { status: 504, statusText: 'Offline' });
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (cacheable(response)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    if (maxEntries) await trimCache(cacheName, maxEntries);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  // Range requests (media seeking) cannot be stored reliably.
  if (request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  if (FONT_ORIGINS.has(url.origin)) {
    event.respondWith(cacheFirst(request, FONT_CACHE, FONT_CACHE_MAX));
  }
});
