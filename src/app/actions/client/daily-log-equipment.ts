"use client";

/**
 * Daily Log Equipment Client Actions - Offline-First Implementation (Phase 4.2 - Daily Operations System)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { DailyLogEquipment, DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from "@/types/daily-log-equipment";
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
 * Add equipment to a daily log - Offline-First
 */
export async function addDailyLogEquipment(
    businessId: string,
    dailyLogId: string,
    equipmentData: Omit<DailyLogEquipmentInsert, 'id' | 'business_id' | 'daily_log_id' | 'created_at' | 'created_by'>
): Promise<{ success: boolean; data?: DailyLogEquipment; error?: string }> {
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

        // Validate that the daily log exists and belongs to the business
        const dailyLog = await db.dailyLogs.get(dailyLogId);
        if (!dailyLog || dailyLog.business_id !== businessId) {
            return { success: false, error: 'Daily log not found or access denied' };
        }

        const equipmentId = uuidv4();
        const now = new Date().toISOString();

        const newEquipment: DailyLogEquipment = {
            id: equipmentId,
            business_id: businessId,
            daily_log_id: dailyLogId,
            ...equipmentData,
            created_at: now,
            created_by: userId,
            updated_at: now,
            updated_by: userId
        };

        // Store locally first (offline-first approach)
        await db.dailyLogEquipment.put(newEquipment);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogEquipment_insert_${equipmentId}_${Date.now()}`,
            table: 'dailyLogEquipment',
            operation: 'insert',
            data: newEquipment,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: newEquipment };
    } catch (error) {
        console.error('Error adding daily log equipment:', error);
        return { success: false, error: 'Failed to add daily log equipment' };
    }
}

/**
 * Get all equipment for a daily log - Cache-First
 */
export async function getDailyLogEquipment(
    businessId: string,
    dailyLogId: string
): Promise<{ success: boolean; data?: DailyLogEquipment[]; error?: string }> {
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

        // Validate that the daily log exists and belongs to the business
        const dailyLog = await db.dailyLogs.get(dailyLogId);
        if (!dailyLog || dailyLog.business_id !== businessId) {
            return { success: false, error: 'Daily log not found or access denied' };
        }

        // Get equipment from local database
        const equipment = await db.dailyLogEquipment
            .where('daily_log_id')
            .equals(dailyLogId)
            .and(item => item.business_id === businessId)
            .toArray();

        return { success: true, data: equipment };
    } catch (error) {
        console.error('Error getting daily log equipment:', error);
        return { success: false, error: 'Failed to get daily log equipment' };
    }
}

/**
 * Get equipment by ID - Cache-First
 */
export async function getDailyLogEquipmentById(
    businessId: string,
    equipmentId: string
): Promise<{ success: boolean; data?: DailyLogEquipment; error?: string }> {
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

        // Get from local database
        const equipment = await db.dailyLogEquipment.get(equipmentId);
        if (!equipment || equipment.business_id !== businessId) {
            return { success: false, error: 'Daily log equipment not found' };
        }

        return { success: true, data: equipment };
    } catch (error) {
        console.error('Error getting daily log equipment by ID:', error);
        return { success: false, error: 'Failed to get daily log equipment' };
    }
}

/**
 * Update daily log equipment - Offline-First
 */
export async function updateDailyLogEquipment(
    businessId: string,
    equipmentId: string,
    updates: Partial<DailyLogEquipmentUpdate>
): Promise<{ success: boolean; data?: DailyLogEquipment; error?: string }> {
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

        // Get existing equipment to validate
        const existingEquipment = await db.dailyLogEquipment.get(equipmentId);
        if (!existingEquipment || existingEquipment.business_id !== businessId) {
            return { success: false, error: 'Daily log equipment not found or access denied' };
        }

        // Prepare updated data
        const now = new Date().toISOString();
        const updatedEquipment: DailyLogEquipment = {
            ...existingEquipment,
            ...updates,
            updated_at: now,
            updated_by: userId
        };

        // Update locally first (offline-first approach)
        await db.dailyLogEquipment.put(updatedEquipment);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogEquipment_update_${equipmentId}_${Date.now()}`,
            table: 'dailyLogEquipment',
            operation: 'update',
            data: updatedEquipment,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: updatedEquipment };
    } catch (error) {
        console.error('Error updating daily log equipment:', error);
        return { success: false, error: 'Failed to update daily log equipment' };
    }
}

/**
 * Delete daily log equipment - Offline-First
 */
export async function deleteDailyLogEquipment(
    businessId: string,
    equipmentId: string
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

        // Get existing equipment to validate
        const existingEquipment = await db.dailyLogEquipment.get(equipmentId);
        if (!existingEquipment || existingEquipment.business_id !== businessId) {
            return { success: false, error: 'Daily log equipment not found or access denied' };
        }

        // Delete locally first (offline-first approach)
        await db.dailyLogEquipment.delete(equipmentId);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogEquipment_delete_${equipmentId}_${Date.now()}`,
            table: 'dailyLogEquipment',
            operation: 'delete',
            data: { id: equipmentId },
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting daily log equipment:', error);
        return { success: false, error: 'Failed to delete daily log equipment' };
    }
}

/**
 * Get equipment usage summary for a project - Cache-First
 */
export async function getProjectEquipmentUsage(
    businessId: string,
    projectId: string,
    startDate?: string,
    endDate?: string
): Promise<{
    success: boolean; data?: Array<{
        equipment_id: string;
        equipment_name: string | null;
        total_hours: number;
        usage_count: number;
        daily_logs: Array<{
            daily_log_id: string;
            date: string;
            hours: number | null;
            operator: string | null;
            condition: string | null;
        }>;
    }>; error?: string
}> {
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

        // Get daily logs for the project in the date range
        let dailyLogsQuery = db.dailyLogs
            .where('business_id')
            .equals(businessId)
            .and(log => log.project_id === projectId);

        if (startDate || endDate) {
            dailyLogsQuery = dailyLogsQuery.and(log => {
                if (startDate && log.date < startDate) return false;
                if (endDate && log.date > endDate) return false;
                return true;
            });
        }

        const dailyLogs = await dailyLogsQuery.toArray();
        const dailyLogIds = dailyLogs.map(log => log.id);

        // Get all equipment entries for these daily logs
        const equipmentEntries = await db.dailyLogEquipment
            .where('business_id')
            .equals(businessId)
            .and(entry => dailyLogIds.includes(entry.daily_log_id))
            .toArray();

        // Group by equipment_id and calculate summaries
        const equipmentSummary = new Map<string, {
            equipment_id: string;
            equipment_name: string | null;
            total_hours: number;
            usage_count: number;
            daily_logs: Array<{
                daily_log_id: string;
                date: string;
                hours: number | null;
                operator: string | null;
                condition: string | null;
            }>;
        }>();

        for (const entry of equipmentEntries) {
            const dailyLog = dailyLogs.find(log => log.id === entry.daily_log_id);
            if (!dailyLog) continue;

            const key = entry.equipment_id;
            if (!equipmentSummary.has(key)) {
                equipmentSummary.set(key, {
                    equipment_id: entry.equipment_id,
                    equipment_name: entry.name,
                    total_hours: 0,
                    usage_count: 0,
                    daily_logs: []
                });
            }

            const summary = equipmentSummary.get(key)!;
            summary.total_hours += entry.hours || 0;
            summary.usage_count += 1;
            summary.daily_logs.push({
                daily_log_id: entry.daily_log_id,
                date: dailyLog.date,
                hours: entry.hours,
                operator: entry.operator,
                condition: entry.condition
            });
        }

        const result = Array.from(equipmentSummary.values());

        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting project equipment usage:', error);
        return { success: false, error: 'Failed to get project equipment usage' };
    }
}

/**
 * Get equipment usage for all projects - Cache-First
 */
export async function getBusinessEquipmentUsage(
    businessId: string,
    startDate?: string,
    endDate?: string
): Promise<{
    success: boolean; data?: Array<{
        equipment_id: string;
        equipment_name: string | null;
        total_hours: number;
        usage_count: number;
        projects: Array<{
            project_id: string;
            total_hours: number;
            usage_count: number;
        }>;
    }>; error?: string
}> {
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

        // Get daily logs for the business in the date range
        let dailyLogsQuery = db.dailyLogs.where('business_id').equals(businessId);

        if (startDate || endDate) {
            dailyLogsQuery = dailyLogsQuery.and(log => {
                if (startDate && log.date < startDate) return false;
                if (endDate && log.date > endDate) return false;
                return true;
            });
        }

        const dailyLogs = await dailyLogsQuery.toArray();
        const dailyLogIds = dailyLogs.map(log => log.id);

        // Get all equipment entries for these daily logs
        const equipmentEntries = await db.dailyLogEquipment
            .where('business_id')
            .equals(businessId)
            .and(entry => dailyLogIds.includes(entry.daily_log_id))
            .toArray();

        // Group by equipment_id and calculate summaries
        const equipmentSummary = new Map<string, {
            equipment_id: string;
            equipment_name: string | null;
            total_hours: number;
            usage_count: number;
            projects: Map<string, { total_hours: number; usage_count: number }>;
        }>();

        for (const entry of equipmentEntries) {
            const dailyLog = dailyLogs.find(log => log.id === entry.daily_log_id);
            if (!dailyLog) continue;

            const key = entry.equipment_id;
            if (!equipmentSummary.has(key)) {
                equipmentSummary.set(key, {
                    equipment_id: entry.equipment_id,
                    equipment_name: entry.name,
                    total_hours: 0,
                    usage_count: 0,
                    projects: new Map()
                });
            }

            const summary = equipmentSummary.get(key)!;
            summary.total_hours += entry.hours || 0;
            summary.usage_count += 1;

            // Track by project
            if (!summary.projects.has(dailyLog.project_id)) {
                summary.projects.set(dailyLog.project_id, { total_hours: 0, usage_count: 0 });
            }
            const projectSummary = summary.projects.get(dailyLog.project_id)!;
            projectSummary.total_hours += entry.hours || 0;
            projectSummary.usage_count += 1;
        }

        const result = Array.from(equipmentSummary.values()).map(item => ({
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name,
            total_hours: item.total_hours,
            usage_count: item.usage_count,
            projects: Array.from(item.projects.entries()).map(([projectId, data]) => ({
                project_id: projectId,
                total_hours: data.total_hours,
                usage_count: data.usage_count
            }))
        }));

        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting business equipment usage:', error);
        return { success: false, error: 'Failed to get business equipment usage' };
    }
}

/**
 * Search daily log equipment - Cache-First
 */
export async function searchDailyLogEquipment(
    businessId: string,
    searchCriteria: {
        equipmentId?: string;
        operatorName?: string;
        condition?: string;
        projectId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }
): Promise<{ success: boolean; data?: DailyLogEquipment[]; error?: string }> {
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

        // Start with business filter
        let query = db.dailyLogEquipment.where('business_id').equals(businessId);

        // If projectId is specified, first get daily logs for that project
        let dailyLogIds: string[] | undefined;
        if (searchCriteria.projectId) {
            const dailyLogs = await db.dailyLogs
                .where('business_id')
                .equals(businessId)
                .and(log => log.project_id === searchCriteria.projectId!)
                .toArray();
            dailyLogIds = dailyLogs.map(log => log.id);
        }

        // Apply filters
        query = query.and(equipment => {
            // Equipment ID filter
            if (searchCriteria.equipmentId && equipment.equipment_id !== searchCriteria.equipmentId) {
                return false;
            }

            // Operator name filter (case-insensitive)
            if (searchCriteria.operatorName) {
                const operatorName = searchCriteria.operatorName.toLowerCase();
                if (!equipment.operator || !equipment.operator.toLowerCase().includes(operatorName)) {
                    return false;
                }
            }

            // Condition filter
            if (searchCriteria.condition && equipment.condition !== searchCriteria.condition) {
                return false;
            }

            // Project filter (via daily log IDs)
            if (dailyLogIds && !dailyLogIds.includes(equipment.daily_log_id)) {
                return false;
            }

            return true;
        });

        // Apply limit
        if (searchCriteria.limit) {
            query = query.limit(searchCriteria.limit);
        }

        const equipment = await query.toArray();

        // If date filtering is needed, get the daily logs and filter
        if (searchCriteria.startDate || searchCriteria.endDate) {
            const equipmentIds = equipment.map(eq => eq.id);
            const dailyLogMap = new Map<string, string>(); // daily_log_id -> date

            const relevantDailyLogs = await db.dailyLogs
                .where('business_id')
                .equals(businessId)
                .toArray();

            relevantDailyLogs.forEach(log => {
                dailyLogMap.set(log.id, log.date);
            });

            const filteredEquipment = equipment.filter(eq => {
                const date = dailyLogMap.get(eq.daily_log_id);
                if (!date) return false;

                if (searchCriteria.startDate && date < searchCriteria.startDate) return false;
                if (searchCriteria.endDate && date > searchCriteria.endDate) return false;

                return true;
            });

            return { success: true, data: filteredEquipment };
        }

        return { success: true, data: equipment };
    } catch (error) {
        console.error('Error searching daily log equipment:', error);
        return { success: false, error: 'Failed to search daily log equipment' };
    }
}
