// Service Worker for TB DC 50K — Offline caching
importScripts('/config.js');

const CACHE_NAME = 'tb50k-v18';

// Build versioned asset paths from ASSET_VERSIONS (single source of truth in config.js)
function versionedPath(file) {
  const v = typeof ASSET_VERSIONS !== 'undefined' && ASSET_VERSIONS[file];
  return v ? `/${file}?v=${v}` : `/${file}`;
}

// Core assets — cached on install (required for initial page load)
const CORE_ASSETS = [
  '/',
  '/index.html',
  versionedPath('style.css'),
  versionedPath('app.js'),
  versionedPath('stops.js'),
  versionedPath('pins.js'),
  versionedPath('pace.js'),
  versionedPath('race.js'),
  versionedPath('tools.js'),
  '/events.js',
  '/elevation.js',
  '/gpx_data.js',
  '/backend-loader.js?v=1',
  '/block_parties.json',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Backend assets — NOT cached on install; cached on-demand when lazy-loaded
// (Supabase SDK, config, auth, db, prefs-sync, food-log, social-feed, party, betting)

// Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('SW: Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Network-first for API endpoints and dynamic data
  if (url.hostname.includes('api.weather.gov') ||
      url.hostname.includes('overpass-api.de') ||
      url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for map tiles (large, rarely change)
  if (url.hostname.includes('basemaps.cartocdn.com') ||
      url.hostname.includes('tile.openstreetmap.org') ||
      url.hostname.includes('tile.opentopomap.org') ||
      url.hostname.includes('arcgisonline.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
