// Service worker — permite que las pantallas arranquen sin internet.
// HTML: red primero (recibe updates normal), caché si no hay conexión.
// img/ y fuentes: caché primero (no cambian; ahorra red en cada reload).
// Apps Script: NO se intercepta (los datos frescos van directo; localStorage cubre el offline).
const CACHE = 'emilios-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  const cacheFirst = () => caches.open(CACHE).then(c =>
    c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') c.put(e.request, res.clone());
      return res;
    }))
  );

  if (url.origin !== location.origin) {
    if (url.host.indexOf('fonts.g') === 0 || url.host.indexOf('fonts.') === 0) e.respondWith(cacheFirst());
    return; // Apps Script y demás cross-origin: directo a la red
  }

  if (url.pathname.indexOf('/img/') >= 0) {
    e.respondWith(cacheFirst());
  } else {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
  }
});
