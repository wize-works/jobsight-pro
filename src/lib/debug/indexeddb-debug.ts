/**
 * Debug utility to inspect IndexedDB cache contents
 * Run in browser console: await window.debugIndexedDB()
 */

import { initOfflineDB } from '@/lib/offline/storage';

export async function debugIndexedDB() {
    try {
        const db = await initOfflineDB();

        console.log('📊 IndexedDB Debug Information');
        console.log('============================');

        // Get all cached data
        const cachedData = await db.getAll('cachedData');

        console.log(`📦 Total cached entries: ${cachedData.length}`);

        // Group by table and businessId
        const grouped = cachedData.reduce((acc, entry) => {
            const key = `${entry.table}:${entry.businessId}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(entry);
            return acc;
        }, {} as Record<string, any[]>);

        for (const [key, entries] of Object.entries(grouped)) {
            const [table, businessId] = key.split(':');
            console.log(`📋 ${table}: ${entries.length} items (business: ${businessId})`);

            // Show timestamps
            const timestamps = entries.map(e => new Date(e.timestamp).toLocaleTimeString());
            console.log(`   ⏰ Cached at: ${timestamps.join(', ')}`);
        }

        // Get sync queue
        const syncQueue = await db.getAll('syncQueue');
        console.log(`🔄 Sync queue: ${syncQueue.length} pending operations`);

        if (syncQueue.length > 0) {
            syncQueue.forEach((op, i) => {
                console.log(`   ${i + 1}. ${op.operation} on ${op.table} (${op.retryCount} retries)`);
            });
        }

        return {
            totalCachedEntries: cachedData.length,
            cachedTables: Object.keys(grouped),
            syncQueueLength: syncQueue.length,
            groupedData: grouped
        };

    } catch (error) {
        console.error('❌ Failed to debug IndexedDB:', error);
        return null;
    }
}

// Make it available globally in development
if (typeof window !== 'undefined') {
    (window as any).debugIndexedDB = debugIndexedDB;
    console.log('🔍 Debug utility loaded. Run `await window.debugIndexedDB()` in console to inspect IndexedDB.');
}
