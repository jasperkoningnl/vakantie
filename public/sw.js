const CACHE_PAGES = 'pages-v2';
const CACHE_STATIC = 'static-v2';
const CACHE_EXTERNAL = 'external-v2';

const PROTECTED_PATHS = ['/medisch', '/voor-thuis', '/api/'];
const PRECACHE_URLS = ['/', '/nood', '/route', '/vandaag'];

// ---------------------------------------------------------------------------
// Install – pre-cache shell pages, skip waiting immediately
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGES).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url)
            .then((res) => {
              if (res.ok) cache.put(url, res);
            })
            .catch(() => {/* ignore network errors during install */})
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate – delete old cache versions and any previously cached private pages
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.endsWith('-v2'))
          .map((key) => caches.delete(key))
      )
    )
      .then(() => caches.open(CACHE_PAGES))
      .then((cache) => Promise.all(PROTECTED_PATHS.map((path) => cache.delete(path))))
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http(s) requests (chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) return;

  const isExternal =
    url.hostname !== 'localhost' &&
    url.hostname !== '127.0.0.1' &&
    url.hostname !== self.location.hostname;

  // 1. Next.js immutable static assets – cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // 2. External hostnames – network-first with external cache fallback → 503
  if (isExternal) {
    event.respondWith(networkFirstExternal(request));
    return;
  }

  // 3. API routes – network-only for private data; never cache authenticated responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnlyApi(request));
    return;
  }

  // 4. Navigation requests – network-first. Protected pages are not cached.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  // 5. Everything else – network-first, fallback to any cache match
  event.respondWith(networkFirstGeneric(request));
});

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

/** Cache-first: return cached asset, or fetch & store on miss. */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

/** Network-first for external resources; cache on success, 503 if both fail. */
async function networkFirstExternal(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_EXTERNAL);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Service unavailable', { status: 503 });
  }
}

/** Network-only for /api/ routes to avoid storing private authenticated data. */
async function networkOnlyApi(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Network-first for navigate requests; fallback → cached page → '/' → 503. */
async function networkFirstNavigate(request) {
  try {
    const response = await fetch(request);
    if (response.ok && !isProtectedNavigation(request)) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const root = await caches.match('/');
    if (root) return root;
    return new Response('Offline', { status: 503 });
  }
}

/** Network-first for all other same-origin requests; fallback to any cache. */
async function networkFirstGeneric(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

function isProtectedNavigation(request) {
  const url = new URL(request.url);
  return PROTECTED_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
}
