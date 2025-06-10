
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { getCachedData, cacheData } from './storage';

export function createOfflineAction<T extends any[], R>(
    onlineAction: (...args: T) => Promise<R>,
    table: string,
    operation: 'insert' | 'update' | 'delete'
) {
    return async (...args: T): Promise<R> => {
        if (typeof window === 'undefined') {
            // Server-side execution - always use online action
            return await onlineAction(...args);
        }

        const { isOnline, queueOperation } = useOfflineSync();

        if (isOnline) {
            try {
                const result = await onlineAction(...args);
                return result;
            } catch (error) {
                console.error('Online action failed:', error);
                
                // Check if we should queue for retry
                if (error instanceof Error && error.message.includes('network')) {
                    console.log('Network error detected, queuing for later sync');
                    const businessId = localStorage.getItem('currentBusinessId');
                    const userId = localStorage.getItem('currentUserId');

                    if (businessId) {
                        const data = args[0];
                        await queueOperation(table, operation, data, businessId, userId);
                    }
                }
                
                throw error;
            }
        } else {
            // Queue the operation for when back online
            const businessId = localStorage.getItem('currentBusinessId');
            const userId = localStorage.getItem('currentUserId');

            if (!businessId) {
                throw new Error('No business context available offline');
            }

            // For offline operations, we need to create optimistic updates
            const data = args[0]; // Assuming first arg is the data
            
            // Generate a temporary ID for new records
            if (operation === 'insert' && data && !data.id) {
                data.id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }

            await queueOperation(table, operation, data, businessId, userId);

            // Return optimistic result
            return data as R;
        }
    };
}

export async function withOfflineCache<T>(
    table: string,
    businessId: string,
    onlineFetch: () => Promise<T[]>,
    useCache: boolean = true
): Promise<T[]> {
    if (navigator.onLine) {
        try {
            const data = await onlineFetch();
            // Cache the fresh data
            await cacheData(table, data, businessId);
            return data;
        } catch (error) {
            console.error('Online fetch failed, falling back to cache:', error);
            if (useCache) {
                return await getCachedData(table, businessId);
            }
            throw error;
        }
    } else {
        // Offline - use cached data
        return await getCachedData(table, businessId);
    }
}
