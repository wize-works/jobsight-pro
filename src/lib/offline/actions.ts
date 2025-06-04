
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { getCachedData, cacheData } from './storage';

export function createOfflineAction<T extends any[], R>(
  onlineAction: (...args: T) => Promise<R>,
  table: string,
  operation: 'insert' | 'update' | 'delete'
) {
  return async (...args: T): Promise<R> => {
    const { isOnline, queueOperation } = useOfflineSync();
    
    if (isOnline) {
      try {
        const result = await onlineAction(...args);
        return result;
      } catch (error) {
        // If online action fails, queue for later
        console.error('Online action failed, queuing for later:', error);
        throw error; // Still throw to maintain API contract
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
      await queueOperation(table, operation, data, businessId, userId);
      
      // Return a placeholder result
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
