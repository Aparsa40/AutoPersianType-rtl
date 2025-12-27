// AutoPersianType - Safe Production Service Worker
// Offline support + smart caching (no risky promises)

const STATIC_CACHE = 'AutoPersianType-static-v1';
const RUNTIME_CACHE = 'AutoPersianType-runtime-v1';

// حداقلی و امن: فقط چیزهایی که قطعاً وجود دارند
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// --------------------
// INSTALL
// --------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// --------------------
// ACTIVATE
// --------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// --------------------
// FETCH
// --------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // فقط GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // فقط same-origin (اصلاح امن)
  if (url.origin !== self.location.origin) return;

  // ---------- Static assets: cache-first ----------
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // ---------- Dynamic / SPA routes: network-first ----------
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, copy);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;

          // fallback برای SPA
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }

          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// --------------------
// HELPERS
// --------------------
function isStaticAsset(pathname) {
  const extensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp',
    '.woff',
    '.woff2',
    '.ttf'
  ];
  return (
    pathname === '/' ||
    pathname.endsWith('.html') ||
    extensions.some((ext) => pathname.endsWith(ext))
  );
}

// --------------------
// MESSAGES (safe only)
// --------------------
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_RUNTIME_CACHE') {
    caches.delete(RUNTIME_CACHE);
  }
});
