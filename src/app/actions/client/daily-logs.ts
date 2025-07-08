"use client";

/**
 * Daily Logs Client Actions - Offline-First Implementation (Phase 4.2 - Daily Operations System)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { DailyLog, DailyLogInsert, DailyLogUpdate } from "@/types/daily-logs";
import { db } from "@/lib/offline/dexie-db";
import { initializeAuthState } from "./business";
import { v4 as uuidv4 } from "uuid";

// Global auth state for client actions (imported from business actions)
declare let currentClerkUser: { id: string } | null;
declare let authStateInitialized: boolean;

// Check if we're online
function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

// Get current authenticated user ID (auth_id) from auth system
async function getCurrentUserId(): Promise<string | null> {
    // First priority: Use initialized Clerk user state (when online and available)
    if (authStateInitialized && currentClerkUser?.id) {
        return currentClerkUser.id;
    }

    // Second priority: Get from cached auth_id (for offline scenarios)
    if (typeof window !== 'undefined') {
        const cachedAuthId = window.localStorage.getItem('cached_auth_id');
        if (cachedAuthId) {
            return cachedAuthId;
        }
    }

    // If no auth state available, return null (user needs to authenticate)
    console.warn('No authenticated user found. Ensure initializeAuthState() is called from a React component.');
    return null;
}

// Validate that user has access to the specified business (using auth_id)
async function validateUserBusinessAccess(userAuthId: string, businessId: string): Promise<boolean> {
    try {
        // Check if user has a mapping to this business (using auth_id)
        const userBusinessId = await db.userBusinessMappings.get(userAuthId);
        if (userBusinessId?.businessId === businessId) {
            return true;
        }

        // Fallback: Check if user is the business owner
        const business = await db.businesses.get(businessId);
        if (business && business.owner_id === userAuthId) {
            // Cache the mapping for future use
            await db.userBusinessMappings.put({
                userId: userAuthId,
                businessId: businessId,
                role: 'owner',
                lastUpdated: Date.now()
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error validating user business access:', error);
        return false;
    }
}

/**
 * Create a new daily log - Offline-First
 */
export async function createDailyLog(
    businessId: string,
    projectId: string,
    dailyLogData: Omit<DailyLogInsert, 'id' | 'business_id' | 'project_id' | 'author_id' | 'created_at' | 'created_by'>
): Promise<{ success: boolean; data?: DailyLog; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        const dailyLogId = uuidv4();
        const now = new Date().toISOString();

        const newDailyLog: DailyLog = {
            id: dailyLogId,
            business_id: businessId,
            project_id: projectId,
            author_id: userId,
            ...dailyLogData,
            created_at: now,
            created_by: userId,
            updated_at: now,
            updated_by: userId
        };

        // Store locally first (offline-first approach)
        await db.dailyLogs.put(newDailyLog);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogs_insert_${dailyLogId}_${Date.now()}`,
            table: 'dailyLogs',
            operation: 'insert',
            data: newDailyLog,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: newDailyLog };
    } catch (error) {
        console.error('Error creating daily log:', error);
        return { success: false, error: 'Failed to create daily log' };
    }
}

/**
 * Get daily log by ID - Cache-First with Server Fallback
 */
export async function getDailyLogById(
    businessId: string,
    dailyLogId: string
): Promise<{ success: boolean; data?: DailyLog; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Try to get from local database first
        const localDailyLog = await db.dailyLogs.get(dailyLogId);
        if (localDailyLog && localDailyLog.business_id === businessId) {
            return { success: true, data: localDailyLog };
        }

        // If not found locally and we're online, we could fetch from server
        // For now, return not found since we're focusing on offline-first
        return { success: false, error: 'Daily log not found' };
    } catch (error) {
        console.error('Error getting daily log:', error);
        return { success: false, error: 'Failed to get daily log' };
    }
}

/**
 * Get all daily logs for a project - Cache-First
 */
export async function getProjectDailyLogs(
    businessId: string,
    projectId: string,
    options?: {
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }
): Promise<{ success: boolean; data?: DailyLog[]; error?: string; total?: number }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get from local database with filtering
        let query = db.dailyLogs
            .where('business_id')
            .equals(businessId)
            .and(log => log.project_id === projectId);

        // Apply date filtering if provided
        if (options?.startDate || options?.endDate) {
            query = query.and(log => {
                if (options.startDate && log.date < options.startDate) return false;
                if (options.endDate && log.date > options.endDate) return false;
                return true;
            });
        }

        // Get total count for pagination
        const total = await query.count();

        // Apply pagination
        if (options?.offset) {
            query = query.offset(options.offset);
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }

        // Order by date descending (most recent first)
        const dailyLogs = await query.reverse().sortBy('date');

        return { success: true, data: dailyLogs, total };
    } catch (error) {
        console.error('Error getting project daily logs:', error);
        return { success: false, error: 'Failed to get project daily logs' };
    }
}

/**
 * Get all daily logs for a business - Cache-First
 */
export async function getBusinessDailyLogs(
    businessId: string,
    options?: {
        startDate?: string;
        endDate?: string;
        projectId?: string;
        authorId?: string;
        limit?: number;
        offset?: number;
    }
): Promise<{ success: boolean; data?: DailyLog[]; error?: string; total?: number }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get from local database with filtering
        let query = db.dailyLogs.where('business_id').equals(businessId);

        // Apply filters
        if (options?.projectId || options?.authorId || options?.startDate || options?.endDate) {
            query = query.and(log => {
                if (options.projectId && log.project_id !== options.projectId) return false;
                if (options.authorId && log.author_id !== options.authorId) return false;
                if (options.startDate && log.date < options.startDate) return false;
                if (options.endDate && log.date > options.endDate) return false;
                return true;
            });
        }

        // Get total count for pagination
        const total = await query.count();

        // Apply pagination
        if (options?.offset) {
            query = query.offset(options.offset);
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }

        // Order by date descending (most recent first)
        const dailyLogs = await query.reverse().sortBy('date');

        return { success: true, data: dailyLogs, total };
    } catch (error) {
        console.error('Error getting business daily logs:', error);
        return { success: false, error: 'Failed to get business daily logs' };
    }
}

/**
 * Update daily log - Offline-First
 */
export async function updateDailyLog(
    businessId: string,
    dailyLogId: string,
    updates: Partial<DailyLogUpdate>
): Promise<{ success: boolean; data?: DailyLog; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get existing daily log to validate
        const existingDailyLog = await db.dailyLogs.get(dailyLogId);
        if (!existingDailyLog || existingDailyLog.business_id !== businessId) {
            return { success: false, error: 'Daily log not found or access denied' };
        }

        // Prepare updated data
        const now = new Date().toISOString();
        const updatedDailyLog: DailyLog = {
            ...existingDailyLog,
            ...updates,
            updated_at: now,
            updated_by: userId
        };

        // Update locally first (offline-first approach)
        await db.dailyLogs.put(updatedDailyLog);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogs_update_${dailyLogId}_${Date.now()}`,
            table: 'dailyLogs',
            operation: 'update',
            data: updatedDailyLog,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: updatedDailyLog };
    } catch (error) {
        console.error('Error updating daily log:', error);
        return { success: false, error: 'Failed to update daily log' };
    }
}

/**
 * Delete daily log - Offline-First
 */
export async function deleteDailyLog(
    businessId: string,
    dailyLogId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get existing daily log to validate
        const existingDailyLog = await db.dailyLogs.get(dailyLogId);
        if (!existingDailyLog || existingDailyLog.business_id !== businessId) {
            return { success: false, error: 'Daily log not found or access denied' };
        }

        // Delete locally first (offline-first approach)
        await db.dailyLogs.delete(dailyLogId);

        // Also delete related entities (equipment, materials, images)
        await db.dailyLogEquipment.where('daily_log_id').equals(dailyLogId).delete();
        await db.dailyLogMaterials.where('daily_log_id').equals(dailyLogId).delete();
        await db.dailyLogImages.where('daily_log_id').equals(dailyLogId).delete();

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogs_delete_${dailyLogId}_${Date.now()}`,
            table: 'dailyLogs',
            operation: 'delete',
            data: { id: dailyLogId },
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting daily log:', error);
        return { success: false, error: 'Failed to delete daily log' };
    }
}

/**
 * Search daily logs - Cache-First
 */
export async function searchDailyLogs(
    businessId: string,
    searchCriteria: {
        query?: string;
        projectId?: string;
        authorId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }
): Promise<{ success: boolean; data?: DailyLog[]; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get from local database with search
        let query = db.dailyLogs.where('business_id').equals(businessId);

        const searchTerm = searchCriteria.query?.toLowerCase();

        // Apply filters and search
        query = query.and(log => {
            // Project filter
            if (searchCriteria.projectId && log.project_id !== searchCriteria.projectId) return false;

            // Author filter
            if (searchCriteria.authorId && log.author_id !== searchCriteria.authorId) return false;

            // Date range filter
            if (searchCriteria.startDate && log.date < searchCriteria.startDate) return false;
            if (searchCriteria.endDate && log.date > searchCriteria.endDate) return false;

            // Text search in work_planned, work_completed, and notes
            if (searchTerm) {
                const searchableText = [
                    log.work_planned,
                    log.work_completed,
                    log.notes,
                    log.safety,
                    log.quality,
                    log.delays
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) return false;
            }

            return true;
        });

        // Apply limit
        if (searchCriteria.limit) {
            query = query.limit(searchCriteria.limit);
        }

        // Order by date descending (most recent first)
        const dailyLogs = await query.reverse().sortBy('date');

        return { success: true, data: dailyLogs };
    } catch (error) {
        console.error('Error searching daily logs:', error);
        return { success: false, error: 'Failed to search daily logs' };
    }
}

/**
 * Get daily logs by date range - Cache-First
 */
export async function getDailyLogsByDateRange(
    businessId: string,
    startDate: string,
    endDate: string,
    projectId?: string
): Promise<{ success: boolean; data?: DailyLog[]; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get from local database with date range filtering
        let query = db.dailyLogs
            .where('business_id')
            .equals(businessId)
            .and(log => log.date >= startDate && log.date <= endDate);

        // Apply project filter if specified
        if (projectId) {
            query = query.and(log => log.project_id === projectId);
        }

        // Order by date ascending
        const dailyLogs = await query.sortBy('date');

        return { success: true, data: dailyLogs };
    } catch (error) {
        console.error('Error getting daily logs by date range:', error);
        return { success: false, error: 'Failed to get daily logs by date range' };
    }
}

/**
 * Check if a daily log exists for a specific date and project
 */
export async function checkDailyLogExists(
    businessId: string,
    projectId: string,
    date: string
): Promise<{ success: boolean; exists?: boolean; data?: DailyLog; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Check if daily log exists for the date and project
        const existingLog = await db.dailyLogs
            .where('business_id')
            .equals(businessId)
            .and(log => log.project_id === projectId && log.date === date)
            .first();

        return {
            success: true,
            exists: !!existingLog,
            data: existingLog || undefined
        };
    } catch (error) {
        console.error('Error checking daily log existence:', error);
        return { success: false, error: 'Failed to check daily log existence' };
    }
}
