export interface OfflineStatus {
    isOnline: boolean;
    lastOnline?: Date;
    syncStatus: 'idle' | 'syncing' | 'error' | 'conflicts';
    pendingChanges: number;
    pendingConflicts: number;
    lastSync?: Date;
    nextSync?: Date;
    batteryLevel?: number;
    storageUsed: number;
    storageLimit: number;
    networkType?: 'wifi' | 'cellular' | 'unknown';
    networkSpeed?: 'slow' | 'fast' | 'unknown';
}

export interface ConnectionQuality {
    type: 'wifi' | 'cellular' | 'unknown';
    speed: 'slow' | 'fast' | 'unknown';
    quality: 'poor' | 'good' | 'excellent';
    latency?: number;
    bandwidth?: number;
}

export interface StorageInfo {
    used: number;
    available: number;
    total: number;
    percentage: number;
    entities: {
        [entityType: string]: {
            count: number;
            size: number;
        };
    };
}

export interface SyncStatusDetails {
    isActive: boolean;
    strategy?: string;
    progress?: number;
    currentEntity?: string;
    estimatedCompletion?: Date;
    lastError?: Error;
    consecutiveErrors: number;
}

class OfflineStatusManager {
    private static instance: OfflineStatusManager;
    private status: OfflineStatus;
    private connectionQuality: ConnectionQuality;
    private syncDetails: SyncStatusDetails;
    private eventListeners: Map<string, ((status: OfflineStatus) => void)[]> = new Map();
    private statusUpdateInterval?: NodeJS.Timeout;
    private connectionTestInterval?: NodeJS.Timeout;

    private constructor() {
        this.status = this.initializeStatus();
        this.connectionQuality = this.initializeConnectionQuality();
        this.syncDetails = this.initializeSyncDetails();
        this.setupEventListeners();
        this.startStatusMonitoring();
    }

    public static getInstance(): OfflineStatusManager {
        if (!OfflineStatusManager.instance) {
            OfflineStatusManager.instance = new OfflineStatusManager();
        }
        return OfflineStatusManager.instance;
    }

    private initializeStatus(): OfflineStatus {
        return {
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
            syncStatus: 'idle',
            pendingChanges: 0,
            pendingConflicts: 0,
            storageUsed: 0,
            storageLimit: 50 * 1024 * 1024, // 50MB default limit
            networkType: 'unknown',
            networkSpeed: 'unknown'
        };
    }

    private initializeConnectionQuality(): ConnectionQuality {
        return {
            type: 'unknown',
            speed: 'unknown',
            quality: 'poor'
        };
    }

    private initializeSyncDetails(): SyncStatusDetails {
        return {
            isActive: false,
            consecutiveErrors: 0
        };
    }

    private setupEventListeners(): void {
        if (typeof window === 'undefined') return;

        // Network status listeners
        window.addEventListener('online', () => {
            this.updateNetworkStatus(true);
        });

        window.addEventListener('offline', () => {
            this.updateNetworkStatus(false);
        });

        // Connection change listener
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            connection?.addEventListener('change', () => {
                this.updateConnectionInfo();
            });
        }

        // Visibility change (for background sync detection)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updateStatus();
            }
        });

        // Battery status (if available)
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                const updateBattery = () => {
                    this.status.batteryLevel = Math.round(battery.level * 100);
                    this.emitStatusChange();
                };

                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);
                updateBattery();
            });
        }
    }

    private startStatusMonitoring(): void {
        // Update status every 30 seconds
        this.statusUpdateInterval = setInterval(() => {
            this.updateStatus();
        }, 30000);

        // Test connection quality every 2 minutes when online
        this.connectionTestInterval = setInterval(() => {
            if (this.status.isOnline) {
                this.testConnectionQuality();
            }
        }, 120000);

        // Initial updates
        this.updateStatus();
        this.updateConnectionInfo();
    }

    private updateNetworkStatus(isOnline: boolean): void {
        const wasOnline = this.status.isOnline;
        this.status.isOnline = isOnline;

        if (isOnline && !wasOnline) {
            // Just came online
            this.status.lastOnline = new Date();
            this.testConnectionQuality();
        } else if (!isOnline && wasOnline) {
            // Just went offline
            this.connectionQuality.quality = 'poor';
            this.status.networkType = 'unknown';
            this.status.networkSpeed = 'unknown';
        }

        this.emitStatusChange();
        this.emitNetworkChange(isOnline);
    }

    private updateConnectionInfo(): void {
        if (typeof navigator === 'undefined' || !('connection' in navigator)) return;

        const connection = (navigator as any).connection;
        if (!connection) return;

        // Update network type
        const effectiveType = connection.effectiveType;
        if (effectiveType) {
            if (effectiveType.includes('wifi') || connection.type === 'wifi') {
                this.status.networkType = 'wifi';
            } else if (effectiveType.includes('cellular') || connection.type === 'cellular') {
                this.status.networkType = 'cellular';
            } else {
                this.status.networkType = 'unknown';
            }
        }

        // Update speed estimation
        if (effectiveType === '4g' || effectiveType === '3g') {
            this.status.networkSpeed = 'fast';
        } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
            this.status.networkSpeed = 'slow';
        } else {
            this.status.networkSpeed = 'unknown';
        }

        // Update connection quality details
        this.connectionQuality.type = this.status.networkType || 'unknown';
        this.connectionQuality.speed = this.status.networkSpeed || 'unknown';

        if (connection.downlink) {
            this.connectionQuality.bandwidth = connection.downlink;
        }

        if (connection.rtt) {
            this.connectionQuality.latency = connection.rtt;
        }

        this.updateConnectionQuality();
        this.emitStatusChange();
    }

    private updateConnectionQuality(): void {
        const { bandwidth, latency } = this.connectionQuality;

        if (bandwidth && latency) {
            if (bandwidth > 2 && latency < 100) {
                this.connectionQuality.quality = 'excellent';
            } else if (bandwidth > 0.5 && latency < 300) {
                this.connectionQuality.quality = 'good';
            } else {
                this.connectionQuality.quality = 'poor';
            }
        } else if (this.status.networkSpeed === 'fast') {
            this.connectionQuality.quality = 'good';
        } else if (this.status.networkSpeed === 'slow') {
            this.connectionQuality.quality = 'poor';
        }
    }

    private async testConnectionQuality(): Promise<void> {
        if (!this.status.isOnline) return;

        try {
            const startTime = performance.now();

            // Use a small image or API endpoint for testing
            const response = await fetch('/api/ping', {
                method: 'HEAD',
                cache: 'no-cache'
            });

            if (response.ok) {
                const endTime = performance.now();
                const latency = endTime - startTime;

                this.connectionQuality.latency = latency;

                if (latency < 100) {
                    this.connectionQuality.quality = 'excellent';
                } else if (latency < 300) {
                    this.connectionQuality.quality = 'good';
                } else {
                    this.connectionQuality.quality = 'poor';
                }
            }
        } catch (error) {
            this.connectionQuality.quality = 'poor';
            this.updateNetworkStatus(false);
        }

        this.emitStatusChange();
    }

    public async updateStatus(): Promise<void> {
        await Promise.all([
            this.updatePendingChanges(),
            this.updateStorageInfo(),
            this.updateSyncStatus()
        ]);

        this.emitStatusChange();
    }

    private async updatePendingChanges(): Promise<void> {
        try {
            // This would integrate with your Dexie database
            // For now, using placeholder logic
            this.status.pendingChanges = 0; // await this.countPendingChanges();

            // Update pending conflicts
            const { ConflictResolutionService } = await import('./conflict-resolution');
            const conflictService = ConflictResolutionService.getInstance();
            this.status.pendingConflicts = conflictService.getPendingConflicts().length;
        } catch (error) {
            console.warn('Failed to update pending changes:', error);
        }
    }

    private async updateStorageInfo(): Promise<void> {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                this.status.storageUsed = estimate.usage || 0;

                if (estimate.quota) {
                    this.status.storageLimit = estimate.quota;
                }
            }
        } catch (error) {
            console.warn('Failed to get storage info:', error);
        }
    }

    private async updateSyncStatus(): Promise<void> {
        try {
            const { SyncOrchestrator } = await import('./sync-orchestrator');
            const orchestrator = SyncOrchestrator.getInstance();
            const orchestratorStatus = orchestrator.getStatus();

            if (orchestratorStatus.activeStrategies.length > 0) {
                this.status.syncStatus = 'syncing';
                this.syncDetails.isActive = true;
                this.syncDetails.strategy = orchestratorStatus.activeStrategies[0];
            } else if (this.status.pendingConflicts > 0) {
                this.status.syncStatus = 'conflicts';
                this.syncDetails.isActive = false;
            } else if (this.syncDetails.consecutiveErrors > 2) {
                this.status.syncStatus = 'error';
                this.syncDetails.isActive = false;
            } else {
                this.status.syncStatus = 'idle';
                this.syncDetails.isActive = false;
            }

            // Update sync timestamps
            const schedules = orchestrator.getAllSchedules();
            if (schedules.length > 0) {
                const lastRuns = schedules
                    .map(s => s.lastRun)
                    .filter(Boolean)
                    .sort((a, b) => b!.getTime() - a!.getTime());

                if (lastRuns.length > 0) {
                    this.status.lastSync = lastRuns[0];
                }

                const nextRuns = schedules
                    .map(s => s.nextRun)
                    .filter(Boolean)
                    .sort((a, b) => a.getTime() - b.getTime());

                if (nextRuns.length > 0) {
                    this.status.nextSync = nextRuns[0];
                }
            }
        } catch (error) {
            console.warn('Failed to update sync status:', error);
        }
    }

    public getStatus(): OfflineStatus {
        return { ...this.status };
    }

    public getConnectionQuality(): ConnectionQuality {
        return { ...this.connectionQuality };
    }

    public getSyncDetails(): SyncStatusDetails {
        return { ...this.syncDetails };
    }

    public async getStorageInfo(): Promise<StorageInfo> {
        const storageInfo: StorageInfo = {
            used: this.status.storageUsed,
            available: this.status.storageLimit - this.status.storageUsed,
            total: this.status.storageLimit,
            percentage: (this.status.storageUsed / this.status.storageLimit) * 100,
            entities: {}
        };

        try {
            // This would integrate with your Dexie database to get entity counts
            // For now, using placeholder data
            storageInfo.entities = {
                tasks: { count: 0, size: 0 },
                clients: { count: 0, size: 0 },
                media: { count: 0, size: 0 },
                documents: { count: 0, size: 0 }
            };
        } catch (error) {
            console.warn('Failed to get detailed storage info:', error);
        }

        return storageInfo;
    }

    public updateSyncProgress(progress: number, currentEntity?: string, estimatedCompletion?: Date): void {
        this.syncDetails.progress = progress;
        this.syncDetails.currentEntity = currentEntity;
        this.syncDetails.estimatedCompletion = estimatedCompletion;
        this.emitStatusChange();
    }

    public reportSyncError(error: Error): void {
        this.syncDetails.lastError = error;
        this.syncDetails.consecutiveErrors++;
        this.status.syncStatus = 'error';
        this.emitStatusChange();
    }

    public reportSyncSuccess(): void {
        this.syncDetails.consecutiveErrors = 0;
        this.syncDetails.lastError = undefined;
        this.status.lastSync = new Date();
        this.status.syncStatus = 'idle';
        this.emitStatusChange();
    }

    public isGoodForSync(): boolean {
        return (
            this.status.isOnline &&
            this.connectionQuality.quality !== 'poor' &&
            (this.status.batteryLevel === undefined || this.status.batteryLevel > 20) &&
            this.status.storageUsed < this.status.storageLimit * 0.9 // Less than 90% full
        );
    }

    public shouldDeferSync(): boolean {
        return (
            !this.status.isOnline ||
            this.connectionQuality.quality === 'poor' ||
            (this.status.batteryLevel !== undefined && this.status.batteryLevel < 10) ||
            this.status.storageUsed > this.status.storageLimit * 0.95 // More than 95% full
        );
    }

    public on(event: 'status-change', callback: (status: OfflineStatus) => void): void;
    public on(event: 'network-change', callback: (isOnline: boolean) => void): void;
    public on(event: 'sync-change', callback: (details: SyncStatusDetails) => void): void;
    public on(event: string, callback: any): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    public off(event: string, callback: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emitStatusChange(): void {
        this.emit('status-change', this.status);
    }

    private emitNetworkChange(isOnline: boolean): void {
        this.emit('network-change', isOnline);
    }

    private emitSyncChange(): void {
        this.emit('sync-change', this.syncDetails);
    }

    private emit(event: string, data: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    public destroy(): void {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
        }

        if (this.connectionTestInterval) {
            clearInterval(this.connectionTestInterval);
        }

        this.eventListeners.clear();
    }
}

export { OfflineStatusManager };
