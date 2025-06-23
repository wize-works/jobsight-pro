import { NextRequest, NextResponse } from 'next/server';
import { AIContextCache, CacheMetrics } from '@/lib/ai/cache';

export async function GET(request: NextRequest) {
    try {
        // Get cache statistics
        const cacheStats = AIContextCache.getCacheStats();
        const metrics = CacheMetrics.getMetrics();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            cache: {
                statistics: cacheStats,
                metrics: metrics,
                performance: {
                    hitRatio: `${metrics.hitRatio}%`,
                    totalRequests: metrics.total,
                    cacheHits: metrics.hits,
                    cacheMisses: metrics.misses,
                    uptimeHours: Math.round(metrics.uptimeMs / (1000 * 60 * 60) * 100) / 100,
                },
                memoryUsage: {
                    aiContext: {
                        current: cacheStats.memory.aiContext.size,
                        maximum: cacheStats.memory.aiContext.maxSize,
                        utilization: `${Math.round((cacheStats.memory.aiContext.size / cacheStats.memory.aiContext.maxSize) * 100)}%`
                    },
                    conversationContext: {
                        current: cacheStats.memory.conversationContext.size,
                        maximum: cacheStats.memory.conversationContext.maxSize,
                        utilization: `${Math.round((cacheStats.memory.conversationContext.size / cacheStats.memory.conversationContext.maxSize) * 100)}%`
                    },
                    quickStats: {
                        current: cacheStats.memory.quickStats.size,
                        maximum: cacheStats.memory.quickStats.maxSize,
                        utilization: `${Math.round((cacheStats.memory.quickStats.size / cacheStats.memory.quickStats.maxSize) * 100)}%`
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching cache status:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch cache status',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Clear all caches (for development/debugging)
        AIContextCache.clearAllCaches();
        CacheMetrics.reset();

        return NextResponse.json({
            success: true,
            message: 'All caches cleared and metrics reset',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error clearing caches:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to clear caches',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
