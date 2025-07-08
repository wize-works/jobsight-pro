import { ConflictResolutionService } from './conflict-resolution';

export interface BulkSyncOptions {
    batchSize: number;
    maxConcurrency: number;
    retryAttempts: number;
    retryDelay: number;
    priorityOrder: string[]; // Entity types in order of sync priority
    onProgress?: (progress: SyncProgress) => void;
    onError?: (error: SyncError) => void;
    userId?: string;
}

export interface SyncProgress {
    totalEntities: number;
    processedEntities: number;
    successfulSyncs: number;
    failedSyncs: number;
    conflictsResolved: number;
    currentEntity?: string;
    phase: 'preparing' | 'syncing' | 'resolving-conflicts' | 'completed' | 'failed';
    percentage: number;
    estimatedTimeRemaining?: number;
}

export interface SyncError {
    entityType: string;
    entityId: string;
    operation: 'create' | 'update' | 'delete';
    error: Error;
    retryCount: number;
    timestamp: Date;
}

export interface SyncResult {
    success: boolean;
    progress: SyncProgress;
    errors: SyncError[];
    conflictsResolved: number;
    duration: number;
    summary: {
        [entityType: string]: {
            total: number;
            synced: number;
            failed: number;
            conflicts: number;
        };
    };
}

export interface EntitySyncAdapter {
    entityType: string;
    getPendingChanges(): Promise<any[]>;
    syncToServer(items: any[]): Promise<{ success: any[], failed: { item: any, error: Error }[] }>;
    handleConflicts(conflicts: any[]): Promise<any[]>;
    getLastSyncTimestamp(): Promise<Date | null>;
    updateLastSyncTimestamp(timestamp: Date): Promise<void>;
}

class BulkSyncService {
    private static instance: BulkSyncService;
    private adapters: Map<string, EntitySyncAdapter> = new Map();
    private conflictService = ConflictResolutionService.getInstance();
    private activeSyncs: Map<string, AbortController> = new Map();

    private constructor() { }

    public static getInstance(): BulkSyncService {
        if (!BulkSyncService.instance) {
            BulkSyncService.instance = new BulkSyncService();
        }
        return BulkSyncService.instance;
    }

    public registerAdapter(adapter: EntitySyncAdapter): void {
        this.adapters.set(adapter.entityType, adapter);
    }

    public async syncAll(options: Partial<BulkSyncOptions> = {}): Promise<SyncResult> {
        const syncId = `sync-${Date.now()}`;
        const controller = new AbortController();
        this.activeSyncs.set(syncId, controller);

        const fullOptions: BulkSyncOptions = {
            batchSize: 50,
            maxConcurrency: 3,
            retryAttempts: 3,
            retryDelay: 1000,
            priorityOrder: [
                'business',
                'clients',
                'crews',
                'equipment',
                'tasks',
                'daily_logs',
                'media',
                'documents',
                'invoices'
            ],
            ...options
        };

        const startTime = Date.now();
        const result: SyncResult = {
            success: false,
            progress: {
                totalEntities: 0,
                processedEntities: 0,
                successfulSyncs: 0,
                failedSyncs: 0,
                conflictsResolved: 0,
                phase: 'preparing',
                percentage: 0
            },
            errors: [],
            conflictsResolved: 0,
            duration: 0,
            summary: {}
        };

        try {
            // Phase 1: Prepare sync data
            result.progress.phase = 'preparing';
            this.notifyProgress(result.progress, fullOptions);

            const syncPlan = await this.prepareSyncPlan(fullOptions);
            result.progress.totalEntities = syncPlan.totalItems;
            result.progress.phase = 'syncing';

            // Phase 2: Execute sync in priority order
            for (const entityType of fullOptions.priorityOrder) {
                if (controller.signal.aborted) break;

                const adapter = this.adapters.get(entityType);
                if (!adapter || !syncPlan.entityData.has(entityType)) continue;

                result.progress.currentEntity = entityType;
                this.notifyProgress(result.progress, fullOptions);

                const entityResult = await this.syncEntity(
                    adapter,
                    syncPlan.entityData.get(entityType)!,
                    fullOptions,
                    controller.signal
                );

                // Update results
                result.summary[entityType] = {
                    total: entityResult.total,
                    synced: entityResult.synced,
                    failed: entityResult.failed,
                    conflicts: entityResult.conflicts
                };

                result.progress.processedEntities += entityResult.total;
                result.progress.successfulSyncs += entityResult.synced;
                result.progress.failedSyncs += entityResult.failed;
                result.progress.conflictsResolved += entityResult.conflicts;
                result.errors.push(...entityResult.errors);

                // Update progress percentage
                result.progress.percentage = Math.round(
                    (result.progress.processedEntities / result.progress.totalEntities) * 100
                );

                // Estimate time remaining
                const elapsed = Date.now() - startTime;
                const rate = result.progress.processedEntities / elapsed;
                const remaining = result.progress.totalEntities - result.progress.processedEntities;
                result.progress.estimatedTimeRemaining = remaining / rate;

                this.notifyProgress(result.progress, fullOptions);
            }

            // Phase 3: Resolve any remaining conflicts
            result.progress.phase = 'resolving-conflicts';
            this.notifyProgress(result.progress, fullOptions);

            const pendingConflicts = this.conflictService.getPendingConflicts();
            if (pendingConflicts.length > 0) {
                // Auto-resolve conflicts where possible
                await this.resolveRemainingConflicts(pendingConflicts, fullOptions);
            }

            result.progress.phase = 'completed';
            result.progress.percentage = 100;
            result.success = result.errors.length === 0;
            result.conflictsResolved = result.progress.conflictsResolved;

        } catch (error) {
            result.progress.phase = 'failed';
            result.errors.push({
                entityType: 'system',
                entityId: 'bulk-sync',
                operation: 'create',
                error: error as Error,
                retryCount: 0,
                timestamp: new Date()
            });
        } finally {
            result.duration = Date.now() - startTime;
            this.activeSyncs.delete(syncId);
            this.notifyProgress(result.progress, fullOptions);
        }

        return result;
    }

    private async prepareSyncPlan(options: BulkSyncOptions): Promise<{
        totalItems: number;
        entityData: Map<string, any[]>;
    }> {
        const entityData = new Map<string, any[]>();
        let totalItems = 0;

        for (const entityType of options.priorityOrder) {
            const adapter = this.adapters.get(entityType);
            if (adapter) {
                try {
                    const pendingChanges = await adapter.getPendingChanges();
                    if (pendingChanges.length > 0) {
                        entityData.set(entityType, pendingChanges);
                        totalItems += pendingChanges.length;
                    }
                } catch (error) {
                    console.warn(`Failed to get pending changes for ${entityType}:`, error);
                }
            }
        }

        return { totalItems, entityData };
    }

    private async syncEntity(
        adapter: EntitySyncAdapter,
        items: any[],
        options: BulkSyncOptions,
        signal: AbortSignal
    ): Promise<{
        total: number;
        synced: number;
        failed: number;
        conflicts: number;
        errors: SyncError[];
    }> {
        const result = {
            total: items.length,
            synced: 0,
            failed: 0,
            conflicts: 0,
            errors: [] as SyncError[]
        };

        // Process items in batches
        for (let i = 0; i < items.length; i += options.batchSize) {
            if (signal.aborted) break;

            const batch = items.slice(i, i + options.batchSize);

            try {
                const syncResult = await this.syncBatch(adapter, batch, options);
                result.synced += syncResult.success.length;
                result.failed += syncResult.failed.length;

                // Add errors from failed items
                syncResult.failed.forEach(failure => {
                    result.errors.push({
                        entityType: adapter.entityType,
                        entityId: failure.item.id || 'unknown',
                        operation: failure.item._operation || 'update',
                        error: failure.error,
                        retryCount: 0,
                        timestamp: new Date()
                    });
                });

            } catch (error) {
                result.failed += batch.length;
                batch.forEach(item => {
                    result.errors.push({
                        entityType: adapter.entityType,
                        entityId: item.id || 'unknown',
                        operation: item._operation || 'update',
                        error: error as Error,
                        retryCount: 0,
                        timestamp: new Date()
                    });
                });
            }

            // Brief pause between batches to prevent overwhelming the server
            if (i + options.batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return result;
    }

    private async syncBatch(
        adapter: EntitySyncAdapter,
        batch: any[],
        options: BulkSyncOptions
    ): Promise<{ success: any[], failed: { item: any, error: Error }[] }> {
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < options.retryAttempts) {
            try {
                return await adapter.syncToServer(batch);
            } catch (error) {
                lastError = error as Error;
                attempt++;

                if (attempt < options.retryAttempts) {
                    const delay = options.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // If all retries failed, return all items as failed
        return {
            success: [],
            failed: batch.map(item => ({ item, error: lastError! }))
        };
    }

    private async resolveRemainingConflicts(
        conflicts: any[],
        options: BulkSyncOptions
    ): Promise<void> {
        for (const conflict of conflicts) {
            try {
                const resolutions = await this.conflictService.resolveConflicts(
                    [conflict],
                    options.userId
                );

                if (resolutions.size > 0) {
                    // Apply the resolution (this would need to be implemented per entity type)
                    console.log(`Resolved conflict for ${conflict.entityType}:${conflict.entityId}`);
                }
            } catch (error) {
                console.warn(`Failed to resolve conflict:`, error);
            }
        }
    }

    private notifyProgress(progress: SyncProgress, options: BulkSyncOptions): void {
        if (options.onProgress) {
            options.onProgress(progress);
        }
    }

    public cancelSync(syncId?: string): void {
        if (syncId) {
            const controller = this.activeSyncs.get(syncId);
            if (controller) {
                controller.abort();
                this.activeSyncs.delete(syncId);
            }
        } else {
            // Cancel all active syncs
            this.activeSyncs.forEach(controller => controller.abort());
            this.activeSyncs.clear();
        }
    }

    public getActiveSyncs(): string[] {
        return Array.from(this.activeSyncs.keys());
    }

    public async syncSpecificEntities(
        entityTypes: string[],
        options: Partial<BulkSyncOptions> = {}
    ): Promise<SyncResult> {
        const customOptions = {
            ...options,
            priorityOrder: entityTypes
        };
        return this.syncAll(customOptions);
    }
}

export { BulkSyncService };
