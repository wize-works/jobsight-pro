"use client";

/**
 * Client Sync Service - Background synchronization for client entities
 * 
 * This service handles bi-directional synchronization between local Dexie DB
 * and the server for client entities. It ensures data consistency and handles
 * offline scenarios gracefully.
 */

import { db } from './dexie-db';
import { Client } from '@/types/clients';

export class ClientSyncService {
    private static instance: ClientSyncService;
    private syncInProgress: boolean = false;
    private retryTimeout: NodeJS.Timeout | null = null;

    private constructor() { }

    static getInstance(): ClientSyncService {
        if (!ClientSyncService.instance) {
            ClientSyncService.instance = new ClientSyncService();
        }
        return ClientSyncService.instance;
    }

    /**
     * Check if we're online
     */
    private isOnline(): boolean {
        return typeof navigator !== 'undefined' && navigator.onLine;
    }

    /**
     * Sync clients for a specific business
     * @param businessId - The business ID to sync clients for
     * @param authId - The authenticated user's auth_id
     */
    async syncClients(businessId: string, authId: string): Promise<boolean> {
        if (this.syncInProgress || !this.isOnline()) {
            return false;
        }

        this.syncInProgress = true;

        try {
            // Step 1: Push local changes to server
            const pushSuccess = await this.pushLocalChanges(businessId, authId);

            // Step 2: Pull latest changes from server
            const pullSuccess = await this.pullRemoteChanges(businessId, authId);

            this.syncInProgress = false;
            return pushSuccess && pullSuccess;

        } catch (error) {
            console.error('Client sync failed:', error);
            this.syncInProgress = false;
            return false;
        }
    }

    /**
     * Push local changes to server
     */
    private async pushLocalChanges(businessId: string, authId: string): Promise<boolean> {
        try {
            // Get unsynced items for clients
            const unsyncedItems = await db.syncQueue
                .where('table')
                .equals('clients')
                .and(item => item.businessId === businessId && !item.synced)
                .toArray();

            for (const item of unsyncedItems) {
                try {
                    let response: Response;

                    switch (item.operation) {
                        case 'insert':
                            response = await fetch('/api/clients', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ...item.data,
                                    businessId
                                }),
                            });
                            break;

                        case 'update':
                            response = await fetch(`/api/clients/${item.data.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ...item.data,
                                    businessId
                                }),
                            });
                            break;

                        case 'delete':
                            response = await fetch(`/api/clients/${item.data.id}?businessId=${businessId}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                            });
                            break;

                        default:
                            console.warn(`Unknown operation: ${item.operation}`);
                            continue;
                    }

                    if (response.ok) {
                        if (item.operation !== 'delete') {
                            const serverData = await response.json();
                            // Update local data with server response
                            await db.clients.put(serverData);
                        } else {
                            // For delete operations, remove from local DB
                            await db.clients.delete(item.data.id);
                        }

                        // Mark as synced
                        await db.syncQueue.update(item.id, { synced: true });

                        console.log(`Successfully synced ${item.operation} for client ${item.data.id}`);
                    } else {
                        // Increment retry count
                        await db.syncQueue.update(item.id, {
                            retryCount: item.retryCount + 1
                        });

                        console.warn(`Failed to sync ${item.operation} for client ${item.data.id}:`, response.statusText);
                    }

                } catch (error) {
                    console.error(`Error syncing client ${item.data.id}:`, error);

                    // Increment retry count
                    await db.syncQueue.update(item.id, {
                        retryCount: item.retryCount + 1
                    });
                }
            }

            return true;

        } catch (error) {
            console.error('Error pushing local client changes:', error);
            return false;
        }
    }

    /**
     * Pull remote changes from server
     */
    private async pullRemoteChanges(businessId: string, authId: string): Promise<boolean> {
        try {
            // Get last sync timestamp
            const metadata = await db.syncMetadata.get(`clients_${businessId}`);
            const lastSync = metadata?.lastSync || 0;

            // Fetch updated clients from server
            const response = await fetch(`/api/clients/business/${businessId}?since=${lastSync}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                console.warn('Failed to fetch clients from server:', response.statusText);
                return false;
            }

            const serverClients = await response.json();

            if (serverClients && Array.isArray(serverClients)) {
                // Update local cache
                await db.clients.bulkPut(serverClients);

                // Update sync metadata
                await db.syncMetadata.put({
                    id: `clients_${businessId}`,
                    lastSync: Date.now(),
                    businessId,
                    table: 'clients'
                });

                console.log(`Successfully pulled ${serverClients.length} clients from server`);
            }

            return true;

        } catch (error) {
            console.error('Error pulling remote client changes:', error);
            return false;
        }
    }

    /**
     * Schedule periodic sync
     * @param businessId - The business ID to sync
     * @param authId - The authenticated user's auth_id
     * @param intervalMinutes - Sync interval in minutes (default: 5)
     */
    schedulePeriodicSync(businessId: string, authId: string, intervalMinutes: number = 5): void {
        // Clear existing timeout
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }

        const syncInterval = intervalMinutes * 60 * 1000; // Convert to milliseconds

        const scheduledSync = async () => {
            if (this.isOnline()) {
                await this.syncClients(businessId, authId);
            }

            // Schedule next sync
            this.retryTimeout = setTimeout(scheduledSync, syncInterval);
        };

        // Start the first sync after 30 seconds
        this.retryTimeout = setTimeout(scheduledSync, 30000);
    }

    /**
     * Stop scheduled sync
     */
    stopPeriodicSync(): void {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }
    }

    /**
     * Force immediate sync
     * @param businessId - The business ID to sync
     * @param authId - The authenticated user's auth_id
     */
    async forcSync(businessId: string, authId: string): Promise<boolean> {
        if (!this.isOnline()) {
            console.warn('Cannot force sync while offline');
            return false;
        }

        return await this.syncClients(businessId, authId);
    }

    /**
     * Get sync status for clients
     * @param businessId - The business ID to check
     */
    async getSyncStatus(businessId: string): Promise<{
        lastSync: number | null;
        pendingChanges: number;
        isOnline: boolean;
        isSyncing: boolean;
    }> {
        const metadata = await db.syncMetadata.get(`clients_${businessId}`);
        const pendingChanges = await db.syncQueue
            .where('table')
            .equals('clients')
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        return {
            lastSync: metadata?.lastSync || null,
            pendingChanges,
            isOnline: this.isOnline(),
            isSyncing: this.syncInProgress
        };
    }

    /**
     * Cleanup old sync queue items
     * @param olderThanDays - Remove synced items older than this many days (default: 7)
     */
    async cleanupSyncQueue(olderThanDays: number = 7): Promise<void> {
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

        await db.syncQueue
            .where('table')
            .equals('clients')
            .and(item => item.synced && item.timestamp < cutoffTime)
            .delete();
    }
}

// Export singleton instance
export const clientSyncService = ClientSyncService.getInstance();
