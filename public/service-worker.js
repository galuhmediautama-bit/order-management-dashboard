/**
 * Service Worker for Offline Caching
 * Caches API responses for offline capability
 * 
 * Activation:
 * 1. Register service worker in main.tsx:
 *    if ('serviceWorker' in navigator) {
 *      navigator.serviceWorker.register('/service-worker.js');
 *    }
 * 
 * 2. Service worker will cache:
 *    - API responses (forms, orders, users)
 *    - Static assets (JS, CSS, images)
 *    - Font files
 */

const CACHE_NAME = 'order-dashboard-v1';
const RUNTIME_CACHE = 'order-dashboard-runtime';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Cache strategies
const STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets could not be cached:', err);
      });
    })
  );
  // Force new service worker to activate immediately
  self.skipWaiting();
});

/**
 * Activate event - clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API requests - network first strategy
  if (url.pathname.startsWith('/rest/v1/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Supabase realtime - network only (can't cache WebSocket)
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Static assets - cache first strategy
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages - stale while revalidate
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // Default: network first
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Network First Strategy
 * Try network first, fall back to cache if offline
 */
async function networkFirstStrategy(request) {
  const cacheName = RUNTIME_CACHE;

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Found in cache:', request.url);
      return cachedResponse;
    }

    // No cache, return offline page or error
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No cached response available',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cache First Strategy
 * Use cache first, fall back to network
 */
async function cacheFirstStrategy(request) {
  const cacheName = CACHE_NAME;

  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache miss and network failed:', request.url);
    return new Response('Not found', { status: 404 });
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cache immediately, update in background
 */
async function staleWhileRevalidateStrategy(request) {
  const cacheName = RUNTIME_CACHE;

  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });

  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Handle messages from client
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      console.log('[SW] Runtime cache cleared');
    });
  }

  if (event.data && event.data.type === 'CACHE_STATS') {
    caches.open(RUNTIME_CACHE).then((cache) => {
      cache.keys().then((keys) => {
        event.ports[0].postMessage({
          type: 'CACHE_STATS',
          count: keys.length,
          size: keys.reduce((acc, key) => acc + key.url.length, 0),
        });
      });
    });
  }
});

/**
 * Periodic sync for background updates (when online)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    const response = await fetch('/api/orders');
    const orders = await response.json();
    console.log('[SW] Synced orders:', orders.length);
  } catch (error) {
    console.log('[SW] Sync failed (offline):', error);
  }
}

console.log('[SW] Service Worker loaded');
