/**
 * Client-Side Action Factory
 * 
 * Creates offline-first actions that work without server connectivity.
 * Automatically syncs with server when connection is available.
 * 
 * Replaces 51 server actions with unified client-side interface.
 */

import { v4 as uuidv4 } from 'uuid';
import { addToSyncQueue, getCachedData, cacheData } from '@/lib/offline/storage';

export interface ClientActionConfig {
    table: string;
    operation: 'insert' | 'update' | 'delete' | 'select';
    syncPriority: 'low' | 'medium' | 'high' | 'critical';
    optimisticUpdate: boolean;
    conflictResolution: 'server-wins' | 'client-wins' | 'merge' | 'prompt';
    retryConfig: {
        maxAttempts: number;
        backoffMs: number;
    };
}

export interface ActionResult<T = any> {
    data?: T;
    error?: string;
    isPending?: boolean;
    isOptimistic?: boolean;
}

/**
 * Creates a client-side action that works offline and syncs when online
 */
export function createClientAction<T = any>(config: ClientActionConfig) {
    return async (
        data: any,
        businessId: string,
        userId?: string
    ): Promise<ActionResult<T>> => {
        try {
            const timestamp = Date.now();

            // Always try local operations first
            const localResult = await performLocalOperation(config, data, businessId);

            // Queue for server sync if online or when connection restored
            if (config.operation !== 'select') {
                await addToSyncQueue(
                    config.table,
                    config.operation,
                    data,
                    businessId,
                    userId
                );
            }

            // Try immediate server sync if online
            if (navigator.onLine && config.operation !== 'select') {
                try {
                    await attemptServerSync(config, data, businessId);
                } catch (error) {
                    // Server sync failed but local operation succeeded
                    console.warn('Server sync failed, will retry in background:', error);
                }
            }

            return {
                data: localResult as T,
                isPending: !navigator.onLine,
                isOptimistic: config.optimisticUpdate && !navigator.onLine
            };

        } catch (error) {
            console.error(`Client action failed for ${config.table}:`, error);
            return {
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    };
}

/**
 * Perform operation on local IndexedDB storage
 */
async function performLocalOperation(
    config: ClientActionConfig,
    data: any,
    businessId: string
): Promise<any> {

    switch (config.operation) {
        case 'select':
            // Read from cache first
            const cachedData = await getCachedData(config.table, businessId);
            return cachedData || [];

        case 'insert':
            // Add ID if not provided
            if (!data.id) {
                data.id = uuidv4();
            }

            // Add to local cache
            const existingData = await getCachedData(config.table, businessId) || [];
            const newData = [...existingData, { ...data, _isLocal: true }];
            await cacheData(config.table, newData, businessId);
            return data;

        case 'update':
            // Update in local cache
            const currentData = await getCachedData(config.table, businessId) || [];
            const updatedData = currentData.map(item =>
                item.id === data.id
                    ? { ...item, ...data, _isLocal: true }
                    : item
            );
            await cacheData(config.table, updatedData, businessId);
            return data;

        case 'delete':
            // Mark as deleted in local cache
            const dataToDelete = await getCachedData(config.table, businessId) || [];
            const filteredData = dataToDelete.filter(item => item.id !== data.id);
            await cacheData(config.table, filteredData, businessId);
            return { id: data.id };

        default:
            throw new Error(`Unsupported operation: ${config.operation}`);
    }
}

/**
 * Attempt to sync with server immediately if online
 */
async function attemptServerSync(
    config: ClientActionConfig,
    data: any,
    businessId: string
): Promise<void> {
    // Import server functions dynamically to avoid loading when offline
    const { insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } =
        await import('@/lib/db');

    switch (config.operation) {
        case 'insert':
            const insertResult = await insertWithBusiness(config.table as any, data, businessId);
            if (insertResult.error) throw insertResult.error;
            break;

        case 'update':
            const updateResult = await updateWithBusinessCheck(
                config.table as any,
                data.id,
                data,
                businessId
            );
            if (updateResult.error) throw updateResult.error;
            break;

        case 'delete':
            const deleteResult = await deleteWithBusinessCheck(
                config.table as any,
                data.id,
                businessId
            );
            if (deleteResult.error) throw deleteResult.error;
            break;
    }
}

/**
 * Factory functions for common operations
 */
export const createInsertAction = (table: string, priority: ClientActionConfig['syncPriority'] = 'medium') =>
    createClientAction({
        table,
        operation: 'insert',
        syncPriority: priority,
        optimisticUpdate: true,
        conflictResolution: 'server-wins',
        retryConfig: { maxAttempts: 3, backoffMs: 1000 }
    });

export const createUpdateAction = (table: string, priority: ClientActionConfig['syncPriority'] = 'medium') =>
    createClientAction({
        table,
        operation: 'update',
        syncPriority: priority,
        optimisticUpdate: true,
        conflictResolution: 'server-wins',
        retryConfig: { maxAttempts: 3, backoffMs: 1000 }
    });

export const createDeleteAction = (table: string, priority: ClientActionConfig['syncPriority'] = 'medium') =>
    createClientAction({
        table,
        operation: 'delete',
        syncPriority: priority,
        optimisticUpdate: true,
        conflictResolution: 'server-wins',
        retryConfig: { maxAttempts: 3, backoffMs: 1000 }
    });

export const createSelectAction = (table: string) =>
    createClientAction({
        table,
        operation: 'select',
        syncPriority: 'low',
        optimisticUpdate: false,
        conflictResolution: 'server-wins',
        retryConfig: { maxAttempts: 1, backoffMs: 0 }
    });
