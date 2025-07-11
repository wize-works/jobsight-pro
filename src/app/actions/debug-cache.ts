"use server";

import { AIContextCache } from "@/lib/ai/cache";
import { fetchByBusiness } from "@/lib/db";

export async function debugCacheAndCrews(businessId: string) {
    try {
        console.log(`=== Debug Cache and Crews for business: ${businessId} ===`);

        // Clear cache first
        AIContextCache.invalidateBusinessCache(businessId);
        console.log('Cache cleared');

        // Test direct crew query
        const { data: crews, error: crewsError } = await fetchByBusiness("crews", businessId, "*", {
            orderBy: { column: "name", ascending: true }
        });

        console.log('Direct crews query results:', {
            crewsCount: crews?.length || 0,
            error: crewsError?.message || 'No error',
            crews: crews?.map(c => ({ id: c.id, name: c.name, status: c.status })) || []
        });

        return {
            success: true,
            message: `Cache cleared. Found ${crews?.length || 0} crews.`,
            crews: crews || [],
            error: crewsError?.message || null
        };
    } catch (error) {
        console.error('Debug cache and crews error:', error);
        return {
            success: false,
            message: 'Error debugging cache and crews',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
