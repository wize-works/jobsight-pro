const CACHE_NAME = 'jobsight-v1';
const OFFLINE_URL = '/dashboard';

// Critical resources to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/dashboard/daily-logs',
  '/dashboard/projects',
  '/dashboard/crews',
  '/dashboard/equipment',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching critical resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone and cache it
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If no cache match, return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            // For other requests, return a generic offline response
            return new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle queued data when back online
      syncOfflineData()
    );
  }
});

async function syncOfflineData() {
  // This would sync any offline-stored data back to the server
  console.log('Service Worker: Syncing offline data');

  // Example: Get queued daily logs from IndexedDB and sync
  try {
    // Implementation would depend on your offline storage strategy
    console.log('Service Worker: Offline data synced successfully');
  } catch (error) {
    console.error('Service Worker: Failed to sync offline data:', error);
  }
}

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

// Handle service worker updates
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});