const CACHE_VERSION = 'dbc-v16';
const CACHE_NAME = `business-card-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './data/card.json',
  './styles/variables.css',
  './styles/base.css',
  './styles/components.css',
  './styles/animations.css',
  './styles/responsive.css',
  './js/main.js',
  './js/utils/clipboard.js',
  './js/utils/accessibility.js',
  './js/utils/contactLinks.js',
  './js/utils/vcard.js',
  './js/utils/share.js',
  './js/components/ContactRow.js',
  './js/components/SocialBar.js',
  './js/components/QRModal.js',
  './js/components/VideoModal.js?v=2',
  './js/components/InstallBanner.js',
  './js/components/ActionFlower.js',
  './assets/icons/favicon/site.webmanifest',
  './assets/icons/favicon/svg/favicon.svg',
  './assets/icons/favicon/png/apple-touch-icon.png',
  './assets/icons/favicon/png/android-chrome-192x192.png',
  './assets/icons/favicon/png/android-chrome-512x512.png',
  './assets/images/Owner.webp',
  './assets/images/MYQR.png'
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
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
