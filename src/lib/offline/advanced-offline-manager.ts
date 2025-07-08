import { ConflictResolutionService, UserPreferences } from './conflict-resolution';
import { BulkSyncService, EntitySyncAdapter, SyncResult } from './bulk-sync';
import { SyncOrchestrator, SyncStrategy } from './sync-orchestrator';
import { OfflineStatusManager } from './status-manager';
import { PerformanceOptimizationService } from './performance-optimization';

export interface AdvancedOfflineConfig {
    userPreferences?: UserPreferences;
    syncStrategies?: SyncStrategy[];
    performanceConfig?: any;
    autoStart?: boolean;
    enableConflictResolution?: boolean;
    enableBulkSync?: boolean;
    enableOrchestration?: boolean;
    enableStatusMonitoring?: boolean;
    enablePerformanceOptimization?: boolean;
}

export interface OfflineSystemStatus {
    isInitialized: boolean;
    servicesRunning: {
        conflictResolution: boolean;
        bulkSync: boolean;
        orchestrator: boolean;
        statusManager: boolean;
        performance: boolean;
    };
    systemHealth: {
        overall: 'healthy' | 'warning' | 'critical';
        issues: string[];
        recommendations: string[];
    };
}

class AdvancedOfflineManager {
    private static instance: AdvancedOfflineManager;
    private isInitialized = false;
    private config: AdvancedOfflineConfig = {};

    // Service instances
    private conflictService: ConflictResolutionService;
    private bulkSyncService: BulkSyncService;
    private orchestrator: SyncOrchestrator;
    private statusManager: OfflineStatusManager;
    private performanceService: PerformanceOptimizationService;

    private constructor() {
        this.conflictService = ConflictResolutionService.getInstance();
        this.bulkSyncService = BulkSyncService.getInstance();
        this.orchestrator = SyncOrchestrator.getInstance();
        this.statusManager = OfflineStatusManager.getInstance();
        this.performanceService = PerformanceOptimizationService.getInstance();
    }

    public static getInstance(): AdvancedOfflineManager {
        if (!AdvancedOfflineManager.instance) {
            AdvancedOfflineManager.instance = new AdvancedOfflineManager();
        }
        return AdvancedOfflineManager.instance;
    }

    public async initialize(config: AdvancedOfflineConfig = {}): Promise<void> {
        if (this.isInitialized) {
            console.warn('AdvancedOfflineManager already initialized');
            return;
        }

        this.config = {
            autoStart: true,
            enableConflictResolution: true,
            enableBulkSync: true,
            enableOrchestration: true,
            enableStatusMonitoring: true,
            enablePerformanceOptimization: true,
            ...config
        };

        try {
            await this.initializeServices();
            this.setupServiceIntegration();

            if (this.config.autoStart) {
                await this.start();
            }

            this.isInitialized = true;
            console.log('AdvancedOfflineManager initialized successfully');

        } catch (error) {
            console.error('Failed to initialize AdvancedOfflineManager:', error);
            throw error;
        }
    }

    private async initializeServices(): Promise<void> {
        // Configure conflict resolution
        if (this.config.enableConflictResolution && this.config.userPreferences) {
            this.conflictService.setUserPreferences(
                this.config.userPreferences.userId,
                this.config.userPreferences
            );
        }

        // Configure orchestrator
        if (this.config.enableOrchestration && this.config.syncStrategies) {
            this.orchestrator.configure({
                strategies: this.config.syncStrategies
            });
        }

        // Configure performance optimization
        if (this.config.enablePerformanceOptimization && this.config.performanceConfig) {
            this.performanceService.configure(this.config.performanceConfig);
        }

        // Register default sync adapters
        await this.registerDefaultSyncAdapters();
    }

    private async registerDefaultSyncAdapters(): Promise<void> {
        const entityTypes = [
            'business', 'clients', 'crews', 'equipment',
            'tasks', 'daily_logs', 'media', 'documents', 'invoices'
        ];

        for (const entityType of entityTypes) {
            const adapter = await this.createSyncAdapter(entityType);
            this.bulkSyncService.registerAdapter(adapter);
        }
    }

    private async createSyncAdapter(entityType: string): Promise<EntitySyncAdapter> {
        const manager = this; // Capture reference for use in adapter methods

        return {
            entityType,

            async getPendingChanges() {
                // Implementation would depend on your Dexie schema
                // This is a placeholder that would integrate with your offline tables
                try {
                    const { db } = await import('./dexie-db');
                    const table = db[entityType as keyof typeof db] as any;

                    if (table) {
                        return await table
                            .where('_needsSync')
                            .equals(1)
                            .toArray();
                    }
                    return [];
                } catch (error) {
                    console.warn(`Failed to get pending changes for ${entityType}:`, error);
                    return [];
                }
            },

            async syncToServer(items) {
                // Implementation would call your API endpoints
                // This is a placeholder for the actual sync logic
                const success: any[] = [];
                const failed: { item: any, error: Error }[] = [];

                for (const item of items) {
                    try {
                        // Simulate API call
                        const response = await fetch(`/api/${entityType}/${item.id || ''}`, {
                            method: item.id ? 'PUT' : 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item)
                        });

                        if (response.ok) {
                            const result = await response.json();
                            success.push(result);
                        } else {
                            throw new Error(`API error: ${response.status}`);
                        }
                    } catch (error) {
                        failed.push({ item, error: error as Error });
                    }
                }

                return { success, failed };
            },

            async handleConflicts(conflicts) {
                // Use the conflict resolution service
                const resolved: any[] = [];

                for (const conflict of conflicts) {
                    try {
                        const resolutions = await manager.conflictService.resolveConflicts(
                            [conflict],
                            manager.config.userPreferences?.userId
                        );

                        if (resolutions.size > 0) {
                            const mergedData = manager.conflictService.mergeData(
                                conflict.localVersion,
                                conflict.serverVersion,
                                resolutions
                            );
                            resolved.push(mergedData);
                        }
                    } catch (error) {
                        console.warn(`Failed to resolve conflict for ${entityType}:`, error);
                        resolved.push(conflict.serverVersion); // Fallback to server version
                    }
                }

                return resolved;
            },

            async getLastSyncTimestamp() {
                try {
                    const syncMeta = localStorage.getItem(`${entityType}_lastSync`);
                    return syncMeta ? new Date(syncMeta) : null;
                } catch {
                    return null;
                }
            },

            async updateLastSyncTimestamp(timestamp) {
                try {
                    localStorage.setItem(`${entityType}_lastSync`, timestamp.toISOString());
                } catch (error) {
                    console.warn(`Failed to update sync timestamp for ${entityType}:`, error);
                }
            }
        };
    }

    private setupServiceIntegration(): void {
        // Status manager integration
        if (this.config.enableStatusMonitoring) {
            this.statusManager.on('status-change', (status) => {
                // Update orchestrator based on status
                if (!status.isOnline) {
                    this.orchestrator.stop();
                } else if (this.orchestrator.getStatus().isRunning === false) {
                    this.orchestrator.start();
                }
            });
        }

        // Orchestrator integration with status updates
        if (this.config.enableOrchestration) {
            this.orchestrator.on('sync-progress', (data) => {
                this.statusManager.updateSyncProgress(
                    data.progress.percentage,
                    data.progress.currentEntity,
                    data.progress.estimatedTimeRemaining ?
                        new Date(Date.now() + data.progress.estimatedTimeRemaining) : undefined
                );
            });

            this.orchestrator.on('strategy-failed', (data) => {
                this.statusManager.reportSyncError(data.error);
            });

            this.orchestrator.on('strategy-completed', (data) => {
                if (data.result.success) {
                    this.statusManager.reportSyncSuccess();
                }
            });
        }

        // Performance optimization integration
        if (this.config.enablePerformanceOptimization) {
            // Optimize during idle periods
            setInterval(async () => {
                if (this.statusManager.getStatus().syncStatus === 'idle') {
                    await this.performanceService.optimizeMemoryUsage();
                }
            }, 5 * 60 * 1000); // Every 5 minutes

            // Optimize indexes periodically
            setInterval(async () => {
                await this.performanceService.optimizeIndexes();
            }, 60 * 60 * 1000); // Every hour
        }
    }

    public async start(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('AdvancedOfflineManager not initialized');
        }

        if (this.config.enableOrchestration) {
            this.orchestrator.start();
        }

        console.log('AdvancedOfflineManager started');
    }

    public async stop(): Promise<void> {
        if (this.config.enableOrchestration) {
            this.orchestrator.stop();
        }

        // Flush any pending operations
        if (this.config.enablePerformanceOptimization) {
            await this.performanceService.flushBatches();
        }

        console.log('AdvancedOfflineManager stopped');
    }

    // Public API methods
    public async triggerSync(entities?: string[]): Promise<SyncResult> {
        if (!this.isInitialized) {
            throw new Error('AdvancedOfflineManager not initialized');
        }

        return entities
            ? await this.bulkSyncService.syncSpecificEntities(entities)
            : await this.bulkSyncService.syncAll();
    }

    public async resolveConflict(
        entityType: string,
        entityId: string,
        field: string,
        resolution: any
    ): Promise<boolean> {
        return this.conflictService.resolvePendingConflict(
            entityType,
            entityId,
            field,
            resolution
        );
    }

    public getStatus(): OfflineSystemStatus {
        const conflictService = this.config.enableConflictResolution ?? false;
        const bulkSync = this.config.enableBulkSync ?? false;
        const orchestratorRunning = (this.config.enableOrchestration ?? false) &&
            this.orchestrator.getStatus().isRunning;
        const statusManager = this.config.enableStatusMonitoring ?? false;
        const performance = this.config.enablePerformanceOptimization ?? false;

        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check for issues
        if (this.config.enableStatusMonitoring) {
            const status = this.statusManager.getStatus();

            if (!status.isOnline) {
                issues.push('Device is offline');
                recommendations.push('Connect to internet for sync');
            }

            if (status.pendingConflicts > 0) {
                issues.push(`${status.pendingConflicts} unresolved conflicts`);
                recommendations.push('Review and resolve pending conflicts');
            }

            if (status.pendingChanges > 100) {
                issues.push('Large number of pending changes');
                recommendations.push('Trigger manual sync to reduce pending items');
            }
        }

        if (this.config.enablePerformanceOptimization) {
            const metrics = this.performanceService.getMetrics();

            if (metrics.averageQueryTime > 1000) {
                issues.push('Slow query performance detected');
                recommendations.push('Consider optimizing database indexes');
            }

            if (metrics.cacheHitRate < 0.3) {
                issues.push('Low cache hit rate');
                recommendations.push('Review query patterns and caching strategy');
            }
        }

        // Determine overall health
        let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (issues.length > 3) {
            overall = 'critical';
        } else if (issues.length > 0) {
            overall = 'warning';
        }

        return {
            isInitialized: this.isInitialized,
            servicesRunning: {
                conflictResolution: conflictService,
                bulkSync: bulkSync,
                orchestrator: orchestratorRunning,
                statusManager: statusManager,
                performance: performance
            },
            systemHealth: {
                overall,
                issues,
                recommendations
            }
        };
    }

    public getMetrics() {
        return {
            performance: this.config.enablePerformanceOptimization ?
                this.performanceService.getMetrics() : null,
            sync: this.config.enableOrchestration ?
                this.orchestrator.getStatus() : null,
            status: this.config.enableStatusMonitoring ?
                this.statusManager.getStatus() : null,
            conflicts: this.config.enableConflictResolution ?
                this.conflictService.getPendingConflicts().length : 0
        };
    }

    public async optimizePerformance(): Promise<void> {
        if (this.config.enablePerformanceOptimization) {
            await this.performanceService.optimizeMemoryUsage();
            await this.performanceService.optimizeIndexes();
        }
    }

    public destroy(): void {
        this.stop();

        if (this.config.enableStatusMonitoring) {
            this.statusManager.destroy();
        }

        if (this.config.enablePerformanceOptimization) {
            this.performanceService.destroy();
        }

        this.isInitialized = false;
    }
}

export { AdvancedOfflineManager };
