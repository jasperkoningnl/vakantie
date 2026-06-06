const CACHE_VERSION = 'v3';
const CACHE_PAGES = `pages-${CACHE_VERSION}`;
const CACHE_STATIC = `static-${CACHE_VERSION}`;
const EXPECTED_CACHES = [CACHE_PAGES, CACHE_STATIC];
const LEGACY_CACHES = ['pages-v1', 'static-v1', 'external-v1', 'pages-v2', 'static-v2', 'external-v2'];

const OFFLINE_STALE_MESSAGE = 'offline data mogelijk verouderd';
const SHELL_PAGES = ['/', '/nood', '/route', '/vandaag'];
const NON_CACHEABLE_API_PATHS = ['/api/diary', '/api/photos', '/api/safe-arrival'];
const PROTECTED_PATHS = ['/medisch', '/voor-thuis', '/api/'];

// ---------------------------------------------------------------------------
// Install – pre-cache only static shell pages, skip waiting immediately
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGES).then((cache) =>
      Promise.allSettled(
        SHELL_PAGES.map((url) =>
          fetch(url, { cache: 'reload' })
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
// Activate – explicitly delete old cache versions and previously cached private data
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

  const isExternal = url.origin !== self.location.origin;

  // 1. Next.js immutable static assets – cache-first
  if (request.method === 'GET' && isImmutableNextAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // 2. External hostnames – network-only; do not cache third-party data/assets
  if (isExternal) {
    event.respondWith(networkOnly(request));
    return;
  }

  // 3. API routes – network-only; diary/photos/safe-arrival are explicitly non-cacheable
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnlyApi(request));
    return;
  }

  // 4. Navigation requests – cache only known static shell pages
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShellPage(request));
    return;
  }

  // 5. Everything else – network-only. Only shell pages and immutable Next assets are cached.
  event.respondWith(networkOnly(request));
});

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

/** Cache-first: return cached immutable asset, or fetch & store on miss. */
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

/** Network-first for shell pages; cached offline fallback is marked as possibly stale. */
async function networkFirstShellPage(request) {
  const url = new URL(request.url);

  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET' && isShellPage(url) && !isProtectedNavigation(request)) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(shellCacheKey(url), response.clone());
    }
    return response;
  } catch {
    if (isShellPage(url)) {
      const cached = await caches.match(shellCacheKey(url));
      if (cached) return markOfflineFallback(cached);
    }

    return offlineFallbackResponse(request);
  }
}

function isImmutableNextAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/_next/static/');
}

function isShellPage(url) {
  return SHELL_PAGES.includes(normalizePathname(url.pathname));
}

function shellCacheKey(url) {
  return normalizePathname(url.pathname);
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
      `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title></head><body><main style="font-family:system-ui,sans-serif;margin:2rem;max-width:42rem"><h1>Offline</h1><p>${OFFLINE_STALE_MESSAGE}</p></main></body></html>`,
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
