import { BulkSyncService, SyncProgress, SyncError, SyncResult } from './bulk-sync';
import { ConflictResolutionService } from './conflict-resolution';

export interface SyncStrategy {
    name: string;
    priority: number;
    schedule?: {
        interval: number; // milliseconds
        maxRetries: number;
        backoffMultiplier: number;
    };
    conditions?: {
        networkRequired: boolean;
        minBatteryLevel?: number;
        maxPendingItems?: number;
        userInitiated?: boolean;
    };
    entities: string[];
}

export interface OrchestratorConfig {
    strategies: SyncStrategy[];
    globalTimeout: number;
    maxConcurrentSyncs: number;
    retryPolicy: {
        maxRetries: number;
        baseDelay: number;
        maxDelay: number;
        exponentialBackoff: boolean;
    };
    networkMonitoring: boolean;
    batteryMonitoring: boolean;
    conflictResolutionTimeout: number;
}

export interface SyncSchedule {
    strategyName: string;
    nextRun: Date;
    lastRun?: Date;
    retryCount: number;
    status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface OrchestratorStatus {
    isRunning: boolean;
    activeStrategies: string[];
    scheduledSyncs: SyncSchedule[];
    lastSyncResults: Map<string, SyncResult>;
    systemHealth: {
        networkStatus: 'online' | 'offline' | 'unstable';
        batteryLevel?: number;
        pendingItems: number;
        conflictCount: number;
        errorCount: number;
    };
}

class SyncOrchestrator {
    private static instance: SyncOrchestrator;
    private config: OrchestratorConfig;
    private bulkSync = BulkSyncService.getInstance();
    private conflictService = ConflictResolutionService.getInstance();
    private schedules: Map<string, SyncSchedule> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private isRunning = false;
    private status: OrchestratorStatus;
    private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

    private constructor() {
        this.config = this.getDefaultConfig();
        this.status = this.initializeStatus();
        this.initializeMonitoring();
    }

    public static getInstance(): SyncOrchestrator {
        if (!SyncOrchestrator.instance) {
            SyncOrchestrator.instance = new SyncOrchestrator();
        }
        return SyncOrchestrator.instance;
    }

    private getDefaultConfig(): OrchestratorConfig {
        return {
            strategies: [
                {
                    name: 'critical-immediate',
                    priority: 1,
                    conditions: {
                        networkRequired: true,
                        userInitiated: true
                    },
                    entities: ['tasks', 'daily_logs', 'invoices']
                },
                {
                    name: 'background-periodic',
                    priority: 2,
                    schedule: {
                        interval: 5 * 60 * 1000, // 5 minutes
                        maxRetries: 3,
                        backoffMultiplier: 2
                    },
                    conditions: {
                        networkRequired: true,
                        maxPendingItems: 100
                    },
                    entities: ['clients', 'crews', 'equipment']
                },
                {
                    name: 'media-batch',
                    priority: 3,
                    schedule: {
                        interval: 15 * 60 * 1000, // 15 minutes
                        maxRetries: 2,
                        backoffMultiplier: 1.5
                    },
                    conditions: {
                        networkRequired: true,
                        minBatteryLevel: 30
                    },
                    entities: ['media', 'documents']
                },
                {
                    name: 'full-sync',
                    priority: 4,
                    schedule: {
                        interval: 60 * 60 * 1000, // 1 hour
                        maxRetries: 1,
                        backoffMultiplier: 1
                    },
                    conditions: {
                        networkRequired: true,
                        minBatteryLevel: 50
                    },
                    entities: ['*'] // All entities
                }
            ],
            globalTimeout: 30 * 60 * 1000, // 30 minutes
            maxConcurrentSyncs: 2,
            retryPolicy: {
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 30000,
                exponentialBackoff: true
            },
            networkMonitoring: true,
            batteryMonitoring: true,
            conflictResolutionTimeout: 5 * 60 * 1000 // 5 minutes
        };
    }

    private initializeStatus(): OrchestratorStatus {
        return {
            isRunning: false,
            activeStrategies: [],
            scheduledSyncs: [],
            lastSyncResults: new Map(),
            systemHealth: {
                networkStatus: 'online',
                pendingItems: 0,
                conflictCount: 0,
                errorCount: 0
            }
        };
    }

    private initializeMonitoring(): void {
        if (this.config.networkMonitoring && typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.status.systemHealth.networkStatus = 'online';
                this.emit('network-change', { status: 'online' });
                this.checkAndResumeSyncs();
            });

            window.addEventListener('offline', () => {
                this.status.systemHealth.networkStatus = 'offline';
                this.emit('network-change', { status: 'offline' });
                this.pauseNetworkDependentSyncs();
            });
        }

        if (this.config.batteryMonitoring && 'navigator' in globalThis && 'getBattery' in navigator) {
            (navigator as any).getBattery?.().then((battery: any) => {
                const updateBattery = () => {
                    this.status.systemHealth.batteryLevel = Math.round(battery.level * 100);
                    this.emit('battery-change', { level: this.status.systemHealth.batteryLevel });
                };

                battery.addEventListener('levelchange', updateBattery);
                updateBattery();
            });
        }
    }

    public configure(config: Partial<OrchestratorConfig>): void {
        this.config = { ...this.config, ...config };
        this.rescheduleAll();
    }

    public start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.status.isRunning = true;

        // Initialize schedules for all strategies with schedules
        this.config.strategies.forEach(strategy => {
            if (strategy.schedule) {
                this.scheduleStrategy(strategy);
            }
        });

        this.emit('orchestrator-started', { timestamp: new Date() });
    }

    public stop(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.status.isRunning = false;

        // Clear all timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();

        // Cancel active syncs
        this.bulkSync.cancelSync();

        this.status.activeStrategies = [];
        this.emit('orchestrator-stopped', { timestamp: new Date() });
    }

    public async executeStrategy(
        strategyName: string,
        forceRun = false
    ): Promise<SyncResult> {
        const strategy = this.config.strategies.find(s => s.name === strategyName);
        if (!strategy) {
            throw new Error(`Strategy '${strategyName}' not found`);
        }

        // Check conditions unless forced
        if (!forceRun && !await this.checkConditions(strategy)) {
            throw new Error(`Conditions not met for strategy '${strategyName}'`);
        }

        // Check concurrent sync limit
        if (this.status.activeStrategies.length >= this.config.maxConcurrentSyncs && !forceRun) {
            throw new Error('Maximum concurrent syncs reached');
        }

        const schedule = this.schedules.get(strategyName);
        if (schedule) {
            schedule.status = 'running';
            schedule.lastRun = new Date();
        }

        this.status.activeStrategies.push(strategyName);
        this.emit('strategy-started', { strategy: strategyName, timestamp: new Date() });

        try {
            const entities = strategy.entities.includes('*')
                ? this.config.strategies.flatMap(s => s.entities).filter(e => e !== '*')
                : strategy.entities;

            const result = await this.bulkSync.syncSpecificEntities(entities, {
                maxConcurrency: Math.min(3, this.config.maxConcurrentSyncs),
                onProgress: (progress) => {
                    this.emit('sync-progress', { strategy: strategyName, progress });
                },
                onError: (error) => {
                    this.emit('sync-error', { strategy: strategyName, error });
                }
            });

            this.status.lastSyncResults.set(strategyName, result);

            if (schedule) {
                schedule.status = result.success ? 'completed' : 'failed';
                schedule.retryCount = result.success ? 0 : schedule.retryCount + 1;
            }

            this.updateSystemHealth();
            this.emit('strategy-completed', {
                strategy: strategyName,
                result,
                timestamp: new Date()
            });

            return result;

        } catch (error) {
            if (schedule) {
                schedule.status = 'failed';
                schedule.retryCount++;
            }

            this.status.systemHealth.errorCount++;
            this.emit('strategy-failed', {
                strategy: strategyName,
                error,
                timestamp: new Date()
            });

            throw error;

        } finally {
            this.status.activeStrategies = this.status.activeStrategies.filter(s => s !== strategyName);

            // Reschedule if it's a scheduled strategy
            if (strategy.schedule && this.isRunning) {
                this.scheduleStrategy(strategy);
            }
        }
    }

    private async checkConditions(strategy: SyncStrategy): Promise<boolean> {
        const conditions = strategy.conditions;
        if (!conditions) return true;

        // Network check
        if (conditions.networkRequired && this.status.systemHealth.networkStatus !== 'online') {
            return false;
        }

        // Battery check
        if (conditions.minBatteryLevel && this.status.systemHealth.batteryLevel) {
            if (this.status.systemHealth.batteryLevel < conditions.minBatteryLevel) {
                return false;
            }
        }

        // Pending items check
        if (conditions.maxPendingItems) {
            await this.updatePendingItemsCount();
            if (this.status.systemHealth.pendingItems > conditions.maxPendingItems) {
                return false;
            }
        }

        return true;
    }

    private scheduleStrategy(strategy: SyncStrategy): void {
        if (!strategy.schedule) return;

        const schedule: SyncSchedule = this.schedules.get(strategy.name) || {
            strategyName: strategy.name,
            nextRun: new Date(),
            retryCount: 0,
            status: 'scheduled'
        };

        // Calculate next run time
        const now = new Date();
        const delay = this.calculateDelay(strategy, schedule);
        schedule.nextRun = new Date(now.getTime() + delay);
        schedule.status = 'scheduled';

        this.schedules.set(strategy.name, schedule);

        // Clear existing timer
        const existingTimer = this.timers.get(strategy.name);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(async () => {
            if (!this.isRunning) return;

            try {
                await this.executeStrategy(strategy.name);
            } catch (error) {
                console.warn(`Scheduled sync failed for ${strategy.name}:`, error);

                // Retry if within limits
                if (schedule.retryCount < strategy.schedule!.maxRetries) {
                    this.scheduleStrategy(strategy);
                }
            }
        }, delay);

        this.timers.set(strategy.name, timer);
        this.updateScheduledSyncs();
    }

    private calculateDelay(strategy: SyncStrategy, schedule: SyncSchedule): number {
        if (!strategy.schedule) return 0;

        let delay = strategy.schedule.interval;

        // Apply backoff for retries
        if (schedule.retryCount > 0) {
            const backoffMultiplier = strategy.schedule.backoffMultiplier || 1;
            delay *= Math.pow(backoffMultiplier, schedule.retryCount);
        }

        // Apply jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay; // ±10% jitter
        delay += jitter - (0.05 * delay);

        return Math.max(1000, delay); // Minimum 1 second
    }

    private rescheduleAll(): void {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        this.schedules.clear();

        if (this.isRunning) {
            this.config.strategies.forEach(strategy => {
                if (strategy.schedule) {
                    this.scheduleStrategy(strategy);
                }
            });
        }
    }

    private checkAndResumeSyncs(): void {
        // Resume scheduled syncs that may have been paused
        this.config.strategies.forEach(strategy => {
            if (strategy.schedule && !this.timers.has(strategy.name)) {
                this.scheduleStrategy(strategy);
            }
        });
    }

    private pauseNetworkDependentSyncs(): void {
        this.config.strategies.forEach(strategy => {
            if (strategy.conditions?.networkRequired) {
                const timer = this.timers.get(strategy.name);
                if (timer) {
                    clearTimeout(timer);
                    this.timers.delete(strategy.name);
                }

                const schedule = this.schedules.get(strategy.name);
                if (schedule) {
                    schedule.status = 'cancelled';
                }
            }
        });

        this.updateScheduledSyncs();
    }

    private async updateSystemHealth(): Promise<void> {
        await this.updatePendingItemsCount();
        this.status.systemHealth.conflictCount = this.conflictService.getPendingConflicts().length;

        // Update error count from last sync results
        let errorCount = 0;
        this.status.lastSyncResults.forEach(result => {
            errorCount += result.errors.length;
        });
        this.status.systemHealth.errorCount = errorCount;
    }

    private async updatePendingItemsCount(): Promise<void> {
        try {
            // Enhanced pending items counting using Dexie database
            const { db } = await import('@/lib/offline/dexie-db');

            let pendingCount = 0;

            // Count items in various sync-related tables
            const syncMetadata = await db.syncMetadata.toArray();
            const lastSyncTimes = syncMetadata.reduce((acc: Record<string, number>, meta: any) => {
                acc[meta.table] = meta.lastSync;
                return acc;
            }, {});

            // Tables that typically have pending sync items
            const syncableTables = ['projects', 'tasks', 'dailyLogs', 'projectCrews', 'projectMilestones', 'crews'];

            for (const tableName of syncableTables) {
                try {
                    const table = (db as any)[tableName];
                    if (table) {
                        const lastSync = lastSyncTimes[tableName] || 0;
                        // Count items modified since last sync
                        const modifiedCount = await table
                            .where('updated_at')
                            .above(new Date(lastSync).toISOString())
                            .count();
                        pendingCount += modifiedCount;
                    }
                } catch (tableError) {
                    console.warn(`Failed to count pending items for ${tableName}:`, tableError);
                }
            }

            // Also check for items in upload queues
            try {
                const uploadQueueCount = await db.mediaUploadQueue
                    .where('uploadStatus')
                    .equals('pending')
                    .count();
                pendingCount += uploadQueueCount;
            } catch (uploadError) {
                console.warn('Failed to count upload queue items:', uploadError);
            }

            this.status.systemHealth.pendingItems = pendingCount;
        } catch (error) {
            console.warn('Failed to update pending items count:', error);
            // Fallback to zero if database access fails
            this.status.systemHealth.pendingItems = 0;
        }
    }

    private updateScheduledSyncs(): void {
        this.status.scheduledSyncs = Array.from(this.schedules.values());
    }

    public getStatus(): OrchestratorStatus {
        return { ...this.status };
    }

    public getSchedule(strategyName: string): SyncSchedule | undefined {
        return this.schedules.get(strategyName);
    }

    public getAllSchedules(): SyncSchedule[] {
        return Array.from(this.schedules.values());
    }

    public on(event: string, callback: (data: any) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    public off(event: string, callback: (data: any) => void): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
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

    public async triggerImmediateSync(entities?: string[]): Promise<SyncResult> {
        const result = entities
            ? await this.bulkSync.syncSpecificEntities(entities, { userId: 'system' })
            : await this.bulkSync.syncAll({ userId: 'system' });

        this.updateSystemHealth();
        return result;
    }

    public cancelStrategy(strategyName: string): boolean {
        const timer = this.timers.get(strategyName);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(strategyName);

            const schedule = this.schedules.get(strategyName);
            if (schedule) {
                schedule.status = 'cancelled';
            }

            this.updateScheduledSyncs();
            return true;
        }
        return false;
    }
}

export { SyncOrchestrator };
