"use client";

/**
 * Equipment Sync Service - Background synchronization for equipment entities
 * 
 * This service handles bi-directional synchronization between local Dexie DB
 * and the server for equipment entities. It ensures data consistency and handles
 * offline scenarios gracefully.
 */

import { db } from './dexie-db';
import { Equipment } from '@/types/equipment';

export class EquipmentSyncService {
    private static instance: EquipmentSyncService;
    private syncInProgress: boolean = false;
    private retryTimeout: NodeJS.Timeout | null = null;

    private constructor() { }

    static getInstance(): EquipmentSyncService {
        if (!EquipmentSyncService.instance) {
            EquipmentSyncService.instance = new EquipmentSyncService();
        }
        return EquipmentSyncService.instance;
    }

    /**
     * Check if we're online
     */
    private isOnline(): boolean {
        return typeof navigator !== 'undefined' && navigator.onLine;
    }

    /**
     * Sync equipment for a specific business
     * @param businessId - The business ID to sync equipment for
     * @param authId - The authenticated user's auth_id
     */
    async syncEquipment(businessId: string, authId: string): Promise<boolean> {
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
            console.error('Equipment sync failed:', error);
            this.syncInProgress = false;
            return false;
        }
    }

    /**
     * Push local changes to server
     */
    private async pushLocalChanges(businessId: string, authId: string): Promise<boolean> {
        try {
            // Get unsynced items for equipment
            const unsyncedItems = await db.syncQueue
                .where('table')
                .equals('equipment')
                .and(item => item.businessId === businessId && !item.synced)
                .toArray();

            for (const item of unsyncedItems) {
                try {
                    let response: Response;

                    switch (item.operation) {
                        case 'insert':
                            response = await fetch('/api/equipment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ...item.data,
                                    businessId
                                }),
                            });
                            break;

                        case 'update':
                            response = await fetch(`/api/equipment/${item.data.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ...item.data,
                                    businessId
                                }),
                            });
                            break;

                        case 'delete':
                            response = await fetch(`/api/equipment/${item.data.id}?businessId=${businessId}`, {
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
                            await db.equipment.put(serverData);
                        } else {
                            // For delete operations, remove from local DB
                            await db.equipment.delete(item.data.id);
                        }

                        // Mark as synced
                        await db.syncQueue.update(item.id, { synced: true });

                        console.log(`Successfully synced ${item.operation} for equipment ${item.data.id}`);
                    } else {
                        // Increment retry count
                        await db.syncQueue.update(item.id, {
                            retryCount: item.retryCount + 1
                        });

                        console.warn(`Failed to sync ${item.operation} for equipment ${item.data.id}:`, response.statusText);
                    }

                } catch (error) {
                    console.error(`Error syncing equipment ${item.data.id}:`, error);

                    // Increment retry count
                    await db.syncQueue.update(item.id, {
                        retryCount: item.retryCount + 1
                    });
                }
            }

            return true;

        } catch (error) {
            console.error('Error pushing local equipment changes:', error);
            return false;
        }
    }

    /**
     * Pull remote changes from server
     */
    private async pullRemoteChanges(businessId: string, authId: string): Promise<boolean> {
        try {
            // Get last sync timestamp
            const metadata = await db.syncMetadata.get(`equipment_${businessId}`);
            const lastSync = metadata?.lastSync || 0;

            // Fetch updated equipment from server
            const response = await fetch(`/api/equipment/business/${businessId}?since=${lastSync}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                console.warn('Failed to fetch equipment from server:', response.statusText);
                return false;
            }

            const serverEquipment = await response.json();

            if (serverEquipment && Array.isArray(serverEquipment)) {
                // Update local cache
                await db.equipment.bulkPut(serverEquipment);

                // Update sync metadata
                await db.syncMetadata.put({
                    id: `equipment_${businessId}`,
                    lastSync: Date.now(),
                    businessId,
                    table: 'equipment'
                });

                console.log(`Successfully pulled ${serverEquipment.length} equipment items from server`);
            }

            return true;

        } catch (error) {
            console.error('Error pulling remote equipment changes:', error);
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
                await this.syncEquipment(businessId, authId);
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
    async forceSync(businessId: string, authId: string): Promise<boolean> {
        if (!this.isOnline()) {
            console.warn('Cannot force sync while offline');
            return false;
        }

        return await this.syncEquipment(businessId, authId);
    }

    /**
     * Get sync status for equipment
     * @param businessId - The business ID to check
     */
    async getSyncStatus(businessId: string): Promise<{
        lastSync: number | null;
        pendingChanges: number;
        isOnline: boolean;
        isSyncing: boolean;
    }> {
        const metadata = await db.syncMetadata.get(`equipment_${businessId}`);
        const pendingChanges = await db.syncQueue
            .where('table')
            .equals('equipment')
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
            .equals('equipment')
            .and(item => item.synced && item.timestamp < cutoffTime)
            .delete();
    }
}

// Export singleton instance
export const equipmentSyncService = EquipmentSyncService.getInstance();
