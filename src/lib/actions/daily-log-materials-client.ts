/**
 * Client-Side Daily Log Materials Actions
 * 
 * Replaces src/app/actions/daily-log-materials.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for daily log materials
type DailyLogMaterial = Database['public']['Tables']['daily_log_materials']['Row'];
type DailyLogMaterialInsert = Database['public']['Tables']['daily_log_materials']['Insert'];
type DailyLogMaterialUpdate = Partial<Database['public']['Tables']['daily_log_materials']['Update']> & { id: string };

// Create client-side daily log material actions
const insertDailyLogMaterial = createInsertAction('daily_log_materials', 'high');
const updateDailyLogMaterial = createUpdateAction('daily_log_materials', 'high');
const deleteDailyLogMaterial = createDeleteAction('daily_log_materials', 'high');
const selectDailyLogMaterial = createSelectAction('daily_log_materials');

/**
 * Get all daily log materials for a business - works offline
 */
export const getDailyLogMaterials = async (businessId: string): Promise<DailyLogMaterial[]> => {
    try {
        const result = await selectDailyLogMaterial({}, businessId);

        if (result.error) {
            console.error("Error fetching daily log materials:", result.error);
            return [];
        }

        return (result.data || []) as DailyLogMaterial[];
    } catch (err) {
        console.error("Error in getDailyLogMaterials:", err);
        return [];
    }
};

/**
 * Get daily log material by ID - works offline
 */
export const getDailyLogMaterialById = async (businessId: string, id: string): Promise<DailyLogMaterial | null> => {
    try {
        const result = await selectDailyLogMaterial({ id }, businessId);

        if (result.error) {
            console.error("Error fetching daily log material:", result.error);
            return null;
        }

        const materials = (result.data || []) as DailyLogMaterial[];
        return materials.length > 0 ? materials[0] : null;
    } catch (err) {
        console.error("Error in getDailyLogMaterialById:", err);
        return null;
    }
};

/**
 * Create new daily log material - works offline
 */
export const createDailyLogMaterial = async (
    businessId: string,
    material: Omit<DailyLogMaterialInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<DailyLogMaterial | null> => {
    try {
        const newMaterial: DailyLogMaterialInsert = {
            ...material,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertDailyLogMaterial(newMaterial, businessId);

        if (result.error) {
            console.error("Error creating daily log material:", result.error);
            return null;
        }

        return result.data as DailyLogMaterial;
    } catch (err) {
        console.error("Error in createDailyLogMaterial:", err);
        return null;
    }
};

/**
 * Update daily log material - works offline
 */
export const updateDailyLogMaterialById = async (
    businessId: string,
    id: string,
    updates: Partial<DailyLogMaterialUpdate>
): Promise<DailyLogMaterial | null> => {
    try {
        const updateData: DailyLogMaterialUpdate = {
            ...updates,
            id,
            updated_at: new Date().toISOString()
        };

        const result = await updateDailyLogMaterial(updateData, businessId);

        if (result.error) {
            console.error("Error updating daily log material:", result.error);
            return null;
        }

        return result.data as DailyLogMaterial;
    } catch (err) {
        console.error("Error in updateDailyLogMaterialById:", err);
        return null;
    }
};

/**
 * Delete daily log material - works offline
 */
export const deleteDailyLogMaterialById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteDailyLogMaterial({ id }, businessId);

        if (result.error) {
            console.error("Error deleting daily log material:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteDailyLogMaterialById:", err);
        return false;
    }
};

/**
 * Get daily log materials by daily log ID - works offline
 */
export const getDailyLogMaterialsByLogId = async (businessId: string, dailyLogId: string): Promise<DailyLogMaterial[]> => {
    try {
        const allMaterials = await getDailyLogMaterials(businessId);
        return allMaterials.filter(material => material.daily_log_id === dailyLogId);
    } catch (err) {
        console.error("Error in getDailyLogMaterialsByLogId:", err);
        return [];
    }
};

/**
 * Get daily log materials by supplier - works offline
 */
export const getDailyLogMaterialsBySupplier = async (businessId: string, supplier: string): Promise<DailyLogMaterial[]> => {
    try {
        const allMaterials = await getDailyLogMaterials(businessId);
        return allMaterials.filter(material => material.supplier === supplier);
    } catch (err) {
        console.error("Error in getDailyLogMaterialsBySupplier:", err);
        return [];
    }
};

/**
 * Search daily log materials by name - works offline
 */
export const searchDailyLogMaterials = async (businessId: string, query: string): Promise<DailyLogMaterial[]> => {
    try {
        const allMaterials = await getDailyLogMaterials(businessId);
        const searchTerm = query.toLowerCase();

        return allMaterials.filter((material: DailyLogMaterial) =>
            material.name?.toLowerCase().includes(searchTerm) ||
            material.supplier?.toLowerCase().includes(searchTerm) ||
            material.notes?.toLowerCase().includes(searchTerm)
        );
    } catch (err) {
        console.error("Error in searchDailyLogMaterials:", err);
        return [];
    }
};

/**
 * Get material usage statistics - works offline
 */
export const getDailyLogMaterialStats = async (businessId: string): Promise<{
    totalEntries: number;
    totalQuantity: number;
    totalCost: number;
    averageCost: number;
    byMaterial: Record<string, { quantity: number; cost: number; entries: number }>;
    bySupplier: Record<string, { quantity: number; cost: number; entries: number }>;
    topMaterials: Array<{ name: string; quantity: number; cost: number }>;
}> => {
    try {
        const materials = await getDailyLogMaterials(businessId);

        const byMaterial: Record<string, { quantity: number; cost: number; entries: number }> = {};
        const bySupplier: Record<string, { quantity: number; cost: number; entries: number }> = {};

        let totalQuantity = 0;
        let totalCost = 0;

        materials.forEach(material => {
            const quantity = material.quantity || 0;
            const cost = material.cost || 0;

            totalQuantity += quantity;
            totalCost += cost;

            // Track by material name
            if (!byMaterial[material.name]) {
                byMaterial[material.name] = { quantity: 0, cost: 0, entries: 0 };
            }
            byMaterial[material.name].quantity += quantity;
            byMaterial[material.name].cost += cost;
            byMaterial[material.name].entries++;

            // Track by supplier
            const supplier = material.supplier || 'Unknown';
            if (!bySupplier[supplier]) {
                bySupplier[supplier] = { quantity: 0, cost: 0, entries: 0 };
            }
            bySupplier[supplier].quantity += quantity;
            bySupplier[supplier].cost += cost;
            bySupplier[supplier].entries++;
        });

        // Get top materials by cost
        const topMaterials = Object.entries(byMaterial)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 10);

        return {
            totalEntries: materials.length,
            totalQuantity,
            totalCost,
            averageCost: materials.length > 0 ? totalCost / materials.length : 0,
            byMaterial,
            bySupplier,
            topMaterials
        };
    } catch (err) {
        console.error("Error in getDailyLogMaterialStats:", err);
        return {
            totalEntries: 0,
            totalQuantity: 0,
            totalCost: 0,
            averageCost: 0,
            byMaterial: {},
            bySupplier: {},
            topMaterials: []
        };
    }
};

/**
 * Get materials for date range - works offline
 */
export const getDailyLogMaterialsForDateRange = async (
    businessId: string,
    startDate: string,
    endDate: string
): Promise<DailyLogMaterial[]> => {
    try {
        const allMaterials = await getDailyLogMaterials(businessId);
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return allMaterials.filter(material => {
            if (!material.created_at) return false;
            const materialDate = new Date(material.created_at).getTime();
            return materialDate >= start && materialDate <= end;
        });
    } catch (err) {
        console.error("Error in getDailyLogMaterialsForDateRange:", err);
        return [];
    }
};

/**
 * Bulk create daily log materials - works offline
 */
export const bulkCreateDailyLogMaterials = async (
    businessId: string,
    materials: Omit<DailyLogMaterialInsert, 'id' | 'business_id' | 'created_at' | 'updated_at'>[]
): Promise<DailyLogMaterial[]> => {
    try {
        const createPromises = materials.map(material =>
            createDailyLogMaterial(businessId, {
                ...material,
                business_id: businessId
            })
        );

        const results = await Promise.all(createPromises);
        return results.filter(result => result !== null) as DailyLogMaterial[];
    } catch (err) {
        console.error("Error in bulkCreateDailyLogMaterials:", err);
        return [];
    }
};

/**
 * Get cost summary for a date range - works offline
 */
export const getDailyLogMaterialCostSummary = async (
    businessId: string,
    startDate: string,
    endDate: string
): Promise<{
    totalCost: number;
    materialCount: number;
    averageCostPerMaterial: number;
    costByDay: Record<string, number>;
}> => {
    try {
        const materials = await getDailyLogMaterialsForDateRange(businessId, startDate, endDate);
        const costByDay: Record<string, number> = {};
        let totalCost = 0;

        materials.forEach(material => {
            const cost = material.cost || 0;
            totalCost += cost;

            if (material.created_at) {
                const day = material.created_at.split('T')[0]; // Get YYYY-MM-DD
                costByDay[day] = (costByDay[day] || 0) + cost;
            }
        });

        return {
            totalCost,
            materialCount: materials.length,
            averageCostPerMaterial: materials.length > 0 ? totalCost / materials.length : 0,
            costByDay
        };
    } catch (err) {
        console.error("Error in getDailyLogMaterialCostSummary:", err);
        return {
            totalCost: 0,
            materialCount: 0,
            averageCostPerMaterial: 0,
            costByDay: {}
        };
    }
};

/**
 * Validate daily log material data
 */
export const validateDailyLogMaterial = (material: Partial<DailyLogMaterialInsert>): string[] => {
    const errors: string[] = [];

    if (!material.daily_log_id || material.daily_log_id.trim().length === 0) {
        errors.push('Daily log ID is required');
    }

    if (!material.name || material.name.trim().length === 0) {
        errors.push('Material name is required');
    }

    if (material.quantity !== null && material.quantity !== undefined && material.quantity < 0) {
        errors.push('Quantity cannot be negative');
    }

    if (material.cost !== null && material.cost !== undefined && material.cost < 0) {
        errors.push('Cost cannot be negative');
    }

    return errors;
};
