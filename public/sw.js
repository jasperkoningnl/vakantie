const CACHE_VERSION = 'v5';
const CACHE_PAGES = `pages-${CACHE_VERSION}`;
const CACHE_STATIC = `static-${CACHE_VERSION}`;
const CACHE_RSC = `rsc-${CACHE_VERSION}`;
const EXPECTED_CACHES = [CACHE_PAGES, CACHE_STATIC, CACHE_RSC];
const LEGACY_CACHES = ['pages-v1', 'static-v1', 'external-v1', 'pages-v2', 'static-v2', 'external-v2', 'pages-v3', 'static-v3', 'pages-v4', 'static-v4', 'rsc-v4'];

const OFFLINE_STALE_MESSAGE = 'offline data mogelijk verouderd';
const SHELL_PAGES = ['/', '/vandaag', '/uitjes', '/dagboek', '/vertreklijst', '/nood', '/route'];
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
];
const NON_CACHEABLE_API_PATHS = ['/api/diary', '/api/photos', '/api/safe-arrival'];
const PROTECTED_PATHS = ['/medisch', '/voor-thuis', '/api/'];

// ---------------------------------------------------------------------------
// Install – pre-cache the public app shell and static public assets.
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_PAGES).then((cache) =>
        Promise.allSettled(
          SHELL_PAGES.map((url) =>
            fetch(url, { cache: 'reload' })
              .then((res) => {
                if (res.ok || res.type === 'opaqueredirect') {
                  cache.put(shellCacheKeyFromPath(url), res);
                }
              })
              .catch(() => {/* ignore network errors during install */})
          )
        )
      ),
      caches.open(CACHE_STATIC).then((cache) =>
        Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, { cache: 'reload' })
              .then((res) => {
                if (res.ok) cache.put(url, res);
              })
              .catch(() => {/* ignore network errors during install */})
          )
        )
      ),
    ]).then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate – explicitly delete old cache versions and previously cached private data.
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const cachesToDelete = keys.filter(
        (key) => LEGACY_CACHES.includes(key) || !EXPECTED_CACHES.includes(key)
      );

      return Promise.all(cachesToDelete.map((key) => caches.delete(key)));
    })
      .then(() => Promise.all(EXPECTED_CACHES.map((cacheName) => caches.open(cacheName))))
      .then(() => removeProtectedEntries())
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

  // Externe hostnames (kaart-tiles, externe API's): niet onderscheppen.
  // Native browser-requests behouden hun Referer-header; OSM blokkeert
  // tile-requests zonder Referer en Safari laat die header vallen bij
  // requests die een service worker opnieuw uitvoert.
  if (url.origin !== self.location.origin) return;

  if (request.method !== 'GET') {
    event.respondWith(networkOnly(request));
    return;
  }

  // 1. Next.js immutable static assets – cache-first.
  if (isImmutableNextAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // 3. API routes – network-only; diary/photos/safe-arrival are explicitly non-cacheable.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnlyApi(request));
    return;
  }

  // 4. Next.js App Router RSC/data requests – network-first, cached per public pathname.
  if (isRscRequest(request, url)) {
    event.respondWith(networkFirstRsc(request));
    return;
  }

  // 5. Navigation requests – network-first for public shell pages.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShellPage(request));
    return;
  }

  // 6. Same-origin static assets from /public – cache-first.
  if (isSameOriginStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // 7. Everything else – network-only. Only public shell pages and static assets are cached.
  event.respondWith(networkOnly(request));
});

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

/** Cache-first: return cached immutable/static asset, or fetch & store on miss. */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { ignoreSearch: false });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    return offlineFallbackResponse(request);
  }
}

/** Network-only for all non-cacheable requests. */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return offlineFallbackResponse(request);
  }
}

/** Network-only for /api/ routes to avoid storing private authenticated data. */
async function networkOnlyApi(request) {
  try {
    return await fetch(request);
  } catch {
    const url = new URL(request.url);
    const explicitlyNonCacheable = NON_CACHEABLE_API_PATHS.some((path) => pathMatches(url.pathname, path));

    return new Response(
      JSON.stringify({
        error: 'offline',
        message: OFFLINE_STALE_MESSAGE,
        cached: false,
        nonCacheable: explicitlyNonCacheable,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/** Network-first for RSC/data requests; cached offline fallback is marked as possibly stale. */
async function networkFirstRsc(request) {
  const url = new URL(request.url);

  if (!isShellPage(url) || isProtectedNavigation(request)) {
    return networkOnly(request);
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_RSC);
      cache.put(rscCacheKey(url), response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(rscCacheKey(url));
    if (cached) return markOfflineFallback(cached);
    return offlineFallbackResponse(request);
  }
}

/** Network-first for shell pages; cached offline fallback is marked as possibly stale. */
async function networkFirstShellPage(request) {
  const url = new URL(request.url);

  if (!isShellPage(url) || isProtectedNavigation(request)) {
    return networkOnly(request);
  }

  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaqueredirect') {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(shellCacheKey(url), response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(shellCacheKey(url));
    if (cached) return markOfflineFallback(cached);

    if (normalizePathname(url.pathname) === '/') {
      const homeFallback = await caches.match('/vandaag');
      if (homeFallback) return markOfflineFallback(homeFallback);
    }

    return offlineFallbackResponse(request);
  }
}

function isImmutableNextAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/_next/static/');
}

function isSameOriginStaticAsset(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/_next/')) return true;
  if (PRECACHE_ASSETS.includes(url.pathname)) return true;

  const staticDestinations = ['font', 'image', 'script', 'style'];
  if (staticDestinations.includes(request.destination)) return true;

  return /\.(?:css|js|mjs|png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf|json|webmanifest)$/i.test(url.pathname);
}

function isRscRequest(request, url) {
  return request.headers.get('RSC') === '1' || url.searchParams.has('_rsc');
}

function isShellPage(url) {
  return SHELL_PAGES.includes(normalizePathname(url.pathname));
}

function shellCacheKey(url) {
  return shellCacheKeyFromPath(url.pathname);
}

function shellCacheKeyFromPath(pathname) {
  const normalized = normalizePathname(pathname);
  return normalized === '/' ? '/' : normalized;
}

function rscCacheKey(url) {
  return `/__rsc${normalizePathname(url.pathname)}`;
}

function normalizePathname(pathname) {
  if (pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

function isProtectedNavigation(request) {
  const url = new URL(request.url);
  return PROTECTED_PATHS.some((path) => pathMatches(url.pathname, path));
}

function pathMatches(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

async function removeProtectedEntries() {
  const cacheNames = await caches.keys();
  const protectedDeletions = cacheNames.map(async (cacheName) => {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    return Promise.all(
      requests
        .filter((request) => {
          const url = new URL(request.url);
          return PROTECTED_PATHS.some((path) => pathMatches(url.pathname, path));
        })
        .map((request) => cache.delete(request))
    );
  });

  return Promise.all(protectedDeletions);
}

async function markOfflineFallback(response) {
  const contentType = response.headers.get('Content-Type') || '';
  const headers = new Headers(response.headers);
  headers.set('X-Offline-Fallback', OFFLINE_STALE_MESSAGE);

  if (!contentType.includes('text/html')) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const html = await response.text();
  const banner = `<div role="status" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;padding:0.75rem 1rem;background:#7c2d12;color:#fff;font:600 14px system-ui,sans-serif;text-align:center;">${OFFLINE_STALE_MESSAGE}</div>`;
  const bodyCloseIndex = html.toLowerCase().lastIndexOf('</body>');
  const markedHtml = bodyCloseIndex === -1
    ? `${banner}${html}`
    : `${html.slice(0, bodyCloseIndex)}${banner}${html.slice(bodyCloseIndex)}`;

  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(markedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function offlineFallbackResponse(request) {
  const accept = request.headers.get('Accept') || '';

  if (accept.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'offline', message: OFFLINE_STALE_MESSAGE }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (request.mode === 'navigate' || accept.includes('text/html')) {
    return new Response(
      `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title></head><body><main style="font-family:system-ui,sans-serif;margin:2rem;max-width:42rem"><h1>Offline</h1><p>${OFFLINE_STALE_MESSAGE}</p><p>Open de app één keer online om pagina's voor offline gebruik op te slaan.</p></main></body></html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  return new Response(OFFLINE_STALE_MESSAGE, {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

