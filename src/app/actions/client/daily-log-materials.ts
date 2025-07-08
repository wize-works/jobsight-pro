"use client";

/**
 * Daily Log Materials Client Actions - Offline-First Implementation (Phase 4.2 - Daily Operations System)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { DailyLogMaterial, DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
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
 * Add material to a daily log - Offline-First
 */
export async function addDailyLogMaterial(
    businessId: string,
    dailyLogId: string,
    materialData: Omit<DailyLogMaterialInsert, 'id' | 'business_id' | 'daily_log_id' | 'created_at' | 'created_by'>
): Promise<{ success: boolean; data?: DailyLogMaterial; error?: string }> {
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

        const materialId = uuidv4();
        const now = new Date().toISOString();

        const newMaterial: DailyLogMaterial = {
            id: materialId,
            business_id: businessId,
            daily_log_id: dailyLogId,
            ...materialData,
            created_at: now,
            created_by: userId,
            updated_at: now,
            updated_by: userId
        };

        // Store locally first (offline-first approach)
        await db.dailyLogMaterials.put(newMaterial);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogMaterials_insert_${materialId}_${Date.now()}`,
            table: 'dailyLogMaterials',
            operation: 'insert',
            data: newMaterial,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: newMaterial };
    } catch (error) {
        console.error('Error adding daily log material:', error);
        return { success: false, error: 'Failed to add daily log material' };
    }
}

/**
 * Get all materials for a daily log - Cache-First
 */
export async function getDailyLogMaterials(
    businessId: string,
    dailyLogId: string
): Promise<{ success: boolean; data?: DailyLogMaterial[]; error?: string }> {
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

        // Get materials from local database
        const materials = await db.dailyLogMaterials
            .where('daily_log_id')
            .equals(dailyLogId)
            .and(item => item.business_id === businessId)
            .toArray();

        return { success: true, data: materials };
    } catch (error) {
        console.error('Error getting daily log materials:', error);
        return { success: false, error: 'Failed to get daily log materials' };
    }
}

/**
 * Get material by ID - Cache-First
 */
export async function getDailyLogMaterialById(
    businessId: string,
    materialId: string
): Promise<{ success: boolean; data?: DailyLogMaterial; error?: string }> {
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
        const material = await db.dailyLogMaterials.get(materialId);
        if (!material || material.business_id !== businessId) {
            return { success: false, error: 'Daily log material not found' };
        }

        return { success: true, data: material };
    } catch (error) {
        console.error('Error getting daily log material by ID:', error);
        return { success: false, error: 'Failed to get daily log material' };
    }
}

/**
 * Update daily log material - Offline-First
 */
export async function updateDailyLogMaterial(
    businessId: string,
    materialId: string,
    updates: Partial<DailyLogMaterialUpdate>
): Promise<{ success: boolean; data?: DailyLogMaterial; error?: string }> {
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

        // Get existing material to validate
        const existingMaterial = await db.dailyLogMaterials.get(materialId);
        if (!existingMaterial || existingMaterial.business_id !== businessId) {
            return { success: false, error: 'Daily log material not found or access denied' };
        }

        // Prepare updated data
        const now = new Date().toISOString();
        const updatedMaterial: DailyLogMaterial = {
            ...existingMaterial,
            ...updates,
            updated_at: now,
            updated_by: userId
        };

        // Update locally first (offline-first approach)
        await db.dailyLogMaterials.put(updatedMaterial);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogMaterials_update_${materialId}_${Date.now()}`,
            table: 'dailyLogMaterials',
            operation: 'update',
            data: updatedMaterial,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: updatedMaterial };
    } catch (error) {
        console.error('Error updating daily log material:', error);
        return { success: false, error: 'Failed to update daily log material' };
    }
}

/**
 * Delete daily log material - Offline-First
 */
export async function deleteDailyLogMaterial(
    businessId: string,
    materialId: string
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

        // Get existing material to validate
        const existingMaterial = await db.dailyLogMaterials.get(materialId);
        if (!existingMaterial || existingMaterial.business_id !== businessId) {
            return { success: false, error: 'Daily log material not found or access denied' };
        }

        // Delete locally first (offline-first approach)
        await db.dailyLogMaterials.delete(materialId);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogMaterials_delete_${materialId}_${Date.now()}`,
            table: 'dailyLogMaterials',
            operation: 'delete',
            data: { id: materialId },
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting daily log material:', error);
        return { success: false, error: 'Failed to delete daily log material' };
    }
}

/**
 * Get material usage summary for a project - Cache-First
 */
export async function getProjectMaterialUsage(
    businessId: string,
    projectId: string,
    startDate?: string,
    endDate?: string
): Promise<{
    success: boolean; data?: Array<{
        material_name: string;
        total_quantity: number;
        total_cost: number;
        usage_count: number;
        daily_logs: Array<{
            daily_log_id: string;
            date: string;
            quantity: number | null;
            cost: number | null;
            supplier: string | null;
            notes: string | null;
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

        // Get all material entries for these daily logs
        const materialEntries = await db.dailyLogMaterials
            .where('business_id')
            .equals(businessId)
            .and(entry => dailyLogIds.includes(entry.daily_log_id))
            .toArray();

        // Group by material name and calculate summaries
        const materialSummary = new Map<string, {
            material_name: string;
            total_quantity: number;
            total_cost: number;
            usage_count: number;
            daily_logs: Array<{
                daily_log_id: string;
                date: string;
                quantity: number | null;
                cost: number | null;
                supplier: string | null;
                notes: string | null;
            }>;
        }>();

        for (const entry of materialEntries) {
            const dailyLog = dailyLogs.find(log => log.id === entry.daily_log_id);
            if (!dailyLog) continue;

            const key = entry.name.toLowerCase();
            if (!materialSummary.has(key)) {
                materialSummary.set(key, {
                    material_name: entry.name,
                    total_quantity: 0,
                    total_cost: 0,
                    usage_count: 0,
                    daily_logs: []
                });
            }

            const summary = materialSummary.get(key)!;
            summary.total_quantity += entry.quantity || 0;
            summary.total_cost += entry.cost || 0;
            summary.usage_count += 1;
            summary.daily_logs.push({
                daily_log_id: entry.daily_log_id,
                date: dailyLog.date,
                quantity: entry.quantity,
                cost: entry.cost,
                supplier: entry.supplier,
                notes: entry.notes
            });
        }

        const result = Array.from(materialSummary.values());

        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting project material usage:', error);
        return { success: false, error: 'Failed to get project material usage' };
    }
}

/**
 * Get material usage for all projects - Cache-First
 */
export async function getBusinessMaterialUsage(
    businessId: string,
    startDate?: string,
    endDate?: string
): Promise<{
    success: boolean; data?: Array<{
        material_name: string;
        total_quantity: number;
        total_cost: number;
        usage_count: number;
        projects: Array<{
            project_id: string;
            total_quantity: number;
            total_cost: number;
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

        // Get all material entries for these daily logs
        const materialEntries = await db.dailyLogMaterials
            .where('business_id')
            .equals(businessId)
            .and(entry => dailyLogIds.includes(entry.daily_log_id))
            .toArray();

        // Group by material name and calculate summaries
        const materialSummary = new Map<string, {
            material_name: string;
            total_quantity: number;
            total_cost: number;
            usage_count: number;
            projects: Map<string, { total_quantity: number; total_cost: number; usage_count: number }>;
        }>();

        for (const entry of materialEntries) {
            const dailyLog = dailyLogs.find(log => log.id === entry.daily_log_id);
            if (!dailyLog) continue;

            const key = entry.name.toLowerCase();
            if (!materialSummary.has(key)) {
                materialSummary.set(key, {
                    material_name: entry.name,
                    total_quantity: 0,
                    total_cost: 0,
                    usage_count: 0,
                    projects: new Map()
                });
            }

            const summary = materialSummary.get(key)!;
            summary.total_quantity += entry.quantity || 0;
            summary.total_cost += entry.cost || 0;
            summary.usage_count += 1;

            // Track by project
            if (!summary.projects.has(dailyLog.project_id)) {
                summary.projects.set(dailyLog.project_id, {
                    total_quantity: 0,
                    total_cost: 0,
                    usage_count: 0
                });
            }
            const projectSummary = summary.projects.get(dailyLog.project_id)!;
            projectSummary.total_quantity += entry.quantity || 0;
            projectSummary.total_cost += entry.cost || 0;
            projectSummary.usage_count += 1;
        }

        const result = Array.from(materialSummary.values()).map(item => ({
            material_name: item.material_name,
            total_quantity: item.total_quantity,
            total_cost: item.total_cost,
            usage_count: item.usage_count,
            projects: Array.from(item.projects.entries()).map(([projectId, data]) => ({
                project_id: projectId,
                total_quantity: data.total_quantity,
                total_cost: data.total_cost,
                usage_count: data.usage_count
            }))
        }));

        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting business material usage:', error);
        return { success: false, error: 'Failed to get business material usage' };
    }
}

/**
 * Search daily log materials - Cache-First
 */
export async function searchDailyLogMaterials(
    businessId: string,
    searchCriteria: {
        materialName?: string;
        supplier?: string;
        projectId?: string;
        minCost?: number;
        maxCost?: number;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }
): Promise<{ success: boolean; data?: DailyLogMaterial[]; error?: string }> {
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
        let query = db.dailyLogMaterials.where('business_id').equals(businessId);

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
        query = query.and(material => {
            // Material name filter (case-insensitive)
            if (searchCriteria.materialName) {
                const materialName = searchCriteria.materialName.toLowerCase();
                if (!material.name.toLowerCase().includes(materialName)) {
                    return false;
                }
            }

            // Supplier filter (case-insensitive)
            if (searchCriteria.supplier) {
                const supplier = searchCriteria.supplier.toLowerCase();
                if (!material.supplier || !material.supplier.toLowerCase().includes(supplier)) {
                    return false;
                }
            }

            // Cost range filter
            if (searchCriteria.minCost !== undefined && material.cost !== null && material.cost < searchCriteria.minCost) {
                return false;
            }
            if (searchCriteria.maxCost !== undefined && material.cost !== null && material.cost > searchCriteria.maxCost) {
                return false;
            }

            // Project filter (via daily log IDs)
            if (dailyLogIds && !dailyLogIds.includes(material.daily_log_id)) {
                return false;
            }

            return true;
        });

        // Apply limit
        if (searchCriteria.limit) {
            query = query.limit(searchCriteria.limit);
        }

        const materials = await query.toArray();

        // If date filtering is needed, get the daily logs and filter
        if (searchCriteria.startDate || searchCriteria.endDate) {
            const dailyLogMap = new Map<string, string>(); // daily_log_id -> date

            const relevantDailyLogs = await db.dailyLogs
                .where('business_id')
                .equals(businessId)
                .toArray();

            relevantDailyLogs.forEach(log => {
                dailyLogMap.set(log.id, log.date);
            });

            const filteredMaterials = materials.filter(material => {
                const date = dailyLogMap.get(material.daily_log_id);
                if (!date) return false;

                if (searchCriteria.startDate && date < searchCriteria.startDate) return false;
                if (searchCriteria.endDate && date > searchCriteria.endDate) return false;

                return true;
            });

            return { success: true, data: filteredMaterials };
        }

        return { success: true, data: materials };
    } catch (error) {
        console.error('Error searching daily log materials:', error);
        return { success: false, error: 'Failed to search daily log materials' };
    }
}

/**
 * Get cost summary for materials - Cache-First
 */
export async function getMaterialCostSummary(
    businessId: string,
    startDate?: string,
    endDate?: string,
    projectId?: string
): Promise<{
    success: boolean; data?: {
        total_cost: number;
        total_items: number;
        average_cost_per_item: number;
        cost_by_material: Array<{
            material_name: string;
            total_cost: number;
            item_count: number;
            average_cost: number;
        }>;
    }; error?: string
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

        // Get daily logs for filtering
        let dailyLogsQuery = db.dailyLogs.where('business_id').equals(businessId);

        if (projectId) {
            dailyLogsQuery = dailyLogsQuery.and(log => log.project_id === projectId);
        }

        if (startDate || endDate) {
            dailyLogsQuery = dailyLogsQuery.and(log => {
                if (startDate && log.date < startDate) return false;
                if (endDate && log.date > endDate) return false;
                return true;
            });
        }

        const dailyLogs = await dailyLogsQuery.toArray();
        const dailyLogIds = dailyLogs.map(log => log.id);

        // Get materials for the filtered daily logs
        const materials = await db.dailyLogMaterials
            .where('business_id')
            .equals(businessId)
            .and(material => dailyLogIds.includes(material.daily_log_id))
            .toArray();

        // Calculate summary
        let totalCost = 0;
        let totalItems = 0;
        const costByMaterial = new Map<string, { total_cost: number; item_count: number }>();

        for (const material of materials) {
            const cost = material.cost || 0;
            totalCost += cost;
            totalItems += 1;

            const key = material.name.toLowerCase();
            if (!costByMaterial.has(key)) {
                costByMaterial.set(key, { total_cost: 0, item_count: 0 });
            }
            const materialSummary = costByMaterial.get(key)!;
            materialSummary.total_cost += cost;
            materialSummary.item_count += 1;
        }

        const result = {
            total_cost: totalCost,
            total_items: totalItems,
            average_cost_per_item: totalItems > 0 ? totalCost / totalItems : 0,
            cost_by_material: Array.from(costByMaterial.entries()).map(([name, data]) => ({
                material_name: name,
                total_cost: data.total_cost,
                item_count: data.item_count,
                average_cost: data.item_count > 0 ? data.total_cost / data.item_count : 0
            })).sort((a, b) => b.total_cost - a.total_cost) // Sort by total cost descending
        };

        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting material cost summary:', error);
        return { success: false, error: 'Failed to get material cost summary' };
    }
}
