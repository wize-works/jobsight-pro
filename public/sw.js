
const CACHE_NAME = 'jobsight-v1';
const STATIC_CACHE_NAME = 'jobsight-static-v1';
const DYNAMIC_CACHE_NAME = 'jobsight-dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/logo-full.png',
  '/logo-full-white.png',
  // Add other critical static assets
];

// Dynamic routes to cache
const CACHE_ROUTES = [
  '/dashboard/projects',
  '/dashboard/daily-logs',
  '/dashboard/equipment',
  '/dashboard/crews',
  '/dashboard/tasks'
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  console.log('Service Worker installing');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(function(cache) {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE_NAME)
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          // Only cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(function(cache) {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - Cache First
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      url.pathname.includes('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(function(response) {
        if (response) {
          return response;
        }
        return fetch(request).then(function(response) {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then(function(cache) {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - Network First with Cache Fallback
  if (request.destination === 'document' || 
      CACHE_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(function(cache) {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(request).then(function(response) {
            if (response) {
              return response;
            }
            // Return offline page if available
            return caches.match('/dashboard').then(function(fallback) {
              return fallback || new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
          });
        })
    );
    return;
  }
});

// Push notification handling
self.addEventListener('push', function(event) {
  console.log('Push event received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from JobSight',
      icon: data.icon || '/favicon-196x196.png',
      badge: data.badge || '/favicon-96x96.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/dashboard'
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/favicon-32x32.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: true,
      tag: data.tag || 'default'
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'JobSight', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked');
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, location.origin);
        
        if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no matching window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', function(event) {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle queued offline actions here
      console.log('Processing background sync')
    );
  }
});

// Handle service worker updates
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
