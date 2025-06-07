import { useState, useEffect } from 'react';
import { syncManager, type SyncStatus } from '@/lib/offline/sync-client';

export function useOfflineSync() {
    const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus());

    useEffect(() => {
        const unsubscribe = syncManager.subscribe(setStatus);
        return unsubscribe;
    }, []);

    const queueOperation = async (
        table: string,
        operation: 'insert' | 'update' | 'delete',
        data: any,
        businessId: string,
        userId?: string
    ) => {
        await syncManager.queueOperation(table, operation, data, businessId, userId);
    };

    const forcSync = async () => {
        await syncManager.syncWhenOnline();
    };

    return {
        ...status,
        queueOperation,
        forcSync,
    };
}