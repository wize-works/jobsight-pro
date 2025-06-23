// AI Context Caching System for JobSight Pro
// This file implements multi-level caching strategies for AI context data

// Simple LRU Cache implementation
class SimpleLRUCache<K, V> {
    private cache = new Map<K, { value: V; timestamp: number }>();
    private maxSize: number;
    private ttlMs: number;

    constructor(maxSize: number, ttlMs: number) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    get(key: K): V | undefined {
        const item = this.cache.get(key);
        if (!item) return undefined;

        // Check if expired
        if (Date.now() - item.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return undefined;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }

    set(key: K, value: V): void {
        // Remove if exists
        this.cache.delete(key);        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, { value, timestamp: Date.now() });
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }

    get max(): number {
        return this.maxSize;
    }

    entries(): IterableIterator<[K, { value: V; timestamp: number }]> {
        return this.cache.entries();
    }
}

// Cache configuration constants
const CACHE_CONFIG = {
    TTL: {
        AI_CONTEXT: 300, // 5 minutes for AI context data
        CONVERSATION_CONTEXT: 1800, // 30 minutes for conversation sessions
        QUICK_STATS: 60, // 1 minute for quick business statistics
    },

    MEMORY_CACHE_SIZE: {
        AI_CONTEXT: 50, // Number of businesses to cache
        CONVERSATION_SESSIONS: 100, // Number of active conversation contexts
        QUICK_STATS: 200, // Number of business stat snapshots
    },

    KEYS: {
        AI_CONTEXT: (businessId: string) => `ai:context:${businessId}`,
        PROJECT_SUMMARY: (businessId: string, projectId: string) => `ai:project:${businessId}:${projectId}`,
        BUSINESS_ANALYTICS: (businessId: string) => `ai:analytics:${businessId}`,
        CONVERSATION_CONTEXT: (businessId: string, userId: string) => `ai:conversation:${businessId}:${userId}`,
        INVALIDATION_TRACKER: (businessId: string) => `ai:invalidation:${businessId}`,
    },
} as const;

// AI Context Cache Interface
export interface CachedAIContext {
    data: any;
    timestamp: number;
    version: string;
    dataHash: string;
}

export interface CacheInvalidationEvent {
    businessId: string;
    entityType: 'projects' | 'daily_logs' | 'tasks' | 'crews' | 'equipment' | 'clients';
    entityId?: string;
    action: 'create' | 'update' | 'delete';
    timestamp: number;
}

// Memory cache instances using simple LRU cache
const memoryCache = {
    aiContext: new SimpleLRUCache<string, CachedAIContext>(
        CACHE_CONFIG.MEMORY_CACHE_SIZE.AI_CONTEXT,
        CACHE_CONFIG.TTL.AI_CONTEXT * 1000
    ),

    conversationContext: new SimpleLRUCache<string, any>(
        CACHE_CONFIG.MEMORY_CACHE_SIZE.CONVERSATION_SESSIONS,
        CACHE_CONFIG.TTL.CONVERSATION_CONTEXT * 1000
    ),

    quickStats: new SimpleLRUCache<string, any>(
        CACHE_CONFIG.MEMORY_CACHE_SIZE.QUICK_STATS,
        CACHE_CONFIG.TTL.QUICK_STATS * 1000
    ),
};

// Utility function to generate data hash for change detection
function generateDataHash(data: any): string {
    const stringify = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < stringify.length; i++) {
        const char = stringify.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
}

// Core caching functions
export class AIContextCache {

    /**
     * Get cached AI context data
     */
    static getAIContext(businessId: string): CachedAIContext | null {
        const cacheKey = CACHE_CONFIG.KEYS.AI_CONTEXT(businessId);

        // Try memory cache
        const memoryResult = memoryCache.aiContext.get(cacheKey);
        if (memoryResult && this.isValidCache(memoryResult)) {
            return memoryResult;
        }

        return null;
    }

    /**
     * Set cached AI context data
     */
    static setAIContext(businessId: string, data: any): void {
        const cacheKey = CACHE_CONFIG.KEYS.AI_CONTEXT(businessId);
        const cachedData: CachedAIContext = {
            data,
            timestamp: Date.now(),
            version: '1.0',
            dataHash: generateDataHash(data),
        };

        // Set in memory cache
        memoryCache.aiContext.set(cacheKey, cachedData);
    }

    /**
     * Get conversation context for AI sessions
     */
    static getConversationContext(businessId: string, userId: string): any | null {
        const cacheKey = CACHE_CONFIG.KEYS.CONVERSATION_CONTEXT(businessId, userId);
        return memoryCache.conversationContext.get(cacheKey) || null;
    }

    /**
     * Set conversation context for AI sessions
     */
    static setConversationContext(businessId: string, userId: string, context: any): void {
        const cacheKey = CACHE_CONFIG.KEYS.CONVERSATION_CONTEXT(businessId, userId);
        memoryCache.conversationContext.set(cacheKey, {
            ...context,
            lastUpdated: Date.now(),
        });
    }

    /**
     * Get quick stats (lightweight business metrics)
     */
    static getQuickStats(businessId: string): any | null {
        const cacheKey = CACHE_CONFIG.KEYS.BUSINESS_ANALYTICS(businessId);
        return memoryCache.quickStats.get(cacheKey) || null;
    }

    /**
     * Set quick stats
     */
    static setQuickStats(businessId: string, stats: any): void {
        const cacheKey = CACHE_CONFIG.KEYS.BUSINESS_ANALYTICS(businessId);
        memoryCache.quickStats.set(cacheKey, {
            ...stats,
            generatedAt: Date.now(),
        });
    }

    /**
     * Invalidate all caches for a business
     */
    static invalidateBusinessCache(businessId: string): void {
        const patterns = [
            CACHE_CONFIG.KEYS.AI_CONTEXT(businessId),
            CACHE_CONFIG.KEYS.BUSINESS_ANALYTICS(businessId),
        ];

        // Clear memory cache
        patterns.forEach(pattern => {
            memoryCache.aiContext.delete(pattern);
            memoryCache.quickStats.delete(pattern);
        });

        // Clear conversation contexts for this business
        for (const [key] of memoryCache.conversationContext.entries()) {
            if (key.includes(businessId)) {
                memoryCache.conversationContext.delete(key);
            }
        }
    }

    /**
     * Smart invalidation based on entity changes
     */
    static invalidateByEntity(
        businessId: string,
        entityType: CacheInvalidationEvent['entityType'],
        action: CacheInvalidationEvent['action']
    ): void {
        // Always invalidate AI context for any data change
        this.invalidateBusinessCache(businessId);

        console.log(`AI Cache: Invalidated cache for business ${businessId} due to ${action} on ${entityType}`);
    }

    /**
     * Check if cached data is still valid
     */
    private static isValidCache(cachedData: CachedAIContext): boolean {
        const now = Date.now();
        const age = now - cachedData.timestamp;
        const maxAge = CACHE_CONFIG.TTL.AI_CONTEXT * 1000; // Convert to milliseconds

        return age < maxAge;
    }

    /**
     * Get cache statistics
     */
    static getCacheStats() {
        return {
            memory: {
                aiContext: {
                    size: memoryCache.aiContext.size,
                    maxSize: memoryCache.aiContext.max,
                },
                conversationContext: {
                    size: memoryCache.conversationContext.size,
                    maxSize: memoryCache.conversationContext.max,
                },
                quickStats: {
                    size: memoryCache.quickStats.size,
                    maxSize: memoryCache.quickStats.max,
                },
            },
            config: CACHE_CONFIG,
        };
    }

    /**
     * Clear all caches (for maintenance)
     */
    static clearAllCaches(): void {
        memoryCache.aiContext.clear();
        memoryCache.conversationContext.clear();
        memoryCache.quickStats.clear();
    }

    /**
     * Warm up cache with frequently accessed data
     */
    static async warmupCache(businessId: string, aiContextData: any): Promise<void> {
        // Cache AI context data
        this.setAIContext(businessId, aiContextData);

        // Generate and cache quick stats
        const quickStats = {
            totalProjects: aiContextData.projects?.length || 0,
            activeProjects: aiContextData.projects?.filter((p: any) => p.status === 'active').length || 0,
            totalDailyLogs: aiContextData.dailyLogs?.length || 0,
            totalTasks: aiContextData.tasks?.length || 0,
            urgentTasks: aiContextData.tasks?.filter((t: any) => t.priority === 'high' || t.priority === 'urgent').length || 0,
            totalCrews: aiContextData.crews?.length || 0,
            activeEquipment: aiContextData.equipment?.filter((e: any) => e.status === 'active').length || 0,
        };

        this.setQuickStats(businessId, quickStats);
    }
}

// Performance monitoring for cache effectiveness
export class CacheMetrics {
    private static hitCount = 0;
    private static missCount = 0;
    private static startTime = Date.now();

    static recordHit(): void {
        this.hitCount++;
    }

    static recordMiss(): void {
        this.missCount++;
    }

    static getMetrics() {
        const total = this.hitCount + this.missCount;
        const hitRatio = total > 0 ? (this.hitCount / total) * 100 : 0;
        const uptime = Date.now() - this.startTime;

        return {
            hits: this.hitCount,
            misses: this.missCount,
            total,
            hitRatio: Math.round(hitRatio * 100) / 100,
            uptimeMs: uptime,
            cacheStats: AIContextCache.getCacheStats(),
        };
    }

    static reset(): void {
        this.hitCount = 0;
        this.missCount = 0;
        this.startTime = Date.now();
    }
}

// Utility hooks for easy cache invalidation
export const useAICacheInvalidation = {
    onProjectChange: (businessId: string, action: 'create' | 'update' | 'delete') => {
        AIContextCache.invalidateByEntity(businessId, 'projects', action);
    },

    onDailyLogChange: (businessId: string, action: 'create' | 'update' | 'delete') => {
        AIContextCache.invalidateByEntity(businessId, 'daily_logs', action);
    },

    onTaskChange: (businessId: string, action: 'create' | 'update' | 'delete') => {
        AIContextCache.invalidateByEntity(businessId, 'tasks', action);
    },

    onCrewChange: (businessId: string, action: 'create' | 'update' | 'delete') => {
        AIContextCache.invalidateByEntity(businessId, 'crews', action);
    },

    onEquipmentChange: (businessId: string, action: 'create' | 'update' | 'delete') => {
        AIContextCache.invalidateByEntity(businessId, 'equipment', action);
    },

    onClientChange: (businessId: string, action: 'create' | 'update' | 'delete') => {
        AIContextCache.invalidateByEntity(businessId, 'clients', action);
    },

    // Convenience method for full invalidation
    invalidateAll: (businessId: string) => {
        AIContextCache.invalidateBusinessCache(businessId);
    }
};
