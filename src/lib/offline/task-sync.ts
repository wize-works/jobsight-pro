/**
 * Enhanced Task Sync Service - Handles all task-related entities
 * 
 * This service manages synchronization for:
 * - tasks (base task management)
 * - subtasks (hierarchical task breakdown)  
 * - task_notes (communication and updates)
 * - task_dependencies (task sequencing and blocking)
 * 
 * IMPORTANT: All userId references use auth_id from authentication provider
 * 
 * ENHANCED FEATURES:
 * - Advanced conflict resolution with field-level strategies
 * - Performance optimization with query caching
 * - Bulk sync operations for improved efficiency
 * - Offline status monitoring and smart sync triggers
 */

import { db } from './dexie-db';
import { ConflictResolutionService, detectConflicts, mergeData } from './conflict-resolution';
import { PerformanceOptimizationService } from './performance-optimization';
import { OfflineStatusManager } from './status-manager';

interface SyncResult {
    success: boolean;
    synced: number;
    errors: string[];
    conflicts?: number;
    conflictsResolved?: number;
    lastSync?: number;
    duration?: number;
    performanceMetrics?: {
        cacheHits: number;
        queriesOptimized: number;
        batchOperations: number;
    };
}

interface SyncStatus {
    lastSync: number | null;
    pendingOperations: number;
    pendingConflicts: number;
    lastError?: string;
    isOptimized: boolean;
    networkQuality: string;
}

type TaskTable = 'tasks' | 'subtasks' | 'task_notes' | 'task_dependencies';

export class TaskSyncService {
    private static readonly SYNC_ENDPOINTS = {
        tasks: '/api/tasks',
        subtasks: '/api/subtasks',
        task_notes: '/api/task-notes',
        task_dependencies: '/api/task-dependencies'
    };

    private static readonly TABLES: TaskTable[] = ['tasks', 'subtasks', 'task_notes', 'task_dependencies'];

    // Advanced services
    private static conflictService = ConflictResolutionService.getInstance();
    private static performanceService = PerformanceOptimizationService.getInstance();
    private static statusManager = OfflineStatusManager.getInstance();

    /**
     * Perform full bidirectional sync for all task-related entities with advanced features
     * @param businessId - Business to sync data for
     * @param userId - User performing the sync (auth_id)
     * @param options - Advanced sync options
     */
    static async fullSync(
        businessId: string,
        userId?: string,
        options: {
            useConflictResolution?: boolean;
            enablePerformanceOptimization?: boolean;
            batchSize?: number;
            forceSync?: boolean;
        } = {}
    ): Promise<SyncResult> {
        const startTime = Date.now();
        console.log('Starting enhanced full task sync for business:', businessId);

        // Check if sync should proceed based on network/device status
        if (!options.forceSync && this.statusManager.shouldDeferSync()) {
            const status = this.statusManager.getStatus();
            return {
                success: false,
                synced: 0,
                errors: [`Sync deferred due to: ${!status.isOnline ? 'offline' : 'poor conditions'}`],
                duration: Date.now() - startTime
            };
        }

        const result: SyncResult = {
            success: true,
            synced: 0,
            errors: [],
            conflicts: 0,
            conflictsResolved: 0,
            performanceMetrics: {
                cacheHits: 0,
                queriesOptimized: 0,
                batchOperations: 0
            }
        };

        try {
            // Update sync status
            this.statusManager.updateSyncProgress(0, 'tasks');

            // Process each table with advanced features
            for (let i = 0; i < this.TABLES.length; i++) {
                const table = this.TABLES[i];
                const progress = Math.round(((i + 1) / this.TABLES.length) * 100);

                this.statusManager.updateSyncProgress(progress, table);

                try {
                    const tableResult = await this.syncTableAdvanced(
                        table,
                        businessId,
                        userId,
                        options
                    );

                    result.synced += tableResult.synced;
                    result.errors.push(...tableResult.errors);
                    result.conflicts = (result.conflicts || 0) + (tableResult.conflicts || 0);
                    result.conflictsResolved = (result.conflictsResolved || 0) + (tableResult.conflictsResolved || 0);

                    if (tableResult.performanceMetrics) {
                        result.performanceMetrics!.cacheHits += tableResult.performanceMetrics.cacheHits;
                        result.performanceMetrics!.queriesOptimized += tableResult.performanceMetrics.queriesOptimized;
                        result.performanceMetrics!.batchOperations += tableResult.performanceMetrics.batchOperations;
                    }

                } catch (error) {
                    console.error(`Task sync failed for table ${table}:`, error);
                    result.errors.push(`${table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    result.success = false;
                }
            }

            // Final status update
            result.duration = Date.now() - startTime;
            result.lastSync = Date.now();

            if (result.success && result.errors.length === 0) {
                this.statusManager.reportSyncSuccess();
            } else {
                this.statusManager.reportSyncError(new Error(result.errors.join(', ')));
            }

            // Update sync metadata
            await this.updateSyncMetadata(businessId, result.lastSync);

            console.log('Enhanced task sync completed:', {
                synced: result.synced,
                errors: result.errors.length,
                conflicts: result.conflicts,
                resolved: result.conflictsResolved,
                duration: result.duration,
                performance: result.performanceMetrics
            });

        } catch (error) {
            result.success = false;
            result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.duration = Date.now() - startTime;
            this.statusManager.reportSyncError(error as Error);
        }

        return result;
    }

    /**
     * Enhanced table sync with advanced conflict resolution and performance optimization
     */
    private static async syncTableAdvanced(
        table: TaskTable,
        businessId: string,
        userId?: string,
        options: any = {}
    ): Promise<SyncResult> {
        const tableResult: SyncResult = {
            success: true,
            synced: 0,
            errors: [],
            conflicts: 0,
            conflictsResolved: 0,
            performanceMetrics: {
                cacheHits: 0,
                queriesOptimized: 0,
                batchOperations: 0
            }
        };

        try {
            // Use performance optimization for queries
            const localChanges = await this.performanceService.optimizedQuery(
                table,
                () => this.getPendingChanges(table, businessId),
                `${table}_pending_${businessId}`
            );

            if (localChanges.length > 0) {
                tableResult.performanceMetrics!.queriesOptimized++;

                // Use batch operations if enabled and threshold is met
                if (options.enablePerformanceOptimization && localChanges.length >= (options.batchSize || 20)) {
                    const batchResult = await this.syncBatch(table, localChanges, businessId, userId, options);
                    Object.assign(tableResult, batchResult);
                    tableResult.performanceMetrics!.batchOperations++;
                } else {
                    // Individual sync with conflict resolution
                    for (const item of localChanges) {
                        const itemResult = await this.syncItemWithConflictResolution(
                            table,
                            item,
                            businessId,
                            userId,
                            options
                        );

                        tableResult.synced += itemResult.synced;
                        tableResult.errors.push(...itemResult.errors);
                        tableResult.conflicts = (tableResult.conflicts || 0) + (itemResult.conflicts || 0);
                        tableResult.conflictsResolved = (tableResult.conflictsResolved || 0) + (itemResult.conflictsResolved || 0);
                    }
                }
            }

            // Download server changes with optimization
            const serverChanges = await this.performanceService.optimizedQuery(
                table,
                () => this.fetchServerChanges(table, businessId),
                `${table}_server_${businessId}`,
                2 * 60 * 1000 // 2 minute cache
            );

            if (serverChanges.length > 0) {
                tableResult.performanceMetrics!.cacheHits++;
                const downloadResult = await this.processServerChanges(
                    table,
                    serverChanges,
                    businessId,
                    options
                );

                tableResult.synced += downloadResult.synced;
                tableResult.errors.push(...downloadResult.errors);
                tableResult.conflicts = (tableResult.conflicts || 0) + (downloadResult.conflicts || 0);
                tableResult.conflictsResolved = (tableResult.conflictsResolved || 0) + (downloadResult.conflictsResolved || 0);
            }

        } catch (error) {
            tableResult.success = false;
            tableResult.errors.push(`Table ${table} sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return tableResult;
    }

    /**
     * Sync individual item with advanced conflict resolution
     */
    private static async syncItemWithConflictResolution(
        table: TaskTable,
        item: any,
        businessId: string,
        userId?: string,
        options: any = {}
    ): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            synced: 0,
            errors: [],
            conflicts: 0,
            conflictsResolved: 0
        };

        try {
            const endpoint = this.SYNC_ENDPOINTS[table];
            const method = item.id ? 'PUT' : 'POST';
            const url = item.id ? `${endpoint}/${item.id}` : endpoint;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, business_id: businessId })
            });

            if (response.status === 409) {
                // Conflict detected - use advanced resolution
                if (options.useConflictResolution !== false) {
                    const conflictResult = await this.handleConflictAdvanced(
                        table,
                        item,
                        await response.json(),
                        businessId,
                        userId
                    );

                    result.conflicts = 1;
                    result.conflictsResolved = conflictResult.resolved ? 1 : 0;
                    result.synced = conflictResult.resolved ? 1 : 0;

                    if (!conflictResult.resolved) {
                        result.errors.push(`Unresolved conflict for ${table} item ${item.id}`);
                    }
                } else {
                    result.errors.push(`Conflict detected for ${table} item ${item.id} - no resolution`);
                    result.conflicts = 1;
                }
            } else if (response.ok) {
                // Success - update local record
                const serverData = await response.json();
                await this.updateLocalRecord(table, { ...serverData, _needsSync: 0 });
                result.synced = 1;
            } else {
                result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            result.success = false;
            result.errors.push(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Advanced conflict resolution using the ConflictResolutionService
     */
    private static async handleConflictAdvanced(
        table: TaskTable,
        localItem: any,
        serverResponse: any,
        businessId: string,
        userId?: string
    ): Promise<{ resolved: boolean; mergedData?: any }> {
        try {
            const serverItem = serverResponse.data || serverResponse;

            // Detect conflicts using the advanced service
            const conflicts = detectConflicts(localItem, serverItem, table, localItem.id);

            if (conflicts.length === 0) {
                return { resolved: true, mergedData: serverItem };
            }

            // Resolve conflicts using the service
            const resolutions = await this.conflictService.resolveConflicts(conflicts, userId);

            // Merge data with resolutions
            const mergedData = mergeData(localItem, serverItem, resolutions);

            // Update local record with merged data
            await this.updateLocalRecord(table, { ...mergedData, _needsSync: 0 });

            // If any manual resolutions are needed, log them
            const manualResolutions = Array.from(resolutions.values())
                .filter(r => r.strategy === 'manual');

            if (manualResolutions.length > 0) {
                console.warn(`Manual conflict resolution needed for ${table} item ${localItem.id}`);
                return { resolved: false };
            }

            return { resolved: true, mergedData };

        } catch (error) {
            console.error('Advanced conflict resolution failed:', error);
            return { resolved: false };
        }
    }

    /**
     * Batch sync operations for improved performance
     */
    private static async syncBatch(
        table: TaskTable,
        items: any[],
        businessId: string,
        userId?: string,
        options: any = {}
    ): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            synced: 0,
            errors: [],
            conflicts: 0,
            conflictsResolved: 0
        };

        try {
            // Queue items for batch processing
            for (const item of items) {
                this.performanceService.queueBatchOperation({
                    operation: item.id ? 'update' : 'create',
                    entityType: table,
                    data: { ...item, business_id: businessId },
                    id: item.id
                });
            }

            // Force process the batch
            await this.performanceService.flushBatches();

            result.synced = items.length;

        } catch (error) {
            result.success = false;
            result.errors.push(`Batch sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Fallback to individual sync
            for (const item of items) {
                const individualResult = await this.syncItemWithConflictResolution(
                    table, item, businessId, userId, options
                );
                result.synced += individualResult.synced;
                result.errors.push(...individualResult.errors);
            }
        }

        return result;
    }

    /**
     * Perform full bidirectional sync for all task-related entities
     * @param businessId - Business to sync data for
     * @param userId - User performing the sync (auth_id)
     */
    static async legacyFullSync(businessId: string, userId?: string): Promise<SyncResult> {
        console.log('Starting full task sync for business:', businessId);

        const result: SyncResult = {
            success: true,
            synced: 0,
            errors: []
        };

        try {
            // Check if we're online
            if (!navigator.onLine) {
                throw new Error('No internet connection available');
            }

            // Sync each entity type in dependency order
            for (const table of this.TABLES) {
                try {
                    // Push local changes to server first
                    const pushResult = await this.syncToServer({ businessId, userId, table });
                    result.synced += pushResult.synced;
                    result.errors.push(...pushResult.errors);

                    // Then pull server changes to local
                    const pullResult = await this.syncFromServer(businessId, table);
                    result.synced += pullResult.synced;
                    result.errors.push(...pullResult.errors);

                } catch (error) {
                    const errorMsg = `Failed to sync ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    result.errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }

            result.lastSync = Date.now();
            result.success = result.errors.length === 0;

            console.log(`Task sync completed. Synced: ${result.synced}, Errors: ${result.errors.length}`);
            return result;

        } catch (error) {
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
            console.error('Task sync failed:', error);
            return result;
        }
    }

    /**
     * Push local changes to server for a specific table
     * @param options - Sync options
     */
    static async syncToServer(options: {
        businessId: string;
        userId?: string;
        table?: TaskTable
    }): Promise<SyncResult> {
        const { businessId, userId, table } = options;
        const result: SyncResult = { success: true, synced: 0, errors: [] };

        try {
            // Get tables to sync (specific table or all)
            const tablesToSync = table ? [table] : [...this.TABLES];

            for (const tableName of tablesToSync) {
                // Get pending operations for this table
                const pendingOperations = await db.syncQueue
                    .where('table')
                    .equals(tableName)
                    .and(item =>
                        item.businessId === businessId &&
                        !item.synced &&
                        (!userId || item.userId === userId)
                    )
                    .sortBy('timestamp');

                for (const operation of pendingOperations) {
                    try {
                        const endpoint = this.SYNC_ENDPOINTS[tableName as keyof typeof this.SYNC_ENDPOINTS];
                        let response: Response;

                        switch (operation.operation) {
                            case 'insert':
                                response = await fetch(endpoint, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        ...operation.data,
                                        businessId: operation.businessId
                                    }),
                                });
                                break;

                            case 'update':
                                response = await fetch(`${endpoint}/${operation.data.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        ...operation.data,
                                        businessId: operation.businessId
                                    }),
                                });
                                break;

                            case 'delete':
                                response = await fetch(`${endpoint}/${operation.data.id}?businessId=${operation.businessId}`, {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                });
                                break;

                            default:
                                throw new Error(`Unknown operation: ${operation.operation}`);
                        }

                        if (response.ok) {
                            // Mark operation as synced
                            await db.syncQueue.update(operation.id, { synced: true });
                            result.synced++;

                            // For insert/update operations, update local data with server response
                            if (operation.operation !== 'delete') {
                                const serverData = await response.json();
                                await this.updateLocalTable(tableName, serverData);
                            }

                        } else {
                            // Increment retry count
                            await db.syncQueue.update(operation.id, {
                                retryCount: operation.retryCount + 1
                            });

                            const errorMsg = `Failed to sync ${operation.operation} for ${tableName}: ${response.status}`;
                            result.errors.push(errorMsg);
                        }

                    } catch (error) {
                        // Increment retry count
                        await db.syncQueue.update(operation.id, {
                            retryCount: operation.retryCount + 1
                        });

                        const errorMsg = `Error syncing ${operation.operation} for ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        result.errors.push(errorMsg);
                    }
                }
            }

            result.success = result.errors.length === 0;
            return result;

        } catch (error) {
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Sync to server failed');
            return result;
        }
    }

    /**
     * Pull server changes to local storage for a specific table
     * @param businessId - Business to sync data for
     * @param table - Specific table to sync
     */
    static async syncFromServer(businessId: string, table: TaskTable): Promise<SyncResult> {
        const result: SyncResult = { success: true, synced: 0, errors: [] };

        try {
            const endpoint = this.SYNC_ENDPOINTS[table as keyof typeof this.SYNC_ENDPOINTS];
            const response = await fetch(`${endpoint}/business/${businessId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverData = await response.json();

                if (serverData && Array.isArray(serverData)) {
                    // Update local cache
                    await this.updateLocalTable(table, serverData);
                    result.synced = serverData.length;

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `${table}_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: table
                    });
                }
            } else {
                result.errors.push(`Failed to fetch ${table} from server: ${response.status}`);
            }

            result.success = result.errors.length === 0;
            return result;

        } catch (error) {
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : `Failed to sync ${table} from server`);
            return result;
        }
    }

    /**
     * Update local table with server data
     * @param tableName - Name of the table to update
     * @param data - Data to update (single item or array)
     */
    private static async updateLocalTable(tableName: string, data: any): Promise<void> {
        switch (tableName) {
            case 'tasks':
                if (Array.isArray(data)) {
                    await db.tasks.bulkPut(data);
                } else {
                    await db.tasks.put(data);
                }
                break;
            case 'subtasks':
                if (Array.isArray(data)) {
                    await db.subtasks.bulkPut(data);
                } else {
                    await db.subtasks.put(data);
                }
                break;
            case 'task_notes':
                if (Array.isArray(data)) {
                    await db.taskNotes.bulkPut(data);
                } else {
                    await db.taskNotes.put(data);
                }
                break;
            case 'task_dependencies':
                if (Array.isArray(data)) {
                    await db.taskDependencies.bulkPut(data);
                } else {
                    await db.taskDependencies.put(data);
                }
                break;
            default:
                throw new Error(`Unknown table: ${tableName}`);
        }
    }

    /**
     * Get sync status for task-related entities
     * @param businessId - Business to check sync status for
     */
    static async getSyncStatus(businessId: string): Promise<Record<string, SyncStatus>> {
        const status: Record<string, SyncStatus> = {};

        for (const table of this.TABLES) {
            // Get last sync time
            const metadata = await db.syncMetadata.get(`${table}_${businessId}`);

            // Get pending operations count
            const pendingCount = await db.syncQueue
                .where('table')
                .equals(table)
                .and(item => item.businessId === businessId && !item.synced)
                .count();

            status[table] = {
                lastSync: metadata?.lastSync || null,
                pendingOperations: pendingCount,
                pendingConflicts: this.conflictService.getPendingConflicts(table).length,
                lastError: undefined, // TODO: Track last error in metadata
                isOptimized: this.performanceService.getMetrics().cacheHitRate > 0.3,
                networkQuality: this.statusManager.getConnectionQuality().quality
            };
        }

        return status;
    }

    /**
     * Force sync for specific task and all its related entities
     * @param businessId - Business ID
     * @param taskId - Task ID to sync
     * @param userId - User performing sync (auth_id)
     */
    static async syncTaskAndRelated(businessId: string, taskId: string, userId?: string): Promise<SyncResult> {
        const result: SyncResult = { success: true, synced: 0, errors: [] };

        try {
            // Sync task
            const taskResult = await this.syncSpecificTask(businessId, taskId);
            result.synced += taskResult.synced;
            result.errors.push(...taskResult.errors);

            // Sync subtasks
            const subtaskResult = await this.syncTaskSubtasks(businessId, taskId);
            result.synced += subtaskResult.synced;
            result.errors.push(...subtaskResult.errors);

            // Sync task notes
            const notesResult = await this.syncTaskNotes(businessId, taskId);
            result.synced += notesResult.synced;
            result.errors.push(...notesResult.errors);

            // Sync task dependencies
            const depsResult = await this.syncTaskDependencies(businessId, taskId);
            result.synced += depsResult.synced;
            result.errors.push(...depsResult.errors);

            result.success = result.errors.length === 0;
            return result;

        } catch (error) {
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Task sync failed');
            return result;
        }
    }

    /**
     * Sync specific task
     */
    private static async syncSpecificTask(businessId: string, taskId: string): Promise<SyncResult> {
        const result: SyncResult = { success: true, synced: 0, errors: [] };

        try {
            const response = await fetch(`/api/tasks/${taskId}?businessId=${businessId}`);
            if (response.ok) {
                const task = await response.json();
                await db.tasks.put(task);
                result.synced = 1;
            }
        } catch (error) {
            result.errors.push(`Failed to sync task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Sync subtasks for a specific task
     */
    private static async syncTaskSubtasks(businessId: string, taskId: string): Promise<SyncResult> {
        const result: SyncResult = { success: true, synced: 0, errors: [] };

        try {
            const response = await fetch(`/api/subtasks/task/${taskId}?businessId=${businessId}`);
            if (response.ok) {
                const subtasks = await response.json();
                await db.subtasks.bulkPut(subtasks);
                result.synced = subtasks.length;
            }
        } catch (error) {
            result.errors.push(`Failed to sync subtasks for task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Sync task notes for a specific task
     */
    private static async syncTaskNotes(businessId: string, taskId: string): Promise<SyncResult> {
        const result: SyncResult = { success: true, synced: 0, errors: [] };

        try {
            const response = await fetch(`/api/task-notes/task/${taskId}?businessId=${businessId}`);
            if (response.ok) {
                const notes = await response.json();
                await db.taskNotes.bulkPut(notes);
                result.synced = notes.length;
            }
        } catch (error) {
            result.errors.push(`Failed to sync notes for task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Sync task dependencies for a specific task
     */
    private static async syncTaskDependencies(businessId: string, taskId: string): Promise<SyncResult> {
        const result: SyncResult = { success: true, synced: 0, errors: [] };

        try {
            const response = await fetch(`/api/task-dependencies/task/${taskId}?businessId=${businessId}`);
            if (response.ok) {
                const dependencies = await response.json();
                await db.taskDependencies.bulkPut(dependencies);
                result.synced = dependencies.length;
            }
        } catch (error) {
            result.errors.push(`Failed to sync dependencies for task ${taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Clean up old sync operations and metadata
     * @param olderThanDays - Remove operations older than this many days
     */
    static async cleanupOldSyncData(olderThanDays: number = 7): Promise<void> {
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

        // Remove old synced operations
        await db.syncQueue
            .where('timestamp')
            .below(cutoffTime)
            .and(item => item.synced && this.TABLES.includes(item.table as any))
            .delete();

        console.log(`Cleaned up sync data older than ${olderThanDays} days`);
    }

    /**
     * Get detailed sync statistics
     * @param businessId - Business to get stats for
     */
    static async getSyncStats(businessId: string): Promise<{
        totalPending: number;
        byTable: Record<string, { pending: number; lastSync: number | null }>;
        oldestPending: number | null;
    }> {
        const stats = {
            totalPending: 0,
            byTable: {} as Record<string, { pending: number; lastSync: number | null }>,
            oldestPending: null as number | null
        };

        for (const table of this.TABLES) {
            const pendingOps = await db.syncQueue
                .where('table')
                .equals(table)
                .and(item => item.businessId === businessId && !item.synced)
                .toArray();

            const metadata = await db.syncMetadata.get(`${table}_${businessId}`);

            stats.byTable[table] = {
                pending: pendingOps.length,
                lastSync: metadata?.lastSync || null
            };

            stats.totalPending += pendingOps.length;

            if (pendingOps.length > 0) {
                const oldestOp = Math.min(...pendingOps.map(op => op.timestamp));
                if (!stats.oldestPending || oldestOp < stats.oldestPending) {
                    stats.oldestPending = oldestOp;
                }
            }
        }

        return stats;
    }

    /**
     * Update sync metadata for a business
     * @param businessId - Business ID
     * @param lastSync - Last sync timestamp
     */
    private static async updateSyncMetadata(businessId: string, lastSync: number): Promise<void> {
        try {
            await db.syncMetadata.put({
                id: `tasks_${businessId}`,
                lastSync,
                businessId,
                table: 'tasks'
            });
        } catch (error) {
            console.error('Failed to update sync metadata:', error);
        }
    }

    /**
     * Get pending changes for a specific table and business
     * @param table - Table name
     * @param businessId - Business ID
     */
    private static async getPendingChanges(table: TaskTable, businessId: string): Promise<any[]> {
        return db.syncQueue
            .where('table')
            .equals(table)
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();
    }

    /**
     * Fetch server changes for a specific table and business
     * @param table - Table name
     * @param businessId - Business ID
     */
    private static async fetchServerChanges(table: TaskTable, businessId: string): Promise<any[]> {
        const endpoint = this.SYNC_ENDPOINTS[table as keyof typeof this.SYNC_ENDPOINTS];
        const response = await fetch(`${endpoint}/business/${businessId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`Failed to fetch ${table} from server: ${response.status}`);
        }
    }

    /**
     * Update local record with sync data
     */
    private static async updateLocalRecord(table: TaskTable, data: any): Promise<void> {
        await this.updateLocalTable(table, data);
    }

    /**
     * Process server changes with conflict detection
     */
    private static async processServerChanges(
        table: TaskTable,
        serverChanges: any[],
        businessId: string,
        options: any = {}
    ): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            synced: 0,
            errors: [],
            conflicts: 0,
            conflictsResolved: 0
        };

        for (const serverItem of serverChanges) {
            try {
                // Check if we have a local version
                const localItem = await this.getLocalItem(table, serverItem.id);

                if (localItem && options.useConflictResolution !== false) {
                    // Check for conflicts
                    const conflicts = detectConflicts(localItem, serverItem, table, serverItem.id);

                    if (conflicts.length > 0) {
                        const conflictResult = await this.handleConflictAdvanced(
                            table,
                            localItem,
                            { data: serverItem },
                            businessId,
                            options.userId
                        );

                        result.conflicts = (result.conflicts || 0) + 1;
                        result.conflictsResolved = (result.conflictsResolved || 0) + (conflictResult.resolved ? 1 : 0);

                        if (conflictResult.resolved) {
                            result.synced++;
                        }
                        continue;
                    }
                }

                // No conflicts or no local version - update directly
                await this.updateLocalRecord(table, serverItem);
                result.synced++;

            } catch (error) {
                result.errors.push(`Error processing server change: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return result;
    }

    /**
     * Get local item by ID
     */
    private static async getLocalItem(table: TaskTable, id: string): Promise<any | null> {
        try {
            switch (table) {
                case 'tasks':
                    return await db.tasks.get(id);
                case 'subtasks':
                    return await db.subtasks.get(id);
                case 'task_notes':
                    return await db.taskNotes.get(id);
                case 'task_dependencies':
                    return await db.taskDependencies.get(id);
                default:
                    return null;
            }
        } catch (error) {
            console.warn(`Failed to get local item from ${table}:`, error);
            return null;
        }
    }
}
