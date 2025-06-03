
'use client';

import { useOfflineSync } from '@/hooks/use-offline-sync';
import { Button } from '@/components/ui/button';
import { 
  CloudIcon, 
  CloudOffIcon, 
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SyncStatusIndicator() {
  const { isOnline, isSyncing, queueCount, lastSyncTime, syncError, forcSync } = useOfflineSync();

  const getSyncIcon = () => {
    if (!isOnline) return <CloudOffIcon className="w-4 h-4" />;
    if (isSyncing) return <RefreshCwIcon className="w-4 h-4 animate-spin" />;
    if (syncError) return <AlertCircleIcon className="w-4 h-4" />;
    if (queueCount === 0) return <CheckCircleIcon className="w-4 h-4" />;
    return <CloudIcon className="w-4 h-4" />;
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
      <Button
        variant="ghost"
        size="sm"
        onClick={forcSync}
        disabled={!isOnline || isSyncing}
        className={cn(
          "flex items-center gap-2 text-xs",
          getStatusColor()
        )}
      >
        {getSyncIcon()}
        <span className="hidden sm:inline">{getSyncStatus()}</span>
      </Button>
      
      {lastSyncTime && (
        <span className="text-xs text-gray-500 hidden md:inline">
          Last sync: {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
