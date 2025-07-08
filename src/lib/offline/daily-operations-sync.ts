/**
 * Daily Operations Sync Service - Enhanced offline-first sync for daily log entities
 * 
 * This service handles synchronization of all daily operations entities:
 * - Daily logs
 * - Daily log equipment
 * - Daily log materials  
 * - Daily log images
 * 
 * IMPORTANT: All 'userId' references refer to auth_id from authentication provider
 */

import { db } from './dexie-db';

export interface SyncResult {
    success: boolean;
    syncedItems: number;
    errors: string[];
    lastSyncTime: number;
}

export interface SyncOptions {
    businessId: string;
    direction?: 'pull' | 'push' | 'both';
    force?: boolean;
    batchSize?: number;
}

export class DailyOperationsSyncService {
    private static readonly SYNC_BATCH_SIZE = 50;
    private static readonly RETRY_LIMIT = 3;

    /**
     * Perform full sync for all daily operations entities
     */
    static async fullSync(businessId: string): Promise<SyncResult> {
        const startTime = Date.now();
        let totalSyncedItems = 0;
        const errors: string[] = [];

        try {
            // Pull from server first (get latest data)
            const pullResult = await this.syncFromServer(businessId);
            totalSyncedItems += pullResult.syncedItems;
            errors.push(...pullResult.errors);

            // Push to server (send local changes)
            const pushResult = await this.syncToServer({ businessId });
            totalSyncedItems += pushResult.syncedItems;
            errors.push(...pushResult.errors);

            // Update sync metadata
            await this.updateSyncMetadata(businessId, startTime);

            return {
                success: errors.length === 0,
                syncedItems: totalSyncedItems,
                errors,
                lastSyncTime: startTime
            };
        } catch (error) {
            console.error('Error in full sync:', error);
            return {
                success: false,
                syncedItems: totalSyncedItems,
                errors: [...errors, error instanceof Error ? error.message : 'Unknown sync error'],
                lastSyncTime: startTime
            };
        }
    }

    /**
     * Sync local changes to server
     */
    static async syncToServer(options: SyncOptions): Promise<SyncResult> {
        const { businessId, batchSize = this.SYNC_BATCH_SIZE } = options;
        const startTime = Date.now();
        let syncedItems = 0;
        const errors: string[] = [];

        try {
            // Get all unsynced items for daily operations entities
            const unsyncedItems = await db.syncQueue
                .where('businessId')
                .equals(businessId)
                .and(item =>
                    !item.synced &&
                    ['dailyLogs', 'dailyLogEquipment', 'dailyLogMaterials', 'dailyLogImages'].includes(item.table)
                )
                .limit(batchSize)
                .toArray();

            console.log(`Found ${unsyncedItems.length} unsynced daily operations items for business ${businessId}`);

            // Process each unsynced item
            for (const item of unsyncedItems) {
                try {
                    const success = await this.syncItemToServer(item);
                    if (success) {
                        // Mark as synced
                        await db.syncQueue.update(item.id, { synced: true });
                        syncedItems++;
                    } else {
                        // Increment retry count
                        await db.syncQueue.update(item.id, {
                            retryCount: (item.retryCount || 0) + 1
                        });

                        // Remove from queue if retry limit exceeded
                        if ((item.retryCount || 0) >= this.RETRY_LIMIT) {
                            await db.syncQueue.delete(item.id);
                            errors.push(`Max retries exceeded for ${item.table} ${item.operation} ${item.data?.id}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error syncing item ${item.id}:`, error);
                    errors.push(`Failed to sync ${item.table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return {
                success: errors.length === 0,
                syncedItems,
                errors,
                lastSyncTime: startTime
            };
        } catch (error) {
            console.error('Error in syncToServer:', error);
            return {
                success: false,
                syncedItems,
                errors: [...errors, error instanceof Error ? error.message : 'Unknown sync error'],
                lastSyncTime: startTime
            };
        }
    }

    /**
     * Sync data from server to local storage
     */
    static async syncFromServer(businessId: string): Promise<SyncResult> {
        const startTime = Date.now();
        let syncedItems = 0;
        const errors: string[] = [];

        try {
            // Check if we're online
            if (!navigator.onLine) {
                return {
                    success: false,
                    syncedItems: 0,
                    errors: ['Device is offline'],
                    lastSyncTime: startTime
                };
            }

            // Sync each entity type
            const entities = ['dailyLogs', 'dailyLogEquipment', 'dailyLogMaterials', 'dailyLogImages'];

            for (const entityType of entities) {
                try {
                    const result = await this.syncEntityFromServer(businessId, entityType);
                    syncedItems += result.count;
                    if (result.error) {
                        errors.push(result.error);
                    }
                } catch (error) {
                    console.error(`Error syncing ${entityType} from server:`, error);
                    errors.push(`Failed to sync ${entityType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return {
                success: errors.length === 0,
                syncedItems,
                errors,
                lastSyncTime: startTime
            };
        } catch (error) {
            console.error('Error in syncFromServer:', error);
            return {
                success: false,
                syncedItems,
                errors: [...errors, error instanceof Error ? error.message : 'Unknown sync error'],
                lastSyncTime: startTime
            };
        }
    }

    /**
     * Sync individual item to server
     */
    private static async syncItemToServer(item: any): Promise<boolean> {
        try {
            const endpoint = this.getApiEndpoint(item.table, item.operation, item.data?.id);
            const method = this.getHttpMethod(item.operation);

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: item.operation !== 'delete' ? JSON.stringify({
                    ...item.data,
                    businessId: item.businessId
                }) : undefined,
            });

            if (response.ok) {
                // If it's an insert or update, update local data with server response
                if (item.operation !== 'delete' && response.headers.get('content-type')?.includes('application/json')) {
                    const serverData = await response.json();
                    if (serverData) {
                        await this.updateLocalEntity(item.table, serverData);
                    }
                }
                return true;
            } else {
                console.error(`Server responded with ${response.status} for ${item.table} ${item.operation}`);
                return false;
            }
        } catch (error) {
            console.error('Error syncing item to server:', error);
            return false;
        }
    }

    /**
     * Sync specific entity type from server
     */
    private static async syncEntityFromServer(businessId: string, entityType: string): Promise<{ count: number; error?: string }> {
        try {
            const endpoint = this.getListApiEndpoint(entityType, businessId);

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const serverData = await response.json();

                if (Array.isArray(serverData)) {
                    // Update local storage with server data
                    await this.bulkUpdateLocalEntity(entityType, serverData);

                    return { count: serverData.length };
                } else {
                    return { count: 0, error: `Invalid data format from server for ${entityType}` };
                }
            } else {
                return { count: 0, error: `Server error ${response.status} for ${entityType}` };
            }
        } catch (error) {
            return {
                count: 0,
                error: `Failed to sync ${entityType}: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Get API endpoint for specific operation
     */
    private static getApiEndpoint(table: string, operation: string, id?: string): string {
        const baseEndpoints = {
            dailyLogs: '/api/daily-logs',
            dailyLogEquipment: '/api/daily-log-equipment',
            dailyLogMaterials: '/api/daily-log-materials',
            dailyLogImages: '/api/daily-log-images'
        };

        const baseUrl = baseEndpoints[table as keyof typeof baseEndpoints] || `/api/${table}`;

        if (operation === 'insert') {
            return baseUrl;
        } else if (operation === 'update' || operation === 'delete') {
            return `${baseUrl}/${id}`;
        }

        return baseUrl;
    }

    /**
     * Get list API endpoint for entity type
     */
    private static getListApiEndpoint(entityType: string, businessId: string): string {
        const endpoints = {
            dailyLogs: `/api/daily-logs/business/${businessId}`,
            dailyLogEquipment: `/api/daily-log-equipment/business/${businessId}`,
            dailyLogMaterials: `/api/daily-log-materials/business/${businessId}`,
            dailyLogImages: `/api/daily-log-images/business/${businessId}`
        };

        return endpoints[entityType as keyof typeof endpoints] || `/api/${entityType}/business/${businessId}`;
    }

    /**
     * Get HTTP method for operation
     */
    private static getHttpMethod(operation: string): string {
        switch (operation) {
            case 'insert': return 'POST';
            case 'update': return 'PUT';
            case 'delete': return 'DELETE';
            default: return 'GET';
        }
    }

    /**
     * Update local entity with server data
     */
    private static async updateLocalEntity(table: string, data: any): Promise<void> {
        switch (table) {
            case 'dailyLogs':
                await db.dailyLogs.put(data);
                break;
            case 'dailyLogEquipment':
                await db.dailyLogEquipment.put(data);
                break;
            case 'dailyLogMaterials':
                await db.dailyLogMaterials.put(data);
                break;
            case 'dailyLogImages':
                await db.dailyLogImages.put(data);
                break;
            default:
                console.warn(`Unknown table type for local update: ${table}`);
        }
    }

    /**
     * Bulk update local entities with server data
     */
    private static async bulkUpdateLocalEntity(table: string, dataArray: any[]): Promise<void> {
        if (dataArray.length === 0) return;

        switch (table) {
            case 'dailyLogs':
                await db.dailyLogs.bulkPut(dataArray);
                break;
            case 'dailyLogEquipment':
                await db.dailyLogEquipment.bulkPut(dataArray);
                break;
            case 'dailyLogMaterials':
                await db.dailyLogMaterials.bulkPut(dataArray);
                break;
            case 'dailyLogImages':
                await db.dailyLogImages.bulkPut(dataArray);
                break;
            default:
                console.warn(`Unknown table type for bulk update: ${table}`);
        }
    }

    /**
     * Update sync metadata for daily operations
     */
    private static async updateSyncMetadata(businessId: string, timestamp: number): Promise<void> {
        const entities = ['dailyLogs', 'dailyLogEquipment', 'dailyLogMaterials', 'dailyLogImages'];

        for (const entity of entities) {
            await db.syncMetadata.put({
                id: `${entity}_${businessId}`,
                lastSync: timestamp,
                businessId,
                table: entity
            });
        }
    }

    /**
     * Get sync status for daily operations
     */
    static async getSyncStatus(businessId: string): Promise<{
        lastSync: { [entity: string]: number };
        pendingItems: number;
        failedItems: number;
    }> {
        try {
            const entities = ['dailyLogs', 'dailyLogEquipment', 'dailyLogMaterials', 'dailyLogImages'];
            const lastSync: { [entity: string]: number } = {};

            // Get last sync time for each entity
            for (const entity of entities) {
                const metadata = await db.syncMetadata.get(`${entity}_${businessId}`);
                lastSync[entity] = metadata?.lastSync || 0;
            }

            // Count pending sync items
            const pendingItems = await db.syncQueue
                .where('businessId')
                .equals(businessId)
                .and(item =>
                    !item.synced &&
                    entities.includes(item.table)
                )
                .count();

            // Count failed items (high retry count)
            const failedItems = await db.syncQueue
                .where('businessId')
                .equals(businessId)
                .and(item =>
                    !item.synced &&
                    entities.includes(item.table) &&
                    (item.retryCount || 0) >= this.RETRY_LIMIT
                )
                .count();

            return {
                lastSync,
                pendingItems,
                failedItems
            };
        } catch (error) {
            console.error('Error getting sync status:', error);
            return {
                lastSync: {},
                pendingItems: 0,
                failedItems: 0
            };
        }
    }

    /**
     * Clear failed sync items for daily operations
     */
    static async clearFailedItems(businessId: string): Promise<number> {
        try {
            const entities = ['dailyLogs', 'dailyLogEquipment', 'dailyLogMaterials', 'dailyLogImages'];

            const failedItems = await db.syncQueue
                .where('businessId')
                .equals(businessId)
                .and(item =>
                    !item.synced &&
                    entities.includes(item.table) &&
                    (item.retryCount || 0) >= this.RETRY_LIMIT
                )
                .toArray();

            // Delete failed items
            for (const item of failedItems) {
                await db.syncQueue.delete(item.id);
            }

            return failedItems.length;
        } catch (error) {
            console.error('Error clearing failed items:', error);
            return 0;
        }
    }

    /**
     * Force sync specific daily log and all related entities
     */
    static async syncDailyLogWithRelated(businessId: string, dailyLogId: string): Promise<SyncResult> {
        const startTime = Date.now();
        let syncedItems = 0;
        const errors: string[] = [];

        try {
            // Get all sync items related to this daily log
            const relatedItems = await db.syncQueue
                .where('businessId')
                .equals(businessId)
                .and(item => {
                    if (!item.synced) {
                        // Check if it's the daily log itself
                        if (item.table === 'dailyLogs' && item.data?.id === dailyLogId) {
                            return true;
                        }
                        // Check if it's related equipment, materials, or images
                        if (['dailyLogEquipment', 'dailyLogMaterials', 'dailyLogImages'].includes(item.table) &&
                            item.data?.daily_log_id === dailyLogId) {
                            return true;
                        }
                    }
                    return false;
                })
                .toArray();

            console.log(`Found ${relatedItems.length} related items to sync for daily log ${dailyLogId}`);

            // Sync each related item
            for (const item of relatedItems) {
                try {
                    const success = await this.syncItemToServer(item);
                    if (success) {
                        await db.syncQueue.update(item.id, { synced: true });
                        syncedItems++;
                    } else {
                        errors.push(`Failed to sync ${item.table} ${item.operation} ${item.data?.id}`);
                    }
                } catch (error) {
                    console.error(`Error syncing related item ${item.id}:`, error);
                    errors.push(`Failed to sync ${item.table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return {
                success: errors.length === 0,
                syncedItems,
                errors,
                lastSyncTime: startTime
            };
        } catch (error) {
            console.error('Error in syncDailyLogWithRelated:', error);
            return {
                success: false,
                syncedItems,
                errors: [...errors, error instanceof Error ? error.message : 'Unknown sync error'],
                lastSyncTime: startTime
            };
        }
    }

    /**
     * Get comprehensive sync statistics for daily operations
     */
    static async getSyncStatistics(businessId: string): Promise<{
        entities: {
            [entityName: string]: {
                totalLocal: number;
                lastSync: number;
                pendingSync: number;
                lastModified: number;
            };
        };
        overall: {
            totalPendingItems: number;
            totalFailedItems: number;
            oldestPendingItem: number;
            syncHealthScore: number; // 0-100
        };
    }> {
        try {
            const entities = ['dailyLogs', 'dailyLogEquipment', 'dailyLogMaterials', 'dailyLogImages'];
            const entityStats: { [key: string]: any } = {};

            for (const entity of entities) {
                // Get total local count
                const table = entity === 'dailyLogs' ? db.dailyLogs :
                    entity === 'dailyLogEquipment' ? db.dailyLogEquipment :
                        entity === 'dailyLogMaterials' ? db.dailyLogMaterials :
                            db.dailyLogImages;

                const totalLocal = await table.where('business_id').equals(businessId).count();

                // Get last sync time
                const metadata = await db.syncMetadata.get(`${entity}_${businessId}`);
                const lastSync = metadata?.lastSync || 0;

                // Get pending sync count
                const pendingSync = await db.syncQueue
                    .where('businessId')
                    .equals(businessId)
                    .and(item => !item.synced && item.table === entity)
                    .count();

                // Get last modified time from local data
                const lastModifiedItem = await table
                    .where('business_id')
                    .equals(businessId)
                    .reverse()
                    .sortBy('updated_at');

                const lastModified = lastModifiedItem.length > 0
                    ? new Date(lastModifiedItem[0].updated_at || 0).getTime()
                    : 0;

                entityStats[entity] = {
                    totalLocal,
                    lastSync,
                    pendingSync,
                    lastModified
                };
            }

            // Overall statistics
            const totalPendingItems = await db.syncQueue
                .where('businessId')
                .equals(businessId)
                .and(item => !item.synced && entities.includes(item.table))
                .count();

            const totalFailedItems = await db.syncQueue
                .where('businessId')
                .equals(businessId)
                .and(item =>
                    !item.synced &&
                    entities.includes(item.table) &&
                    (item.retryCount || 0) >= this.RETRY_LIMIT
                )
                .count();

            const oldestPendingItems = await db.syncQueue
                .where('businessId')
                .equals(businessId)
                .and(item => !item.synced && entities.includes(item.table))
                .sortBy('timestamp');

            const oldestPendingItem = oldestPendingItems.length > 0 ? oldestPendingItems[0].timestamp : 0;

            // Calculate sync health score (0-100)
            const totalItems = Object.values(entityStats).reduce((sum, stats) => sum + stats.totalLocal, 0);
            const healthScore = totalItems > 0
                ? Math.max(0, 100 - (totalPendingItems / totalItems) * 100 - (totalFailedItems * 10))
                : 100;

            return {
                entities: entityStats,
                overall: {
                    totalPendingItems,
                    totalFailedItems,
                    oldestPendingItem,
                    syncHealthScore: Math.round(healthScore)
                }
            };
        } catch (error) {
            console.error('Error getting sync statistics:', error);
            return {
                entities: {},
                overall: {
                    totalPendingItems: 0,
                    totalFailedItems: 0,
                    oldestPendingItem: 0,
                    syncHealthScore: 0
                }
            };
        }
    }
}
