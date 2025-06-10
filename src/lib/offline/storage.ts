
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Extend ServiceWorkerRegistration type to include sync property
declare global {
    interface ServiceWorkerRegistration {
        sync?: {
            register(tag: string): Promise<void>;
        };
    }
}

// Define the offline database schema
interface OfflineDB extends DBSchema {
    syncQueue: {
        key: string;
        value: {
            id: string;
            table: string;
            operation: 'insert' | 'update' | 'delete';
            data: any;
            businessId: string;
            userId?: string;
            timestamp: number;
            retryCount: number;
        };
        indexes: {
            timestamp: number;
            businessId: string;
        };
    };
    cachedData: {
        key: string;
        value: {
            id: string;
            table: string;
            data: any;
            timestamp: number;
            businessId: string;
            version: number;
            checksum?: string;
        };
        indexes: {
            table: string;
            businessId: string;
            timestamp: number;
        };
    };
    offlineActions: {
        key: string;
        value: {
            id: string;
            action: string;
            params: any;
            timestamp: number;
            businessId: string;
            userId?: string;
        };
        indexes: {
            timestamp: number;
            businessId: string;
        };
    };
}

let db: IDBPDatabase<OfflineDB> | null = null;

export async function initOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
    if (db) return db;

    db = await openDB<OfflineDB>('jobsight-offline', 1, {
        upgrade(db) {
            // Sync queue for operations to replay when online
            if (!db.objectStoreNames.contains('syncQueue')) {
                const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
                syncStore.createIndex('timestamp', 'timestamp');
                syncStore.createIndex('businessId', 'businessId');
            }

            // Cached data for offline viewing
            if (!db.objectStoreNames.contains('cachedData')) {
                const cacheStore = db.createObjectStore('cachedData', { keyPath: 'id' });
                cacheStore.createIndex('table', 'table');
                cacheStore.createIndex('businessId', 'businessId');
                cacheStore.createIndex('timestamp', 'timestamp');
            }

            // Offline actions queue
            if (!db.objectStoreNames.contains('offlineActions')) {
                const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
                actionsStore.createIndex('timestamp', 'timestamp');
                actionsStore.createIndex('businessId', 'businessId');
            }
        },
    });

    return db;
}

export async function addToSyncQueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    businessId: string,
    userId?: string
): Promise<void> {
    const db = await initOfflineDB();
    const id = `${table}_${operation}_${Date.now()}_${Math.random()}`;

    await db.add('syncQueue', {
        id,
        table,
        operation,
        data,
        businessId,
        userId,
        timestamp: Date.now(),
        retryCount: 0,
    });    // Trigger background sync if available
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            if (registration.sync) {
                await registration.sync.register('background-sync');
            }
        } catch (error) {
            console.error('Failed to register background sync:', error);
        }
    }
}

export async function getSyncQueue(businessId: string): Promise<any[]> {
    const db = await initOfflineDB();
    const tx = db.transaction('syncQueue', 'readonly');
    const index = tx.store.index('businessId');
    return await index.getAll(businessId);
}

export async function removeFromSyncQueue(id: string): Promise<void> {
    const db = await initOfflineDB();
    await db.delete('syncQueue', id);
}

export async function cacheData(
    table: string,
    data: any[],
    businessId: string
): Promise<void> {
    const db = await initOfflineDB();
    const tx = db.transaction('cachedData', 'readwrite');

    // Clear old cache for this table
    const index = tx.store.index('table');
    const oldEntries = await index.getAllKeys(table);
    for (const key of oldEntries) {
        await tx.store.delete(key);
    }

    // Add new cache entries
    for (const item of data) {
        const cacheEntry = {
            id: `${table}_${item.id}`,
            table,
            data: item,
            timestamp: Date.now(),
            businessId,
            version: item.version || 1,
            checksum: generateChecksum(item),
        };
        await tx.store.add(cacheEntry);
    }

    await tx.done;
}

export async function getCachedData(
    table: string,
    businessId: string
): Promise<any[]> {
    const db = await initOfflineDB();
    const tx = db.transaction('cachedData', 'readonly');
    const index = tx.store.index('table');
    const entries = await index.getAll(table);

    return entries
        .filter(entry => entry.businessId === businessId)
        .map(entry => entry.data);
}

function generateChecksum(data: any): string {
    // Simple checksum generation - could use crypto.subtle.digest for better hashing
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
}

export async function clearOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const db = await initOfflineDB();
    const tx = db.transaction('cachedData', 'readwrite');
    const index = tx.store.index('timestamp');
    const cutoff = Date.now() - maxAge;

    const cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
    while (cursor) {
        await cursor.delete();
        await cursor.continue();
    }

    await tx.done;
}
