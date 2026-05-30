// Service Worker for 课程记录 PWA
const CACHE_NAME = 'kecheng-v1';
const OFFLINE_FILES = [
  '/course-records/',
  '/course-records/index.html',
  '/course-records/manifest.json',
  '/course-records/icons/icon-192.png',
  '/course-records/icons/icon-512.png'
];

// Install: pre-cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_FILES).catch(() => {
        // Non-fatal if some files fail
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fall back to cache
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests (Supabase API etc.)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.origin.includes('github.io') && !url.hostname === location.hostname) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for same-origin resources
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
