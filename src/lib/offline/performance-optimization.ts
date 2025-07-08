import { db } from './dexie-db';

export interface QueryOptimizationConfig {
    enableIndexOptimization: boolean;
    enableQueryCaching: boolean;
    enableBatchOperations: boolean;
    maxCacheSize: number;
    cacheExpirationMs: number;
    batchSize: number;
    queryTimeoutMs: number;
}

export interface PerformanceMetrics {
    queryCount: number;
    cacheHitRate: number;
    averageQueryTime: number;
    slowQueries: QueryPerformanceData[];
    memoryUsage: number;
    indexUsage: Map<string, number>;
}

export interface QueryPerformanceData {
    query: string;
    duration: number;
    timestamp: Date;
    cacheHit: boolean;
    entityType: string;
    resultCount: number;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: Date;
    accessCount: number;
    lastAccessed: Date;
    ttl: number;
}

export interface BatchOperation {
    operation: 'create' | 'update' | 'delete';
    entityType: string;
    data: any;
    id?: string;
}

class PerformanceOptimizationService {
    private static instance: PerformanceOptimizationService;
    private config: QueryOptimizationConfig;
    private queryCache: Map<string, CacheEntry<any>> = new Map();
    private metrics: PerformanceMetrics;
    private batchQueue: Map<string, BatchOperation[]> = new Map();
    private batchTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private performanceObserver?: PerformanceObserver;

    private constructor() {
        this.config = this.getDefaultConfig();
        this.metrics = this.initializeMetrics();
        this.initializePerformanceMonitoring();
        this.startCacheCleanup();
    }

    public static getInstance(): PerformanceOptimizationService {
        if (!PerformanceOptimizationService.instance) {
            PerformanceOptimizationService.instance = new PerformanceOptimizationService();
        }
        return PerformanceOptimizationService.instance;
    }

    private getDefaultConfig(): QueryOptimizationConfig {
        return {
            enableIndexOptimization: true,
            enableQueryCaching: true,
            enableBatchOperations: true,
            maxCacheSize: 1000,
            cacheExpirationMs: 5 * 60 * 1000, // 5 minutes
            batchSize: 50,
            queryTimeoutMs: 10000 // 10 seconds
        };
    }

    private initializeMetrics(): PerformanceMetrics {
        return {
            queryCount: 0,
            cacheHitRate: 0,
            averageQueryTime: 0,
            slowQueries: [],
            memoryUsage: 0,
            indexUsage: new Map()
        };
    }

    private initializePerformanceMonitoring(): void {
        if (typeof PerformanceObserver !== 'undefined') {
            this.performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.name.includes('dexie') || entry.name.includes('idb')) {
                        this.recordQueryPerformance({
                            query: entry.name,
                            duration: entry.duration,
                            timestamp: new Date(),
                            cacheHit: false,
                            entityType: this.extractEntityType(entry.name),
                            resultCount: 0
                        });
                    }
                });
            });

            this.performanceObserver.observe({ entryTypes: ['measure'] });
        }
    }

    private extractEntityType(queryName: string): string {
        const match = queryName.match(/(\w+)(?:Query|Update|Delete|Create)/);
        return match ? match[1] : 'unknown';
    }

    public configure(config: Partial<QueryOptimizationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    // Optimized query methods
    public async optimizedQuery<T>(
        entityType: string,
        queryFn: () => Promise<T>,
        cacheKey?: string,
        ttl?: number
    ): Promise<T> {
        const startTime = performance.now();
        const finalCacheKey = cacheKey || `${entityType}_${JSON.stringify(queryFn.toString().slice(0, 100))}`;

        // Check cache first if enabled
        if (this.config.enableQueryCaching) {
            const cached = this.getCachedResult<T>(finalCacheKey);
            if (cached) {
                this.recordQueryPerformance({
                    query: finalCacheKey,
                    duration: performance.now() - startTime,
                    timestamp: new Date(),
                    cacheHit: true,
                    entityType,
                    resultCount: Array.isArray(cached) ? cached.length : 1
                });
                return cached;
            }
        }

        // Execute query with timeout
        const result = await this.executeWithTimeout(queryFn, this.config.queryTimeoutMs);

        // Cache result if enabled
        if (this.config.enableQueryCaching && result) {
            this.setCachedResult(finalCacheKey, result, ttl || this.config.cacheExpirationMs);
        }

        this.recordQueryPerformance({
            query: finalCacheKey,
            duration: performance.now() - startTime,
            timestamp: new Date(),
            cacheHit: false,
            entityType,
            resultCount: Array.isArray(result) ? result.length : 1
        });

        return result;
    }

    private async executeWithTimeout<T>(
        queryFn: () => Promise<T>,
        timeoutMs: number
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Query timeout after ${timeoutMs}ms`));
            }, timeoutMs);

            queryFn()
                .then(resolve)
                .catch(reject)
                .finally(() => clearTimeout(timer));
        });
    }

    // Batch operations
    public queueBatchOperation(operation: BatchOperation): void {
        if (!this.config.enableBatchOperations) {
            this.executeSingleOperation(operation);
            return;
        }

        const key = `${operation.entityType}_${operation.operation}`;

        if (!this.batchQueue.has(key)) {
            this.batchQueue.set(key, []);
        }

        this.batchQueue.get(key)!.push(operation);

        // Process batch when it reaches batch size
        if (this.batchQueue.get(key)!.length >= this.config.batchSize) {
            this.processBatch(key);
        } else {
            // Set timer to process batch after delay
            this.resetBatchTimer(key);
        }
    }

    private resetBatchTimer(key: string): void {
        const existingTimer = this.batchTimeouts.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            this.processBatch(key);
        }, 1000); // 1 second delay

        this.batchTimeouts.set(key, timer);
    }

    private async processBatch(key: string): Promise<void> {
        const operations = this.batchQueue.get(key);
        if (!operations || operations.length === 0) return;

        this.batchQueue.set(key, []);

        const timer = this.batchTimeouts.get(key);
        if (timer) {
            clearTimeout(timer);
            this.batchTimeouts.delete(key);
        }

        try {
            const [entityType, operation] = key.split('_');
            await this.executeBatchOperation(entityType, operation, operations);
        } catch (error) {
            console.error(`Batch operation failed for ${key}:`, error);

            // Fallback to individual operations
            for (const op of operations) {
                try {
                    await this.executeSingleOperation(op);
                } catch (singleError) {
                    console.error(`Single operation fallback failed:`, singleError);
                }
            }
        }
    }

    private async executeBatchOperation(
        entityType: string,
        operation: string,
        operations: BatchOperation[]
    ): Promise<void> {
        const table = db[entityType as keyof typeof db] as any;
        if (!table) {
            throw new Error(`Unknown entity type: ${entityType}`);
        }

        switch (operation) {
            case 'create':
                await table.bulkAdd(operations.map(op => op.data));
                break;
            case 'update':
                await table.bulkPut(operations.map(op => op.data));
                break;
            case 'delete':
                const ids = operations.map(op => op.id).filter(Boolean);
                await table.bulkDelete(ids);
                break;
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    }

    private async executeSingleOperation(operation: BatchOperation): Promise<void> {
        const table = db[operation.entityType as keyof typeof db] as any;
        if (!table) {
            throw new Error(`Unknown entity type: ${operation.entityType}`);
        }

        switch (operation.operation) {
            case 'create':
                await table.add(operation.data);
                break;
            case 'update':
                await table.put(operation.data);
                break;
            case 'delete':
                if (operation.id) {
                    await table.delete(operation.id);
                }
                break;
        }
    }

    // Cache management
    private getCachedResult<T>(key: string): T | null {
        const entry = this.queryCache.get(key);
        if (!entry) return null;

        // Check if expired
        if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
            this.queryCache.delete(key);
            return null;
        }

        // Update access info
        entry.accessCount++;
        entry.lastAccessed = new Date();

        return entry.data;
    }

    private setCachedResult<T>(key: string, data: T, ttl: number): void {
        // Check cache size limit
        if (this.queryCache.size >= this.config.maxCacheSize) {
            this.evictLeastUsedCacheEntries();
        }

        this.queryCache.set(key, {
            data,
            timestamp: new Date(),
            accessCount: 1,
            lastAccessed: new Date(),
            ttl
        });
    }

    private evictLeastUsedCacheEntries(): void {
        const entries = Array.from(this.queryCache.entries());

        // Sort by access count and last accessed time
        entries.sort((a, b) => {
            const aScore = a[1].accessCount + (Date.now() - a[1].lastAccessed.getTime()) / 1000;
            const bScore = b[1].accessCount + (Date.now() - b[1].lastAccessed.getTime()) / 1000;
            return aScore - bScore;
        });

        // Remove bottom 25%
        const toRemove = Math.floor(entries.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
            this.queryCache.delete(entries[i][0]);
        }
    }

    private startCacheCleanup(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.queryCache.entries()) {
                if (now - entry.timestamp.getTime() > entry.ttl) {
                    this.queryCache.delete(key);
                }
            }
        }, 60000); // Clean up every minute
    }

    // Performance monitoring
    private recordQueryPerformance(data: QueryPerformanceData): void {
        this.metrics.queryCount++;

        // Update average query time
        const totalTime = this.metrics.averageQueryTime * (this.metrics.queryCount - 1) + data.duration;
        this.metrics.averageQueryTime = totalTime / this.metrics.queryCount;

        // Track cache hit rate
        const cacheHits = Array.from(this.queryCache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
        this.metrics.cacheHitRate = this.metrics.queryCount > 0 ? cacheHits / this.metrics.queryCount : 0;

        // Track slow queries
        if (data.duration > 1000) { // Queries slower than 1 second
            this.metrics.slowQueries.push(data);

            // Keep only last 100 slow queries
            if (this.metrics.slowQueries.length > 100) {
                this.metrics.slowQueries = this.metrics.slowQueries.slice(-100);
            }
        }

        // Update index usage
        if (data.entityType !== 'unknown') {
            const currentUsage = this.metrics.indexUsage.get(data.entityType) || 0;
            this.metrics.indexUsage.set(data.entityType, currentUsage + 1);
        }
    }

    // Index optimization
    public async optimizeIndexes(): Promise<void> {
        if (!this.config.enableIndexOptimization) return;

        try {
            // Analyze query patterns to suggest index optimizations
            const indexSuggestions = this.analyzeIndexUsage();

            for (const suggestion of indexSuggestions) {
                console.log(`Index optimization suggestion: ${suggestion}`);
            }

            // Clear unused indexes (this would need to be implemented based on your schema)
            // await this.clearUnusedIndexes();

        } catch (error) {
            console.error('Index optimization failed:', error);
        }
    }

    private analyzeIndexUsage(): string[] {
        const suggestions: string[] = [];
        const usageThreshold = this.metrics.queryCount * 0.1; // 10% of queries

        for (const [entityType, usage] of this.metrics.indexUsage.entries()) {
            if (usage > usageThreshold) {
                suggestions.push(`Consider adding compound index for ${entityType} entity`);
            }
        }

        // Analyze slow queries for missing indexes
        const slowQueryPatterns = new Map<string, number>();
        this.metrics.slowQueries.forEach(query => {
            const pattern = this.extractQueryPattern(query.query);
            slowQueryPatterns.set(pattern, (slowQueryPatterns.get(pattern) || 0) + 1);
        });

        for (const [pattern, count] of slowQueryPatterns.entries()) {
            if (count > 5) {
                suggestions.push(`Consider adding index for pattern: ${pattern}`);
            }
        }

        return suggestions;
    }

    private extractQueryPattern(query: string): string {
        // Simple pattern extraction - could be enhanced
        if (query.includes('where')) {
            return query.split('where')[1]?.split(' ')[0] || 'unknown';
        }
        return 'sequential-scan';
    }

    // Memory management
    public async optimizeMemoryUsage(): Promise<void> {
        // Clear expired cache entries
        this.evictLeastUsedCacheEntries();

        // Process pending batches
        for (const key of this.batchQueue.keys()) {
            if (this.batchQueue.get(key)!.length > 0) {
                await this.processBatch(key);
            }
        }

        // Update memory usage metric
        if ('memory' in performance) {
            this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }
    }

    // Public API
    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    public clearCache(): void {
        this.queryCache.clear();
    }

    public async flushBatches(): Promise<void> {
        const pendingBatches = Array.from(this.batchQueue.keys());
        await Promise.all(pendingBatches.map(key => this.processBatch(key)));
    }

    public getSlowQueries(limit = 10): QueryPerformanceData[] {
        return this.metrics.slowQueries
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }

    public getCacheStats(): {
        size: number;
        hitRate: number;
        memoryUsage: number;
    } {
        return {
            size: this.queryCache.size,
            hitRate: this.metrics.cacheHitRate,
            memoryUsage: Array.from(this.queryCache.values())
                .reduce((total, entry) => total + JSON.stringify(entry.data).length, 0)
        };
    }

    public destroy(): void {
        this.queryCache.clear();
        this.batchTimeouts.forEach(timer => clearTimeout(timer));
        this.batchTimeouts.clear();
        this.batchQueue.clear();

        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
    }
}

export { PerformanceOptimizationService };
