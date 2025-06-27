/**
 * Client-Side AI Logs Actions
 * 
 * Replaces src/app/actions/ai-logs.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from '@/types/supabase';
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from './client-action-factory';
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for AI logs
type AILog = Database['public']['Tables']['ai_logs']['Row'];
type AILogInsert = Database['public']['Tables']['ai_logs']['Insert'];
type AILogUpdate = Database['public']['Tables']['ai_logs']['Update'];

// Create client-side AI log actions
const insertAILog = createInsertAction('ai_logs', 'low');
const updateAILog = createUpdateAction('ai_logs', 'low');
const deleteAILog = createDeleteAction('ai_logs', 'low');
const selectAILogs = createSelectAction('ai_logs');

/**
 * Get all AI logs for a business - works offline
 */
export const getAILogs = async (businessId: string, userId?: string, objectType?: string): Promise<AILog[]> => {
    try {
        const result = await selectAILogs({}, businessId);

        if (result.error) {
            console.error("Error fetching AI logs:", result.error);
            return [];
        }

        let logs = (result.data || []) as AILog[];

        // Filter by user_id if provided
        if (userId) {
            logs = logs.filter(log => log.user_id === userId);
        }

        // Filter by object_type if provided
        if (objectType) {
            logs = logs.filter(log => log.object_type === objectType);
        }

        return logs;
    } catch (err) {
        console.error("Error in getAILogs:", err);
        return [];
    }
};

/**
 * Create a new AI log - works offline
 */
export const createAILog = async (data: AILogInsert): Promise<AILog | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for AI log');
        }

        const logData = {
            ...data,
            id: data.id || uuidv4(),
            created_at: data.created_at || new Date().toISOString(),
        };

        const result = await insertAILog(logData, data.business_id);

        if (result.error) {
            console.error("Error creating AI log:", result.error);
            return null;
        }

        return result.data as AILog;
    } catch (err) {
        console.error("Error in createAILog:", err);
        return null;
    }
};

/**
 * Update an AI log - works offline
 */
export const updateAILogById = async (id: string, data: Partial<AILogUpdate>, businessId: string): Promise<AILog | null> => {
    try {
        const updateData = {
            ...data,
            id,
        };

        const result = await updateAILog(updateData, businessId);

        if (result.error) {
            console.error("Error updating AI log:", result.error);
            return null;
        }

        return result.data as AILog;
    } catch (err) {
        console.error("Error in updateAILogById:", err);
        return null;
    }
};

/**
 * Delete an AI log - works offline
 */
export const removeAILog = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteAILog({ id }, businessId);

        if (result.error) {
            console.error("Error deleting AI log:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeAILog:", err);
        return false;
    }
};

/**
 * Get an AI log by ID - works offline
 */
export const getAILogById = async (id: string, businessId: string): Promise<AILog | null> => {
    try {
        const logs = await getAILogs(businessId);
        return logs.find(log => log.id === id) || null;
    } catch (err) {
        console.error("Error in getAILogById:", err);
        return null;
    }
};

/**
 * Get AI logs for specific object - works offline
 */
export const getAILogsByObject = async (businessId: string, objectType: string, objectId: string): Promise<AILog[]> => {
    try {
        const logs = await getAILogs(businessId, undefined, objectType);
        return logs.filter(log => log.object_id === objectId);
    } catch (err) {
        console.error("Error in getAILogsByObject:", err);
        return [];
    }
};

/**
 * Get AI logs by action type - works offline
 */
export const getAILogsByAction = async (businessId: string, action: string): Promise<AILog[]> => {
    try {
        const logs = await getAILogs(businessId);
        return logs.filter(log => log.action === action);
    } catch (err) {
        console.error("Error in getAILogsByAction:", err);
        return [];
    }
};

/**
 * Get recent AI logs - works offline
 */
export const getRecentAILogs = async (businessId: string, limit: number = 50): Promise<AILog[]> => {
    try {
        const logs = await getAILogs(businessId);
        return logs
            .sort((a, b) => {
                const aDate = new Date(a.created_at || 0).getTime();
                const bDate = new Date(b.created_at || 0).getTime();
                return bDate - aDate;
            })
            .slice(0, limit);
    } catch (err) {
        console.error("Error in getRecentAILogs:", err);
        return [];
    }
};

// Bulk operations for AI logs
export const createMultipleAILogs = async (logs: AILogInsert[]): Promise<AILog[]> => {
    const results: AILog[] = [];
    for (const log of logs) {
        try {
            const result = await createAILog(log);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            console.error('Error creating AI log:', error);
        }
    }
    return results;
};

export const deleteAILogsByUser = async (businessId: string, userId: string): Promise<boolean[]> => {
    const logs = await getAILogs(businessId, userId);
    const deletePromises = logs.map(log => removeAILog(log.id, businessId));
    return await Promise.all(deletePromises);
};

export const deleteAILogsByObject = async (businessId: string, objectType: string, objectId: string): Promise<boolean[]> => {
    const logs = await getAILogsByObject(businessId, objectType, objectId);
    const deletePromises = logs.map(log => removeAILog(log.id, businessId));
    return await Promise.all(deletePromises);
};

// Analytics and reporting functions
export const getAIUsageStats = async (businessId: string): Promise<{
    totalLogs: number;
    totalTokensPrompt: number;
    totalTokensCompletion: number;
    totalTokens: number;
    averageTokensPerRequest: number;
    usageByAction: Record<string, number>;
    usageByModel: Record<string, number>;
    usageByObjectType: Record<string, number>;
    costEstimate: number;
}> => {
    try {
        const logs = await getAILogs(businessId);

        const stats = {
            totalLogs: logs.length,
            totalTokensPrompt: logs.reduce((sum, log) => sum + log.tokens_prompt, 0),
            totalTokensCompletion: logs.reduce((sum, log) => sum + log.tokens_completion, 0),
            totalTokens: 0,
            averageTokensPerRequest: 0,
            usageByAction: {} as Record<string, number>,
            usageByModel: {} as Record<string, number>,
            usageByObjectType: {} as Record<string, number>,
            costEstimate: 0,
        };

        stats.totalTokens = stats.totalTokensPrompt + stats.totalTokensCompletion;
        stats.averageTokensPerRequest = stats.totalLogs > 0 ? stats.totalTokens / stats.totalLogs : 0;

        // Group by action, model, and object type
        logs.forEach(log => {
            // By action
            stats.usageByAction[log.action] = (stats.usageByAction[log.action] || 0) + 1;

            // By model
            stats.usageByModel[log.model] = (stats.usageByModel[log.model] || 0) + 1;

            // By object type
            stats.usageByObjectType[log.object_type] = (stats.usageByObjectType[log.object_type] || 0) + 1;
        });

        // Rough cost estimate (GPT-4 pricing: $0.01 per 1K prompt tokens, $0.03 per 1K completion tokens)
        stats.costEstimate = (stats.totalTokensPrompt * 0.01 / 1000) + (stats.totalTokensCompletion * 0.03 / 1000);

        return stats;
    } catch (error) {
        console.error('Failed to get AI usage stats:', error);
        return {
            totalLogs: 0,
            totalTokensPrompt: 0,
            totalTokensCompletion: 0,
            totalTokens: 0,
            averageTokensPerRequest: 0,
            usageByAction: {},
            usageByModel: {},
            usageByObjectType: {},
            costEstimate: 0,
        };
    }
};

// Get AI usage for specific time period
export const getAIUsageByDateRange = async (businessId: string, startDate: string, endDate: string): Promise<AILog[]> => {
    try {
        const logs = await getAILogs(businessId);
        return logs.filter(log => {
            if (!log.created_at) return false;
            const logDate = new Date(log.created_at);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return logDate >= start && logDate <= end;
        });
    } catch (err) {
        console.error("Error in getAIUsageByDateRange:", err);
        return [];
    }
};

// Export compatibility functions for existing code
export {
    getAILogs as getAllAILogs,
    createAILog as addAILog,
    removeAILog as deleteAILog,
    getAILogById as fetchAILog,
};
