const CACHE_NAME = 'jobsight-v1';
const OFFLINE_URL = '/dashboard';

// Critical resources to cache for offline functionality
const STATIC_CACHE_URLS = [
    '/',
    // '/dashboard',
    // '/dashboard/daily-logs',
    // '/dashboard/projects',
    // '/dashboard/crews',
    // '/dashboard/equipment',
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

// Fetch event - cache-first strategy for static assets, network-first for dynamic content
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests or non-same-origin
    if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

    // Handle different types of requests
    if (request.url.includes('/_next/static/') || request.url.includes('/_next/static/chunks/')) {
        // Cache JavaScript chunks and static assets for offline navigation
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                }).catch(() => {
                    // Return a fallback for missing chunks
                    return new Response('// Chunk unavailable offline', {
                        status: 200,
                        headers: { 'Content-Type': 'application/javascript' }
                    });
                });
            })
        );
        return;
    }

    // Skip server-rendered HTML and API routes
    if (
        request.url.includes('/api/') ||                 // API routes
        request.url.includes('__nextjs') ||             // Edge middleware internals
        request.headers.get('accept')?.includes('text/html') // SSR pages
    ) {
        return; // Let browser handle
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone & store in cache only if it's successful
                if (response.status === 200) {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline fallback for static files
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;

                    // Offline navigation fallback
                    if (request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }

                    // Last resort
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable',
                    });
                });
            })
    );
});


// Background sync for offline data
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Sync event received:', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(
            syncOfflineData().catch(error => {
                console.error('Service Worker: Sync failed:', error);                // Notify clients of sync failure
                self.clients.matchAll().then(clients => {
                    const promises = clients.map(client => {
                        return new Promise((resolve) => {
                            try {
                                client.postMessage({
                                    type: 'SYNC_FAILED',
                                    error: error.message
                                });
                                resolve(true);
                            } catch (err) {
                                console.error('Failed to notify client:', err);
                                resolve(false);
                            }
                        });
                    });
                    return Promise.all(promises);
                });
            })
        );
    }
});

async function syncOfflineData() {
    console.log('Service Worker: Starting offline data sync');

    try {
        // Open IndexedDB with error handling
        const dbRequest = indexedDB.open('jobsight-offline', 1);

        // Add error handling for database initialization
        dbRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
        };

        const db = await new Promise((resolve, reject) => {
            dbRequest.onsuccess = () => resolve(dbRequest.result);
            dbRequest.onerror = () => reject(dbRequest.error);
        });

        // Check if object store exists before attempting transaction
        if (!db.objectStoreNames.contains('syncQueue')) {
            console.log('Service Worker: syncQueue store not found, skipping sync');
            return;
        }

        // Get all pending sync items with error handling
        const transaction = db.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        const getAllRequest = store.getAll();

        const syncItems = await new Promise((resolve, reject) => {
            getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        });

        console.log(`Service Worker: Found ${syncItems.length} items to sync`);        // Send sync items to the main application
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
            const promises = clients.map(client => {
                return new Promise((resolve, reject) => {
                    try {
                        client.postMessage({
                            type: 'SYNC_REQUIRED',
                            items: syncItems
                        });
                        resolve(true);
                    } catch (error) {
                        console.error('Service Worker: Failed to send message to client:', error);
                        resolve(false);
                    }
                });
            });

            await Promise.all(promises);
        } else {
            console.log('Service Worker: No clients available for sync');
        }

    } catch (error) {
        console.error('Service Worker: Failed to sync offline data:', error);
    }
}

// Push notification handling
self.addEventListener('push', function (event) {
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
self.addEventListener('notificationclick', function (event) {
    console.log('Notification clicked');
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
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
self.addEventListener('message', function (event) {
    console.log('Service Worker: Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Handle other message types safely
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                return caches.open(CACHE_NAME);
            })
        );
    }

    // Never return true to avoid async response errors
    // Use event.waitUntil() for async operations instead
});