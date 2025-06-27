/**
 * Client-Side Equipment Usage Actions
 * 
 * Replaces src/app/actions/equipment-usage.ts with offline-first implementation.
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

// Extract Supabase types for equipment usage
type EquipmentUsage = Database['public']['Tables']['equipment_usage']['Row'];
type EquipmentUsageInsert = Database['public']['Tables']['equipment_usage']['Insert'];
type EquipmentUsageUpdate = Database['public']['Tables']['equipment_usage']['Update'];

// Create client-side equipment usage actions
const insertEquipmentUsage = createInsertAction('equipment_usage', 'medium');
const updateEquipmentUsage = createUpdateAction('equipment_usage', 'medium');
const deleteEquipmentUsage = createDeleteAction('equipment_usage', 'medium');
const selectEquipmentUsage = createSelectAction('equipment_usage');

/**
 * Get all equipment usage records for a business - works offline
 */
export const getEquipmentUsage = async (businessId: string, equipmentId?: string, projectId?: string): Promise<EquipmentUsage[]> => {
    try {
        const result = await selectEquipmentUsage({}, businessId);

        if (result.error) {
            console.error("Error fetching equipment usage:", result.error);
            return [];
        }

        let usage = (result.data || []) as EquipmentUsage[];

        // Filter by equipment_id if provided
        if (equipmentId) {
            usage = usage.filter(record => record.equipment_id === equipmentId);
        }

        // Filter by project_id if provided
        if (projectId) {
            usage = usage.filter(record => record.project_id === projectId);
        }

        return usage;
    } catch (err) {
        console.error("Error in getEquipmentUsage:", err);
        return [];
    }
};

/**
 * Create a new equipment usage record - works offline
 */
export const createEquipmentUsage = async (data: EquipmentUsageInsert & { id?: string }): Promise<EquipmentUsage | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for equipment usage');
        }

        const usageData = {
            ...data,
            id: data.id || uuidv4(),
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            hours_used: data.hours_used || 0,
            fuel_consumed: data.fuel_consumed || 0,
        };

        const result = await insertEquipmentUsage(usageData, data.business_id);

        if (result.error) {
            console.error("Error creating equipment usage:", result.error);
            return null;
        }

        return result.data as EquipmentUsage;
    } catch (err) {
        console.error("Error in createEquipmentUsage:", err);
        return null;
    }
};

/**
 * Update an equipment usage record - works offline
 */
export const updateEquipmentUsageById = async (id: string, data: Partial<EquipmentUsageUpdate>, businessId: string): Promise<EquipmentUsage | null> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateEquipmentUsage(updateData, businessId);

        if (result.error) {
            console.error("Error updating equipment usage:", result.error);
            return null;
        }

        return result.data as EquipmentUsage;
    } catch (err) {
        console.error("Error in updateEquipmentUsageById:", err);
        return null;
    }
};

/**
 * Delete an equipment usage record - works offline
 */
export const removeEquipmentUsage = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteEquipmentUsage({ id }, businessId);

        if (result.error) {
            console.error("Error deleting equipment usage:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeEquipmentUsage:", err);
        return false;
    }
};

/**
 * Get an equipment usage record by ID - works offline
 */
export const getEquipmentUsageById = async (id: string, businessId: string): Promise<EquipmentUsage | null> => {
    try {
        const usage = await getEquipmentUsage(businessId);
        return usage.find(record => record.id === id) || null;
    } catch (err) {
        console.error("Error in getEquipmentUsageById:", err);
        return null;
    }
};

/**
 * Get usage records for specific equipment - works offline
 */
export const getUsageByEquipmentId = async (businessId: string, equipmentId: string): Promise<EquipmentUsage[]> => {
    return await getEquipmentUsage(businessId, equipmentId);
};

/**
 * Get usage records for specific project - works offline
 */
export const getUsageByProjectId = async (businessId: string, projectId: string): Promise<EquipmentUsage[]> => {
    return await getEquipmentUsage(businessId, undefined, projectId);
};

/**
 * Get usage records for specific date range - works offline
 */
export const getUsageByDateRange = async (businessId: string, startDate: string, endDate: string): Promise<EquipmentUsage[]> => {
    try {
        const usage = await getEquipmentUsage(businessId);
        return usage.filter(record => {
            if (!record.start_date) return false;
            const recordDate = new Date(record.start_date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return recordDate >= start && recordDate <= end;
        });
    } catch (err) {
        console.error("Error in getUsageByDateRange:", err);
        return [];
    }
};

// Bulk operations for equipment usage
export const createMultipleUsageRecords = async (usageRecords: (EquipmentUsageInsert & { id?: string })[]): Promise<EquipmentUsage[]> => {
    const results: EquipmentUsage[] = [];
    for (const record of usageRecords) {
        try {
            const result = await createEquipmentUsage(record);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            console.error('Error creating equipment usage record:', error);
        }
    }
    return results;
};

export const deleteUsageByEquipmentId = async (businessId: string, equipmentId: string): Promise<boolean[]> => {
    const usage = await getUsageByEquipmentId(businessId, equipmentId);
    const deletePromises = usage.map(record => removeEquipmentUsage(record.id, businessId));
    return await Promise.all(deletePromises);
};

export const deleteUsageByProjectId = async (businessId: string, projectId: string): Promise<boolean[]> => {
    const usage = await getUsageByProjectId(businessId, projectId);
    const deletePromises = usage.map(record => removeEquipmentUsage(record.id, businessId));
    return await Promise.all(deletePromises);
};

// Analytics and reporting functions
export const getEquipmentUsageStats = async (businessId: string, equipmentId?: string): Promise<{
    totalRecords: number;
    totalHours: number;
    totalFuelConsumed: number;
    averageHoursPerDay: number;
    averageFuelPerHour: number;
    usageByProject: Record<string, { hours: number; fuel: number }>;
}> => {
    try {
        const usage = await getEquipmentUsage(businessId, equipmentId);

        const stats = {
            totalRecords: usage.length,
            totalHours: usage.reduce((sum, record) => sum + (record.hours_used || 0), 0),
            totalFuelConsumed: usage.reduce((sum, record) => sum + (record.fuel_consumed || 0), 0),
            averageHoursPerDay: 0,
            averageFuelPerHour: 0,
            usageByProject: {} as Record<string, { hours: number; fuel: number }>,
        };

        // Calculate averages
        if (stats.totalRecords > 0) {
            stats.averageHoursPerDay = stats.totalHours / stats.totalRecords;
        }
        if (stats.totalHours > 0) {
            stats.averageFuelPerHour = stats.totalFuelConsumed / stats.totalHours;
        }

        // Group by project
        usage.forEach(record => {
            const projectId = record.project_id || 'No Project';
            if (!stats.usageByProject[projectId]) {
                stats.usageByProject[projectId] = { hours: 0, fuel: 0 };
            }
            stats.usageByProject[projectId].hours += record.hours_used || 0;
            stats.usageByProject[projectId].fuel += record.fuel_consumed || 0;
        });

        return stats;
    } catch (error) {
        console.error('Failed to get equipment usage stats:', error);
        return {
            totalRecords: 0,
            totalHours: 0,
            totalFuelConsumed: 0,
            averageHoursPerDay: 0,
            averageFuelPerHour: 0,
            usageByProject: {},
        };
    }
};

// Get current active usage (equipment currently in use)
export const getActiveEquipmentUsage = async (businessId: string): Promise<EquipmentUsage[]> => {
    try {
        const usage = await getEquipmentUsage(businessId);
        const now = new Date();

        return usage.filter(record => {
            if (!record.start_date) return false;
            const startDate = new Date(record.start_date);
            const endDate = record.end_date ? new Date(record.end_date) : null;

            return startDate <= now && (!endDate || endDate >= now);
        });
    } catch (err) {
        console.error("Error in getActiveEquipmentUsage:", err);
        return [];
    }
};

// Get equipment utilization percentage for a date range
export const getEquipmentUtilization = async (businessId: string, equipmentId: string, startDate: string, endDate: string): Promise<number> => {
    try {
        const usage = await getEquipmentUsage(businessId, equipmentId);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        const hoursInRange = usage
            .filter(record => {
                if (!record.start_date) return false;
                const recordDate = new Date(record.start_date);
                return recordDate >= start && recordDate <= end;
            })
            .reduce((sum, record) => sum + (record.hours_used || 0), 0);

        const maxPossibleHours = totalDays * 24; // Assuming 24 hours per day max
        return maxPossibleHours > 0 ? (hoursInRange / maxPossibleHours) * 100 : 0;
    } catch (error) {
        console.error('Failed to calculate equipment utilization:', error);
        return 0;
    }
};

// Export compatibility functions for existing code
export {
    getEquipmentUsage as getAllEquipmentUsage,
    createEquipmentUsage as addEquipmentUsage,
    removeEquipmentUsage as deleteEquipmentUsage,
    getEquipmentUsageById as fetchEquipmentUsage,
};
