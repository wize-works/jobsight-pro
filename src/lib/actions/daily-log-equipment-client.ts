/**
 * Client-Side Daily Log Equipment Actions
 * 
 * Replaces src/app/actions/daily-log-equipment.ts with offline-first implementation.
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

// Extract Supabase types for daily log equipment
type DailyLogEquipment = Database['public']['Tables']['daily_log_equipment']['Row'];
type DailyLogEquipmentInsert = Database['public']['Tables']['daily_log_equipment']['Insert'];
type DailyLogEquipmentUpdate = Partial<Database['public']['Tables']['daily_log_equipment']['Update']> & { id: string };

// Create client-side daily log equipment actions
const insertDailyLogEquipment = createInsertAction('daily_log_equipment', 'high');
const updateDailyLogEquipment = createUpdateAction('daily_log_equipment', 'high');
const deleteDailyLogEquipment = createDeleteAction('daily_log_equipment', 'high');
const selectDailyLogEquipment = createSelectAction('daily_log_equipment');

/**
 * Get all daily log equipment for a business - works offline
 */
export const getDailyLogEquipments = async (businessId: string): Promise<DailyLogEquipment[]> => {
    try {
        const result = await selectDailyLogEquipment({}, businessId);

        if (result.error) {
            console.error("Error fetching daily log equipment:", result.error);
            return [];
        }

        return (result.data || []) as DailyLogEquipment[];
    } catch (err) {
        console.error("Error in getDailyLogEquipments:", err);
        return [];
    }
};

/**
 * Get daily log equipment by ID - works offline
 */
export const getDailyLogEquipmentById = async (businessId: string, id: string): Promise<DailyLogEquipment | null> => {
    try {
        const result = await selectDailyLogEquipment({ id }, businessId);

        if (result.error) {
            console.error("Error fetching daily log equipment:", result.error);
            return null;
        }

        const equipment = (result.data || []) as DailyLogEquipment[];
        return equipment.length > 0 ? equipment[0] : null;
    } catch (err) {
        console.error("Error in getDailyLogEquipmentById:", err);
        return null;
    }
};

/**
 * Create new daily log equipment - works offline
 */
export const createDailyLogEquipment = async (
    businessId: string,
    equipment: Omit<DailyLogEquipmentInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<DailyLogEquipment | null> => {
    try {
        const newEquipment: DailyLogEquipmentInsert = {
            ...equipment,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertDailyLogEquipment(newEquipment, businessId);

        if (result.error) {
            console.error("Error creating daily log equipment:", result.error);
            return null;
        }

        return result.data as DailyLogEquipment;
    } catch (err) {
        console.error("Error in createDailyLogEquipment:", err);
        return null;
    }
};

/**
 * Update daily log equipment - works offline
 */
export const updateDailyLogEquipmentById = async (
    businessId: string,
    id: string,
    updates: Partial<DailyLogEquipmentUpdate>
): Promise<DailyLogEquipment | null> => {
    try {
        const updateData: DailyLogEquipmentUpdate = {
            ...updates,
            id,
            updated_at: new Date().toISOString()
        };

        const result = await updateDailyLogEquipment(updateData, businessId);

        if (result.error) {
            console.error("Error updating daily log equipment:", result.error);
            return null;
        }

        return result.data as DailyLogEquipment;
    } catch (err) {
        console.error("Error in updateDailyLogEquipmentById:", err);
        return null;
    }
};

/**
 * Delete daily log equipment - works offline
 */
export const deleteDailyLogEquipmentById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteDailyLogEquipment({ id }, businessId);

        if (result.error) {
            console.error("Error deleting daily log equipment:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteDailyLogEquipmentById:", err);
        return false;
    }
};

/**
 * Get daily log equipment by daily log ID - works offline
 */
export const getDailyLogEquipmentByLogId = async (businessId: string, dailyLogId: string): Promise<DailyLogEquipment[]> => {
    try {
        const allEquipment = await getDailyLogEquipments(businessId);
        return allEquipment.filter(eq => eq.daily_log_id === dailyLogId);
    } catch (err) {
        console.error("Error in getDailyLogEquipmentByLogId:", err);
        return [];
    }
};

/**
 * Get daily log equipment by equipment ID - works offline
 */
export const getDailyLogEquipmentByEquipmentId = async (businessId: string, equipmentId: string): Promise<DailyLogEquipment[]> => {
    try {
        const allEquipment = await getDailyLogEquipments(businessId);
        return allEquipment.filter(eq => eq.equipment_id === equipmentId);
    } catch (err) {
        console.error("Error in getDailyLogEquipmentByEquipmentId:", err);
        return [];
    }
};

/**
 * Get daily log equipment by operator - works offline
 */
export const getDailyLogEquipmentByOperator = async (businessId: string, operator: string): Promise<DailyLogEquipment[]> => {
    try {
        const allEquipment = await getDailyLogEquipments(businessId);
        return allEquipment.filter(eq => eq.operator === operator);
    } catch (err) {
        console.error("Error in getDailyLogEquipmentByOperator:", err);
        return [];
    }
};

/**
 * Get daily log equipment by crew member - works offline
 */
export const getDailyLogEquipmentByCrewMember = async (businessId: string, crewMemberId: string): Promise<DailyLogEquipment[]> => {
    try {
        const allEquipment = await getDailyLogEquipments(businessId);
        return allEquipment.filter(eq => eq.crew_member_id === crewMemberId);
    } catch (err) {
        console.error("Error in getDailyLogEquipmentByCrewMember:", err);
        return [];
    }
};

/**
 * Get equipment usage statistics - works offline
 */
export const getDailyLogEquipmentStats = async (businessId: string): Promise<{
    totalEntries: number;
    totalHours: number;
    averageHours: number;
    byEquipment: Record<string, { entries: number; hours: number }>;
    byOperator: Record<string, { entries: number; hours: number }>;
    byCondition: Record<string, number>;
}> => {
    try {
        const equipment = await getDailyLogEquipments(businessId);

        const byEquipment: Record<string, { entries: number; hours: number }> = {};
        const byOperator: Record<string, { entries: number; hours: number }> = {};
        const byCondition: Record<string, number> = {};

        let totalHours = 0;

        equipment.forEach(eq => {
            // Track by equipment
            const eqId = eq.equipment_id;
            if (!byEquipment[eqId]) byEquipment[eqId] = { entries: 0, hours: 0 };
            byEquipment[eqId].entries++;
            byEquipment[eqId].hours += eq.hours || 0;

            // Track by operator
            const operator = eq.operator || 'Unknown';
            if (!byOperator[operator]) byOperator[operator] = { entries: 0, hours: 0 };
            byOperator[operator].entries++;
            byOperator[operator].hours += eq.hours || 0;

            // Track by condition
            const condition = eq.condition || 'Unknown';
            byCondition[condition] = (byCondition[condition] || 0) + 1;

            totalHours += eq.hours || 0;
        });

        return {
            totalEntries: equipment.length,
            totalHours,
            averageHours: equipment.length > 0 ? totalHours / equipment.length : 0,
            byEquipment,
            byOperator,
            byCondition
        };
    } catch (err) {
        console.error("Error in getDailyLogEquipmentStats:", err);
        return {
            totalEntries: 0,
            totalHours: 0,
            averageHours: 0,
            byEquipment: {},
            byOperator: {},
            byCondition: {}
        };
    }
};

/**
 * Get equipment usage for date range - works offline
 */
export const getDailyLogEquipmentForDateRange = async (
    businessId: string,
    startDate: string,
    endDate: string
): Promise<DailyLogEquipment[]> => {
    try {
        const allEquipment = await getDailyLogEquipments(businessId);
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return allEquipment.filter(eq => {
            if (!eq.created_at) return false;
            const eqDate = new Date(eq.created_at).getTime();
            return eqDate >= start && eqDate <= end;
        });
    } catch (err) {
        console.error("Error in getDailyLogEquipmentForDateRange:", err);
        return [];
    }
};

/**
 * Bulk create daily log equipment entries - works offline
 */
export const bulkCreateDailyLogEquipment = async (
    businessId: string,
    equipmentEntries: Omit<DailyLogEquipmentInsert, 'id' | 'business_id' | 'created_at' | 'updated_at'>[]
): Promise<DailyLogEquipment[]> => {
    try {
        const createPromises = equipmentEntries.map(entry =>
            createDailyLogEquipment(businessId, {
                ...entry,
                business_id: businessId
            })
        );

        const results = await Promise.all(createPromises);
        return results.filter(result => result !== null) as DailyLogEquipment[];
    } catch (err) {
        console.error("Error in bulkCreateDailyLogEquipment:", err);
        return [];
    }
};

/**
 * Validate daily log equipment data
 */
export const validateDailyLogEquipment = (equipment: Partial<DailyLogEquipmentInsert>): string[] => {
    const errors: string[] = [];

    if (!equipment.daily_log_id || equipment.daily_log_id.trim().length === 0) {
        errors.push('Daily log ID is required');
    }

    if (!equipment.equipment_id || equipment.equipment_id.trim().length === 0) {
        errors.push('Equipment ID is required');
    }

    if (equipment.hours !== null && equipment.hours !== undefined) {
        if (equipment.hours < 0) {
            errors.push('Hours cannot be negative');
        }
        if (equipment.hours > 24) {
            errors.push('Hours cannot exceed 24 in a day');
        }
    }

    const validConditions = ['excellent', 'good', 'fair', 'poor', 'needs_repair'];
    if (equipment.condition && !validConditions.includes(equipment.condition)) {
        errors.push(`Invalid condition. Must be one of: ${validConditions.join(', ')}`);
    }

    return errors;
};
