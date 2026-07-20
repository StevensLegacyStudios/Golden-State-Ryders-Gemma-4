/* Isola — Alameda Eats service worker.
   Bump CACHE_VERSION on every deploy or users get stale data.js. */
const CACHE_VERSION = 'isola-v18';
const SHELL = ['./', './index.html', './data.js', './manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap'];
const IMG_CACHE = CACHE_VERSION + '-img';
const IMG_MAX = 60;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION && k !== IMG_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

async function cappedPut(cacheName, req, res) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length >= IMG_MAX) await cache.delete(keys[0]);
  await cache.put(req, res);
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // images + fonts: cache-first, capped for images
  if (url.hostname === 'images.unsplash.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        if (res.ok) cappedPut(url.hostname === 'images.unsplash.com' ? IMG_CACHE : CACHE_VERSION, e.request, res.clone());
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // app shell + everything else: network-first, cache fallback (offline support)
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: url.origin === location.origin }))
  );
});
