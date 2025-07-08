/**
 * Subscription Sync Service - Background sync for subscriptions
 * Part of Phase 2: Related Entities Migration
 */

import { db } from "@/lib/offline/dexie-db";
import { BusinessSubscription } from "@/types/subscription";

export interface SubscriptionSyncResult {
    success: boolean;
    syncedCount: number;
    errors: string[];
    lastSyncTime: number;
}

export class SubscriptionSyncService {
    private static readonly MAX_RETRY_ATTEMPTS = 3;
    private static readonly RETRY_DELAY_MS = 1000;

    /**
     * Full bidirectional sync for subscriptions
     * @param businessId - The business ID to sync subscriptions for
     */
    static async fullSync(businessId: string): Promise<SubscriptionSyncResult> {
        const result: SubscriptionSyncResult = {
            success: true,
            syncedCount: 0,
            errors: [],
            lastSyncTime: Date.now()
        };

        try {
            // First, push local changes to server
            const pushResult = await this.syncToServer({ businessId });
            result.syncedCount += pushResult.syncedCount;
            result.errors.push(...pushResult.errors);

            // Then, pull server changes to local
            await this.syncFromServer(businessId);

            result.success = result.errors.length === 0;

        } catch (error) {
            result.success = false;
            result.errors.push(`Full sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Sync local subscription changes to server
     * @param options - Sync options including businessId
     */
    static async syncToServer(options: { businessId?: string } = {}): Promise<SubscriptionSyncResult> {
        const result: SubscriptionSyncResult = {
            success: true,
            syncedCount: 0,
            errors: [],
            lastSyncTime: Date.now()
        };

        try {
            // Get all unsynced subscription operations
            let query = db.syncQueue.where('table').equals('business_subscriptions').and(item => !item.synced);

            if (options.businessId) {
                query = query.and(item => item.businessId === options.businessId);
            }

            const unsyncedItems = await query.toArray();

            for (const item of unsyncedItems) {
                try {
                    let success = false;

                    switch (item.operation) {
                        case 'insert':
                            success = await this.syncInsertToServer(item);
                            break;
                        case 'update':
                            success = await this.syncUpdateToServer(item);
                            break;
                        case 'delete':
                            success = await this.syncDeleteToServer(item);
                            break;
                    }

                    if (success) {
                        // Mark as synced
                        await db.syncQueue.update(item.id, { synced: true });
                        result.syncedCount++;
                    } else {
                        // Increment retry count
                        const newRetryCount = item.retryCount + 1;
                        if (newRetryCount >= this.MAX_RETRY_ATTEMPTS) {
                            result.errors.push(`Max retries exceeded for subscription ${item.operation}: ${item.data?.id}`);
                            // Remove from queue after max retries
                            await db.syncQueue.delete(item.id);
                        } else {
                            await db.syncQueue.update(item.id, { retryCount: newRetryCount });
                        }
                    }

                    // Add delay between requests to avoid overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));

                } catch (error) {
                    console.error(`Error syncing subscription item ${item.id}:`, error);
                    result.errors.push(`Sync error for ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            result.success = result.errors.length === 0;

        } catch (error) {
            result.success = false;
            result.errors.push(`Sync to server failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Sync server subscription changes to local storage
     * @param businessId - The business ID to sync subscriptions for
     */
    static async syncFromServer(businessId: string): Promise<void> {
        try {
            // Get the last sync time for this business
            const syncMetadata = await db.syncMetadata.get(`subscriptions_${businessId}`);
            const lastSync = syncMetadata?.lastSync || 0;

            // Fetch subscriptions from server (modified since last sync)
            const response = await fetch(`/api/subscriptions/business/${businessId}/sync?since=${lastSync}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Server sync failed: ${response.status} ${response.statusText}`);
            }

            const serverSubscriptions: BusinessSubscription[] = await response.json();

            if (serverSubscriptions && serverSubscriptions.length > 0) {
                // Update local storage with server data
                await db.businessSubscriptions.bulkPut(serverSubscriptions);

                console.log(`Synced ${serverSubscriptions.length} subscriptions from server for business ${businessId}`);
            }

            // Update sync metadata
            await db.syncMetadata.put({
                id: `subscriptions_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'businessSubscriptions'
            });

        } catch (error) {
            console.error('Error syncing subscriptions from server:', error);
            throw error;
        }
    }

    /**
     * Sync a subscription insert operation to server
     */
    private static async syncInsertToServer(item: any): Promise<boolean> {
        try {
            const response = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data),
            });

            if (response.ok) {
                const serverSubscription = await response.json();
                // Update local data with server response (e.g., server-generated IDs)
                await db.businessSubscriptions.put(serverSubscription);
                return true;
            }

            console.error('Failed to sync subscription insert:', response.status, response.statusText);
            return false;

        } catch (error) {
            console.error('Error syncing subscription insert to server:', error);
            return false;
        }
    }

    /**
     * Sync a subscription update operation to server
     */
    private static async syncUpdateToServer(item: any): Promise<boolean> {
        try {
            const response = await fetch(`/api/subscriptions/${item.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data),
            });

            if (response.ok) {
                const serverSubscription = await response.json();
                // Update local data with server response
                await db.businessSubscriptions.put(serverSubscription);
                return true;
            }

            console.error('Failed to sync subscription update:', response.status, response.statusText);
            return false;

        } catch (error) {
            console.error('Error syncing subscription update to server:', error);
            return false;
        }
    }

    /**
     * Sync a subscription delete operation to server
     */
    private static async syncDeleteToServer(item: any): Promise<boolean> {
        try {
            const response = await fetch(`/api/subscriptions/${item.data.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                // Remove from local storage
                await db.businessSubscriptions.delete(item.data.id);
                return true;
            }

            console.error('Failed to sync subscription delete:', response.status, response.statusText);
            return false;

        } catch (error) {
            console.error('Error syncing subscription delete to server:', error);
            return false;
        }
    }

    /**
     * Get sync status for subscriptions
     * @param businessId - The business ID to check sync status for
     */
    static async getSyncStatus(businessId: string): Promise<{
        lastSync: number | null;
        pendingOperations: number;
        hasConflicts: boolean;
    }> {
        try {
            // Get last sync time
            const syncMetadata = await db.syncMetadata.get(`subscriptions_${businessId}`);
            const lastSync = syncMetadata?.lastSync || null;

            // Count pending operations
            const pendingOperations = await db.syncQueue
                .where('table').equals('business_subscriptions')
                .and(item => item.businessId === businessId && !item.synced)
                .count();

            // For now, we'll assume no conflicts (future enhancement could add conflict detection)
            const hasConflicts = false;

            return {
                lastSync,
                pendingOperations,
                hasConflicts
            };

        } catch (error) {
            console.error('Error getting subscription sync status:', error);
            return {
                lastSync: null,
                pendingOperations: 0,
                hasConflicts: false
            };
        }
    }

    /**
     * Clear all local subscription data and sync metadata for a business
     * @param businessId - The business ID to clear data for
     */
    static async clearLocalData(businessId: string): Promise<void> {
        try {
            // Remove all subscriptions for this business
            await db.businessSubscriptions.where('business_id').equals(businessId).delete();

            // Remove sync queue items for subscriptions
            await db.syncQueue
                .where('table').equals('business_subscriptions')
                .and(item => item.businessId === businessId)
                .delete();

            // Remove sync metadata
            await db.syncMetadata.delete(`subscriptions_${businessId}`);

            console.log(`Cleared all local subscription data for business ${businessId}`);

        } catch (error) {
            console.error('Error clearing local subscription data:', error);
            throw error;
        }
    }

    /**
     * Force a complete resync for a business (clears local data and syncs from server)
     * @param businessId - The business ID to force resync for
     */
    static async forceResync(businessId: string): Promise<SubscriptionSyncResult> {
        try {
            // Clear local data first
            await this.clearLocalData(businessId);

            // Sync fresh data from server
            await this.syncFromServer(businessId);

            return {
                success: true,
                syncedCount: 0, // We don't track count for full resyncs
                errors: [],
                lastSyncTime: Date.now()
            };

        } catch (error) {
            return {
                success: false,
                syncedCount: 0,
                errors: [`Force resync failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
                lastSyncTime: Date.now()
            };
        }
    }
}
