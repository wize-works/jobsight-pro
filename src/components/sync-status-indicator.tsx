'use client';

import { useOfflineSync } from '@/hooks/use-offline-sync';
import { cn } from '@/lib/utils';

export default function SyncStatusIndicator() {
    const { isOnline, isSyncing, queueCount, lastSyncTime, syncError, forcSync } = useOfflineSync();

    const getSyncIcon = () => {
        if (!isOnline) return <i className="fas fa-cloud-download-alt"></i>;
        if (isSyncing) return <i className="fas fa-sync fa-spin"></i>;
        if (syncError) return <i className="fas fa-exclamation-triangle"></i>;
        if (queueCount === 0) return <i className="fas fa-check-circle"></i>;
        return <i className="fas fa-cloud"></i>;
    };

    const getSyncStatus = () => {
        if (!isOnline) return 'Offline';
        if (isSyncing) return 'Syncing...';
        if (syncError) return 'Sync Error';
        if (queueCount > 0) return `${queueCount} pending`;
        return 'Synced';
    };

    const getStatusColor = () => {
        if (!isOnline) return 'text-gray-500';
        if (isSyncing) return 'text-blue-500';
        if (syncError) return 'text-red-500';
        if (queueCount > 0) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
        <div className="flex items-center gap-2">
            <button
                className={cn(
                    "btn btn-ghost btn-sm flex items-center gap-2 text-xs",
                    getStatusColor()
                )}
                onClick={forcSync}
                disabled={!isOnline || isSyncing}
            >
                {getSyncIcon()}
                <span className="hidden sm:inline">{getSyncStatus()}</span>
            </button>

            {lastSyncTime && (
                <span className="text-xs text-gray-500 hidden md:inline">
                    Last sync: {lastSyncTime.toLocaleTimeString()}
                </span>
            )}
        </div>
    );
}