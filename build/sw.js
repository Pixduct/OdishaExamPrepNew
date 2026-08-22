// OdishaExamPrep Push Notification & Offline Service Worker
// Handles push events, offline caching, and PWA WebAPK installability

const CACHE_NAME = 'oep-pwa-v10';
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/site.webmanifest'
];

// ── Lifecycle ──────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching static assets failed:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

// ── Fetch Event (Required for PWA Installability & WebAPK Minting) ──────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignore non-GET, API calls, and non-http schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Bypass service worker for API endpoints and Supabase requests
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/app-api/') || url.hostname.includes('supabase.co')) {
    return;
  }

  // Network-First with Cache Fallback for navigation and static assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful basic responses for static assets and HTML
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          }).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        // If navigating to a page while offline, fallback to cached root index
        if (request.mode === 'navigate') {
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
        }

        return new Response('Offline - OdishaExamPrep', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// ── Push Event ─────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'OdishaExamPrep', body: event.data ? event.data.text() : 'New update available!' };
  }

  const {
    title = 'OdishaExamPrep',
    body = 'You have a new notification.',
    icon = '/android-chrome-192x192.png',
    badge = '/favicon-32x32.png',
    image,
    clickUrl = '/',
    data: extraData = {},
    actions = [],
    tag,
    requireInteraction = false,
  } = data;

  const notificationOptions = {
    body,
    icon,
    badge,
    image: image || undefined,
    data: { clickUrl, ...extraData },
    actions: actions.slice(0, 2), // max 2 action buttons
    tag: tag || `oep-${Date.now()}`,
    requireInteraction,
    vibrate: [100, 50, 100],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// ── Notification Click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickUrl = event.notification.data?.clickUrl || '/';
  const absoluteUrl = new URL(clickUrl, self.location.origin).href;

  // Handle action button clicks
  if (event.action) {
    const actions = event.notification.actions || [];
    const clickedAction = actions.find(a => a.action === event.action);
    if (clickedAction?.url) {
      event.waitUntil(clients.openWindow(new URL(clickedAction.url, self.location.origin).href));
      return;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if already open
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: absoluteUrl });
          return;
        }
      }
      // Otherwise open a new window
      return clients.openWindow(absoluteUrl);
    })
  );
});

// ── Push Subscription Change ───────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  // Resubscribe automatically when subscription expires
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
    }).then((newSubscription) => {
      // Notify the app to update the subscription in the database
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            subscription: JSON.stringify(newSubscription),
          });
        });
      });
    }).catch(console.error)
  );
});
