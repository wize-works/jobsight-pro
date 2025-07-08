/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "serwist";
import { defaultCache } from "@serwist/next/worker";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: false,
    runtimeCaching: [
        ...defaultCache,
        {
            matcher: ({ request }) => request.url.startsWith('https://api.'),
            handler: new NetworkFirst({
                cacheName: "api-cache",
                networkTimeoutSeconds: 3,
            }),
        },
        {
            matcher: ({ request }) => /\.(png|jpg|jpeg|svg|gif|webp)$/.test(request.url),
            handler: new CacheFirst({
                cacheName: "image-cache",
                plugins: [
                    {
                        cacheKeyWillBeUsed: async ({ request }) => {
                            return request.url;
                        },
                    },
                ],
            }),
        },
        {
            matcher: ({ request }) => /\.(js|css)$/.test(request.url),
            handler: new StaleWhileRevalidate({
                cacheName: "static-resources",
            }),
        },
    ],
});

// Background sync for offline data
self.addEventListener("sync", (event: SyncEvent) => {
    console.log('Service Worker: Sync event received:', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(
            syncOfflineData().catch(error => {
                console.error('Service Worker: Sync failed:', error);
                // Notify clients of sync failure
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
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
        };

        const db = await new Promise<IDBDatabase>((resolve, reject) => {
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

        const syncItems = await new Promise<any[]>((resolve, reject) => {
            getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        });

        console.log(`Service Worker: Found ${syncItems.length} items to sync`);

        // Send sync items to the main application
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
            const promises = clients.map(client => {
                return new Promise((resolve) => {
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
self.addEventListener("push", (event: PushEvent) => {
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
self.addEventListener("notificationclick", (event: NotificationEvent) => {
    console.log('Notification clicked');
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
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
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle service worker updates
self.addEventListener("message", (event: ExtendableMessageEvent) => {
    console.log('Service Worker: Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Handle other message types safely
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        event.waitUntil(
            caches.delete('serwist-precache').then(() => {
                return caches.open('serwist-precache');
            })
        );
    }
});

serwist.addEventListeners();
