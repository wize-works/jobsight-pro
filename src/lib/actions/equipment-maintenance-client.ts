/**
 * Client-Side Equipment Maintenance Actions
 * 
 * Replaces src/app/actions/equipment-maintenance.ts with offline-first implementation.
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

// Extract Supabase types for equipment maintenance
type EquipmentMaintenance = Database['public']['Tables']['equipment_maintenance']['Row'];
type EquipmentMaintenanceInsert = Database['public']['Tables']['equipment_maintenance']['Insert'];
type EquipmentMaintenanceUpdate = Partial<Database['public']['Tables']['equipment_maintenance']['Update']> & { id: string };

// Create client-side equipment maintenance actions
const insertEquipmentMaintenance = createInsertAction('equipment_maintenance', 'high');
const updateEquipmentMaintenance = createUpdateAction('equipment_maintenance', 'high');
const deleteEquipmentMaintenance = createDeleteAction('equipment_maintenance', 'high');
const selectEquipmentMaintenance = createSelectAction('equipment_maintenance');

/**
 * Get all equipment maintenance records for a business - works offline
 */
export const getEquipmentMaintenanceRecords = async (businessId: string): Promise<EquipmentMaintenance[]> => {
    try {
        const result = await selectEquipmentMaintenance({}, businessId);

        if (result.error) {
            console.error("Error fetching equipment maintenance records:", result.error);
            return [];
        }

        return (result.data || []) as EquipmentMaintenance[];
    } catch (err) {
        console.error("Error in getEquipmentMaintenanceRecords:", err);
        return [];
    }
};

/**
 * Get equipment maintenance record by ID - works offline
 */
export const getEquipmentMaintenanceById = async (businessId: string, id: string): Promise<EquipmentMaintenance | null> => {
    try {
        const result = await selectEquipmentMaintenance({ id }, businessId);

        if (result.error) {
            console.error("Error fetching equipment maintenance record:", result.error);
            return null;
        }

        const records = (result.data || []) as EquipmentMaintenance[];
        return records.length > 0 ? records[0] : null;
    } catch (err) {
        console.error("Error in getEquipmentMaintenanceById:", err);
        return null;
    }
};

/**
 * Create new equipment maintenance record - works offline
 */
export const createEquipmentMaintenance = async (
    businessId: string,
    maintenance: Omit<EquipmentMaintenanceInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<EquipmentMaintenance | null> => {
    try {
        const newMaintenance: EquipmentMaintenanceInsert = {
            ...maintenance,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertEquipmentMaintenance(newMaintenance, businessId);

        if (result.error) {
            console.error("Error creating equipment maintenance record:", result.error);
            return null;
        }

        return result.data as EquipmentMaintenance;
    } catch (err) {
        console.error("Error in createEquipmentMaintenance:", err);
        return null;
    }
};

/**
 * Update equipment maintenance record - works offline
 */
export const updateEquipmentMaintenanceById = async (
    businessId: string,
    id: string,
    updates: Partial<EquipmentMaintenanceUpdate>
): Promise<EquipmentMaintenance | null> => {
    try {
        const updateData: EquipmentMaintenanceUpdate = {
            ...updates,
            id,
            updated_at: new Date().toISOString()
        };

        const result = await updateEquipmentMaintenance(updateData, businessId);

        if (result.error) {
            console.error("Error updating equipment maintenance record:", result.error);
            return null;
        }

        return result.data as EquipmentMaintenance;
    } catch (err) {
        console.error("Error in updateEquipmentMaintenanceById:", err);
        return null;
    }
};

/**
 * Delete equipment maintenance record - works offline
 */
export const deleteEquipmentMaintenanceById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteEquipmentMaintenance({ id }, businessId);

        if (result.error) {
            console.error("Error deleting equipment maintenance record:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteEquipmentMaintenanceById:", err);
        return false;
    }
};

/**
 * Get maintenance records by equipment ID - works offline
 */
export const getEquipmentMaintenanceByEquipmentId = async (businessId: string, equipmentId: string): Promise<EquipmentMaintenance[]> => {
    try {
        const allRecords = await getEquipmentMaintenanceRecords(businessId);
        return allRecords.filter(record => record.equipment_id === equipmentId);
    } catch (err) {
        console.error("Error in getEquipmentMaintenanceByEquipmentId:", err);
        return [];
    }
};

/**
 * Get maintenance records by status - works offline
 */
export const getEquipmentMaintenanceByStatus = async (businessId: string, status: string): Promise<EquipmentMaintenance[]> => {
    try {
        const allRecords = await getEquipmentMaintenanceRecords(businessId);
        return allRecords.filter(record => record.maintenance_status === status);
    } catch (err) {
        console.error("Error in getEquipmentMaintenanceByStatus:", err);
        return [];
    }
};

/**
 * Get maintenance records by type - works offline
 */
export const getEquipmentMaintenanceByType = async (businessId: string, type: string): Promise<EquipmentMaintenance[]> => {
    try {
        const allRecords = await getEquipmentMaintenanceRecords(businessId);
        return allRecords.filter(record => record.maintenance_type === type);
    } catch (err) {
        console.error("Error in getEquipmentMaintenanceByType:", err);
        return [];
    }
};

/**
 * Get maintenance records by technician - works offline
 */
export const getEquipmentMaintenanceByTechnician = async (businessId: string, technician: string): Promise<EquipmentMaintenance[]> => {
    try {
        const allRecords = await getEquipmentMaintenanceRecords(businessId);
        return allRecords.filter(record => record.technician === technician);
    } catch (err) {
        console.error("Error in getEquipmentMaintenanceByTechnician:", err);
        return [];
    }
};

/**
 * Get scheduled maintenance (upcoming) - works offline
 */
export const getScheduledMaintenance = async (businessId: string): Promise<EquipmentMaintenance[]> => {
    try {
        const allRecords = await getEquipmentMaintenanceRecords(businessId);
        const now = new Date();

        return allRecords.filter(record => {
            if (!record.maintenance_date) return false;
            const maintenanceDate = new Date(record.maintenance_date);
            return maintenanceDate >= now && record.maintenance_status === 'scheduled';
        });
    } catch (err) {
        console.error("Error in getScheduledMaintenance:", err);
        return [];
    }
};

/**
 * Get overdue maintenance - works offline
 */
export const getOverdueMaintenance = async (businessId: string): Promise<EquipmentMaintenance[]> => {
    try {
        const allRecords = await getEquipmentMaintenanceRecords(businessId);
        const now = new Date();

        return allRecords.filter(record => {
            if (!record.maintenance_date) return false;
            const maintenanceDate = new Date(record.maintenance_date);
            return maintenanceDate < now && ['scheduled', 'in_progress'].includes(record.maintenance_status || '');
        });
    } catch (err) {
        console.error("Error in getOverdueMaintenance:", err);
        return [];
    }
};

/**
 * Get maintenance records for date range - works offline
 */
export const getEquipmentMaintenanceForDateRange = async (
    businessId: string,
    startDate: string,
    endDate: string
): Promise<EquipmentMaintenance[]> => {
    try {
        const allRecords = await getEquipmentMaintenanceRecords(businessId);
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return allRecords.filter(record => {
            if (!record.maintenance_date) return false;
            const maintenanceDate = new Date(record.maintenance_date).getTime();
            return maintenanceDate >= start && maintenanceDate <= end;
        });
    } catch (err) {
        console.error("Error in getEquipmentMaintenanceForDateRange:", err);
        return [];
    }
};

/**
 * Search maintenance records - works offline
 */
export const searchEquipmentMaintenance = async (businessId: string, query: string): Promise<EquipmentMaintenance[]> => {
    try {
        const allRecords = await getEquipmentMaintenanceRecords(businessId);
        const searchTerm = query.toLowerCase();

        return allRecords.filter((record: EquipmentMaintenance) =>
            record.description?.toLowerCase().includes(searchTerm) ||
            record.technician?.toLowerCase().includes(searchTerm) ||
            record.maintenance_type?.toLowerCase().includes(searchTerm) ||
            record.notes?.toLowerCase().includes(searchTerm)
        );
    } catch (err) {
        console.error("Error in searchEquipmentMaintenance:", err);
        return [];
    }
};

/**
 * Complete maintenance record - works offline
 */
export const completeEquipmentMaintenance = async (businessId: string, maintenanceId: string, notes?: string): Promise<boolean> => {
    try {
        const updated = await updateEquipmentMaintenanceById(businessId, maintenanceId, {
            maintenance_status: 'completed',
            date: new Date().toISOString(),
            notes: notes || undefined
        });

        return updated !== null;
    } catch (err) {
        console.error("Error in completeEquipmentMaintenance:", err);
        return false;
    }
};

/**
 * Schedule maintenance - works offline
 */
export const scheduleEquipmentMaintenance = async (
    businessId: string,
    equipmentId: string,
    maintenanceType: string,
    scheduledDate: string,
    technician?: string,
    description?: string
): Promise<EquipmentMaintenance | null> => {
    try {
        return await createEquipmentMaintenance(businessId, {
            equipment_id: equipmentId,
            maintenance_type: maintenanceType,
            maintenance_date: scheduledDate,
            maintenance_status: 'scheduled',
            technician: technician || null,
            description: description || null,
            business_id: businessId,
            cost: null,
            date: null,
            notes: null,
            created_by: null,
            updated_by: null
        });
    } catch (err) {
        console.error("Error in scheduleEquipmentMaintenance:", err);
        return null;
    }
};

/**
 * Get maintenance statistics - works offline
 */
export const getEquipmentMaintenanceStats = async (businessId: string): Promise<{
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    overdue: number;
    totalCost: number;
    averageCost: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byEquipment: Record<string, number>;
    byTechnician: Record<string, number>;
}> => {
    try {
        const records = await getEquipmentMaintenanceRecords(businessId);
        const now = new Date();

        const byStatus: Record<string, number> = {};
        const byType: Record<string, number> = {};
        const byEquipment: Record<string, number> = {};
        const byTechnician: Record<string, number> = {};

        let scheduled = 0;
        let inProgress = 0;
        let completed = 0;
        let overdue = 0;
        let totalCost = 0;
        let costCount = 0;

        records.forEach(record => {
            // Track by status
            const status = record.maintenance_status || 'unknown';
            byStatus[status] = (byStatus[status] || 0) + 1;

            // Track by type
            const type = record.maintenance_type || 'unknown';
            byType[type] = (byType[type] || 0) + 1;

            // Track by equipment
            byEquipment[record.equipment_id] = (byEquipment[record.equipment_id] || 0) + 1;

            // Track by technician
            const technician = record.technician || 'unassigned';
            byTechnician[technician] = (byTechnician[technician] || 0) + 1;

            // Count by status
            switch (status) {
                case 'scheduled':
                    scheduled++;
                    // Check if overdue
                    if (record.maintenance_date && new Date(record.maintenance_date) < now) {
                        overdue++;
                    }
                    break;
                case 'in_progress':
                    inProgress++;
                    // Check if overdue
                    if (record.maintenance_date && new Date(record.maintenance_date) < now) {
                        overdue++;
                    }
                    break;
                case 'completed':
                    completed++;
                    break;
            }

            // Track costs
            if (record.cost !== null && record.cost !== undefined) {
                totalCost += record.cost;
                costCount++;
            }
        });

        return {
            total: records.length,
            scheduled,
            inProgress,
            completed,
            overdue,
            totalCost,
            averageCost: costCount > 0 ? totalCost / costCount : 0,
            byStatus,
            byType,
            byEquipment,
            byTechnician
        };
    } catch (err) {
        console.error("Error in getEquipmentMaintenanceStats:", err);
        return {
            total: 0,
            scheduled: 0,
            inProgress: 0,
            completed: 0,
            overdue: 0,
            totalCost: 0,
            averageCost: 0,
            byStatus: {},
            byType: {},
            byEquipment: {},
            byTechnician: {}
        };
    }
};

/**
 * Get maintenance schedule for equipment - works offline
 */
export const getEquipmentMaintenanceSchedule = async (businessId: string, equipmentId: string): Promise<{
    upcoming: EquipmentMaintenance[];
    overdue: EquipmentMaintenance[];
    completed: EquipmentMaintenance[];
    nextMaintenanceDate: string | null;
}> => {
    try {
        const records = await getEquipmentMaintenanceByEquipmentId(businessId, equipmentId);
        const now = new Date();

        const upcoming = records.filter(r =>
            r.maintenance_date &&
            new Date(r.maintenance_date) >= now &&
            r.maintenance_status === 'scheduled'
        );

        const overdue = records.filter(r =>
            r.maintenance_date &&
            new Date(r.maintenance_date) < now &&
            ['scheduled', 'in_progress'].includes(r.maintenance_status || '')
        );

        const completed = records.filter(r => r.maintenance_status === 'completed');

        // Find next maintenance date
        const nextMaintenance = upcoming
            .sort((a, b) => new Date(a.maintenance_date!).getTime() - new Date(b.maintenance_date!).getTime())[0];

        return {
            upcoming,
            overdue,
            completed,
            nextMaintenanceDate: nextMaintenance?.maintenance_date || null
        };
    } catch (err) {
        console.error("Error in getEquipmentMaintenanceSchedule:", err);
        return {
            upcoming: [],
            overdue: [],
            completed: [],
            nextMaintenanceDate: null
        };
    }
};

/**
 * Validate equipment maintenance data
 */
export const validateEquipmentMaintenance = (maintenance: Partial<EquipmentMaintenanceInsert>): string[] => {
    const errors: string[] = [];

    if (!maintenance.equipment_id || maintenance.equipment_id.trim().length === 0) {
        errors.push('Equipment ID is required');
    }

    if (!maintenance.maintenance_type || maintenance.maintenance_type.trim().length === 0) {
        errors.push('Maintenance type is required');
    }

    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (maintenance.maintenance_status && !validStatuses.includes(maintenance.maintenance_status)) {
        errors.push(`Invalid maintenance status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const validTypes = ['preventive', 'corrective', 'predictive', 'inspection', 'repair', 'service'];
    if (maintenance.maintenance_type && !validTypes.includes(maintenance.maintenance_type)) {
        errors.push(`Invalid maintenance type. Must be one of: ${validTypes.join(', ')}`);
    }

    if (maintenance.cost !== null && maintenance.cost !== undefined && maintenance.cost < 0) {
        errors.push('Maintenance cost cannot be negative');
    }

    return errors;
};
