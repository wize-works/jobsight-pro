/**
 * User Sync Service - Background sync for users
 * Part of Phase 2: Related Entities Migration
 */

import { db } from "@/lib/offline/dexie-db";
import { User } from "@/types/users";

export interface UserSyncResult {
    success: boolean;
    syncedCount: number;
    errors: string[];
    lastSyncTime: number;
}

export class UserSyncService {
    private static readonly MAX_RETRY_ATTEMPTS = 3;
    private static readonly RETRY_DELAY_MS = 1000;

    /**
     * Full bidirectional sync for users
     * @param businessId - The business ID to sync users for
     */
    static async fullSync(businessId: string): Promise<UserSyncResult> {
        const result: UserSyncResult = {
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
     * Sync local user changes to server
     * @param options - Sync options including businessId
     */
    static async syncToServer(options: { businessId?: string } = {}): Promise<UserSyncResult> {
        const result: UserSyncResult = {
            success: true,
            syncedCount: 0,
            errors: [],
            lastSyncTime: Date.now()
        };

        try {
            // Get all unsynced user operations
            let query = db.syncQueue.where('table').equals('users').and(item => !item.synced);

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
                            result.errors.push(`Max retries exceeded for user ${item.operation}: ${item.data?.id}`);
                            // Remove from queue after max retries
                            await db.syncQueue.delete(item.id);
                        } else {
                            await db.syncQueue.update(item.id, { retryCount: newRetryCount });
                        }
                    }

                    // Add delay between requests to avoid overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));

                } catch (error) {
                    console.error(`Error syncing user item ${item.id}:`, error);
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
     * Sync server user changes to local storage
     * @param businessId - The business ID to sync users for
     */
    static async syncFromServer(businessId: string): Promise<void> {
        try {
            // Get the last sync time for this business
            const syncMetadata = await db.syncMetadata.get(`users_${businessId}`);
            const lastSync = syncMetadata?.lastSync || 0;

            // Fetch users from server (modified since last sync)
            const response = await fetch(`/api/users/business/${businessId}/sync?since=${lastSync}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Server sync failed: ${response.status} ${response.statusText}`);
            }

            const serverUsers: User[] = await response.json();

            if (serverUsers && serverUsers.length > 0) {
                // Update local storage with server data
                await db.users.bulkPut(serverUsers);

                console.log(`Synced ${serverUsers.length} users from server for business ${businessId}`);
            }

            // Update sync metadata
            await db.syncMetadata.put({
                id: `users_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'users'
            });

        } catch (error) {
            console.error('Error syncing users from server:', error);
            throw error;
        }
    }

    /**
     * Sync a user insert operation to server
     */
    private static async syncInsertToServer(item: any): Promise<boolean> {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data),
            });

            if (response.ok) {
                const serverUser = await response.json();
                // Update local data with server response (e.g., server-generated IDs)
                await db.users.put(serverUser);
                return true;
            }

            console.error('Failed to sync user insert:', response.status, response.statusText);
            return false;

        } catch (error) {
            console.error('Error syncing user insert to server:', error);
            return false;
        }
    }

    /**
     * Sync a user update operation to server
     */
    private static async syncUpdateToServer(item: any): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/${item.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data),
            });

            if (response.ok) {
                const serverUser = await response.json();
                // Update local data with server response
                await db.users.put(serverUser);
                return true;
            }

            console.error('Failed to sync user update:', response.status, response.statusText);
            return false;

        } catch (error) {
            console.error('Error syncing user update to server:', error);
            return false;
        }
    }

    /**
     * Sync a user delete operation to server
     */
    private static async syncDeleteToServer(item: any): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/${item.data.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                // Remove from local storage
                await db.users.delete(item.data.id);
                return true;
            }

            console.error('Failed to sync user delete:', response.status, response.statusText);
            return false;

        } catch (error) {
            console.error('Error syncing user delete to server:', error);
            return false;
        }
    }

    /**
     * Get sync status for users
     * @param businessId - The business ID to check sync status for
     */
    static async getSyncStatus(businessId: string): Promise<{
        lastSync: number | null;
        pendingOperations: number;
        hasConflicts: boolean;
    }> {
        try {
            // Get last sync time
            const syncMetadata = await db.syncMetadata.get(`users_${businessId}`);
            const lastSync = syncMetadata?.lastSync || null;

            // Count pending operations
            const pendingOperations = await db.syncQueue
                .where('table').equals('users')
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
            console.error('Error getting user sync status:', error);
            return {
                lastSync: null,
                pendingOperations: 0,
                hasConflicts: false
            };
        }
    }

    /**
     * Clear all local user data and sync metadata for a business
     * @param businessId - The business ID to clear data for
     */
    static async clearLocalData(businessId: string): Promise<void> {
        try {
            // Remove all users for this business
            await db.users.where('business_id').equals(businessId).delete();

            // Remove sync queue items for users
            await db.syncQueue
                .where('table').equals('users')
                .and(item => item.businessId === businessId)
                .delete();

            // Remove sync metadata
            await db.syncMetadata.delete(`users_${businessId}`);

            console.log(`Cleared all local user data for business ${businessId}`);

        } catch (error) {
            console.error('Error clearing local user data:', error);
            throw error;
        }
    }

    /**
     * Force a complete resync for a business (clears local data and syncs from server)
     * @param businessId - The business ID to force resync for
     */
    static async forceResync(businessId: string): Promise<UserSyncResult> {
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
