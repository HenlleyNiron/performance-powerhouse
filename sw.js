const CACHE_PREFIX = 'powerhouse-';
const CACHE = `${CACHE_PREFIX}v5.1.0`;
const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './css/v5.css',
  './js/core.js',
  './js/app.js',
  './js/v5-additions.js',
  './community-share.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './study-tracker/',
  './study-tracker/index.html',
  './study-tracker/tracker.css',
  './study-tracker/tracker.js',
  './physics-intelligence/',
  './physics-intelligence/index.html',
  './physics-intelligence/styles.css',
  './physics-intelligence/app.js',
  './physics-intelligence/assets/physics-intelligence-data.json',
];

const CACHEABLE_URLS = new Set(
  ASSETS.map(asset => new URL(asset, self.registration.scope).href),
);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map(key => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function canStore(response) {
  if (!response?.ok) return false;
  const cacheControl = response.headers.get('cache-control') || '';
  return !/(?:^|,)\s*(?:no-store|private)\b/i.test(cacheControl);
}

async function offlineResponse(request, url) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  if (request.mode === 'navigate') {
    if (url.pathname.includes('/study-tracker')) {
      return cache.match('./study-tracker/index.html');
    }
    if (url.pathname.includes('/physics-intelligence')) {
      return cache.match('./physics-intelligence/index.html');
    }
    return cache.match('./index.html');
  }

  return Response.error();
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const normalizedUrl = new URL(url.href);
  normalizedUrl.search = '';
  const isAppAsset = CACHEABLE_URLS.has(normalizedUrl.href);

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (isAppAsset && canStore(response)) {
        const cacheWrite = caches.open(CACHE)
          .then(cache => cache.put(request, response.clone()));
        event.waitUntil(cacheWrite);
      }
      return response;
    } catch {
      return offlineResponse(request, url);
    }
  })());
});
