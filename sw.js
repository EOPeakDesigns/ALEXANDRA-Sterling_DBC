const CACHE_VERSION = 'dbc-v3';
const CACHE_NAME = `business-card-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/icons/favicon/png/android-chrome-192x192.png',
  '/assets/icons/favicon/png/android-chrome-512x512.png',
  '/assets/icons/favicon/png/apple-touch-icon.png'
];

const NETWORK_ONLY_PATHS = new Set([
  '/manifest.webmanifest',
  '/sw.js'
]);

const NETWORK_FIRST_PREFIXES = [
  '/',
  '/index.html',
  '/js/',
  '/styles/',
  '/data/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key.startsWith('business-card-') && key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (NETWORK_ONLY_PATHS.has(requestUrl.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === 'navigate' || isNetworkFirst(requestUrl.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetchAndCache(event.request);
    })
  );
});

function isNetworkFirst(pathname) {
  return NETWORK_FIRST_PREFIXES.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)
  );
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }

        return Response.error();
      })
    );
}

function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request));
}
