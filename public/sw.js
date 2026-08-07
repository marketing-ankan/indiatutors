/* Indiatutors Online service worker — offline shell + static asset cache.
 *
 * Strategy:
 *  - /build/* (content-hashed Vite assets): cache-first, immutable
 *  - navigations (HTML): network-first, falling back to the cached shell
 *  - /api/*: network-only (never cache dynamic data)
 *  - icons/manifest/favicon: cache-first
 *
 * VERSION IS GENERATED — do not edit by hand. scripts/asset-version.mjs rewrites
 * the line below on every build with a content hash of public/images plus the
 * Vite manifest. Bumping it deletes the old caches in `activate`, which is what
 * makes replaced images appear without a hard refresh.
 *
 * It used to be a hand-typed 'v4'. Because /build/* is cached first and forever,
 * forgetting to bump it meant returning visitors kept being served the previous
 * image bytes indefinitely — exactly the "old photo until I hard-refresh" bug.
 */
const VERSION = 'd04ae787';
const SHELL_CACHE = `ito-shell-${VERSION}`;
const ASSET_CACHE = `ito-assets-${VERSION}`;
const SHELL_URLS = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => ![SHELL_CACHE, ASSET_CACHE].includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // network-only

  // Hashed build assets: cache-first (filenames change on every deploy).
  if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/icons/') || url.pathname === '/favicon.ico' || url.pathname === '/manifest.webmanifest') {
    event.respondWith(
      caches.open(ASSET_CACHE).then(cache =>
        cache.match(req).then(hit => hit || fetch(req).then(resp => {
          if (resp.ok) cache.put(req, resp.clone());
          return resp;
        }))
      )
    );
    return;
  }

  // Page navigations: network-first so content stays fresh; cached shell offline.
  // Only the real home page refreshes the stored shell — this used to overwrite
  // '/' with whatever page was last visited, so the offline fallback could be a
  // course page pretending to be the home page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(resp => {
          if (resp.ok && url.pathname === '/') {
            const copy = resp.clone();
            caches.open(SHELL_CACHE).then(c => c.put('/', copy));
          }
          return resp;
        })
        .catch(() => caches.match('/', { cacheName: SHELL_CACHE }))
    );
  }
});
