/**
 * Client-Side Equipment Assignments Actions
 * 
 * Replaces src/app/actions/equipment-assignments.ts with offline-first implementation.
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

// Extract Supabase types for equipment assignments
type EquipmentAssignment = Database['public']['Tables']['equipment_assignments']['Row'];
type EquipmentAssignmentInsert = Database['public']['Tables']['equipment_assignments']['Insert'];
type EquipmentAssignmentUpdate = Partial<Database['public']['Tables']['equipment_assignments']['Update']> & { id: string };

// Create client-side equipment assignment actions
const insertEquipmentAssignment = createInsertAction('equipment_assignments', 'high');
const updateEquipmentAssignment = createUpdateAction('equipment_assignments', 'high');
const deleteEquipmentAssignment = createDeleteAction('equipment_assignments', 'high');
const selectEquipmentAssignments = createSelectAction('equipment_assignments');

/**
 * Get all equipment assignments for a business - works offline
 */
export const getEquipmentAssignments = async (businessId: string): Promise<EquipmentAssignment[]> => {
    try {
        const result = await selectEquipmentAssignments({}, businessId);

        if (result.error) {
            console.error("Error fetching equipment assignments:", result.error);
            return [];
        }

        return (result.data || []) as EquipmentAssignment[];
    } catch (err) {
        console.error("Error in getEquipmentAssignments:", err);
        return [];
    }
};

/**
 * Get equipment assignment by ID - works offline
 */
export const getEquipmentAssignmentById = async (businessId: string, id: string): Promise<EquipmentAssignment | null> => {
    try {
        const result = await selectEquipmentAssignments({ id }, businessId);

        if (result.error) {
            console.error("Error fetching equipment assignment:", result.error);
            return null;
        }

        const assignments = (result.data || []) as EquipmentAssignment[];
        return assignments.length > 0 ? assignments[0] : null;
    } catch (err) {
        console.error("Error in getEquipmentAssignmentById:", err);
        return null;
    }
};

/**
 * Create new equipment assignment - works offline
 */
export const createEquipmentAssignment = async (
    businessId: string,
    assignment: Omit<EquipmentAssignmentInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<EquipmentAssignment | null> => {
    try {
        const newAssignment: EquipmentAssignmentInsert = {
            ...assignment,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertEquipmentAssignment(newAssignment, businessId);

        if (result.error) {
            console.error("Error creating equipment assignment:", result.error);
            return null;
        }

        return result.data as EquipmentAssignment;
    } catch (err) {
        console.error("Error in createEquipmentAssignment:", err);
        return null;
    }
};

/**
 * Update equipment assignment - works offline
 */
export const updateEquipmentAssignmentById = async (
    businessId: string,
    id: string,
    updates: Partial<EquipmentAssignmentUpdate>
): Promise<EquipmentAssignment | null> => {
    try {
        const updateData: EquipmentAssignmentUpdate = {
            ...updates,
            id,
            updated_at: new Date().toISOString()
        };

        const result = await updateEquipmentAssignment(updateData, businessId);

        if (result.error) {
            console.error("Error updating equipment assignment:", result.error);
            return null;
        }

        return result.data as EquipmentAssignment;
    } catch (err) {
        console.error("Error in updateEquipmentAssignmentById:", err);
        return null;
    }
};

/**
 * Delete equipment assignment - works offline
 */
export const deleteEquipmentAssignmentById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteEquipmentAssignment({ id }, businessId);

        if (result.error) {
            console.error("Error deleting equipment assignment:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteEquipmentAssignmentById:", err);
        return false;
    }
};

/**
 * Get equipment assignments by equipment ID - works offline
 */
export const getEquipmentAssignmentsByEquipmentId = async (businessId: string, equipmentId: string): Promise<EquipmentAssignment[]> => {
    try {
        const allAssignments = await getEquipmentAssignments(businessId);
        return allAssignments.filter(assignment => assignment.equipment_id === equipmentId);
    } catch (err) {
        console.error("Error in getEquipmentAssignmentsByEquipmentId:", err);
        return [];
    }
};

/**
 * Get equipment assignments by project ID - works offline
 */
export const getEquipmentAssignmentsByProjectId = async (businessId: string, projectId: string): Promise<EquipmentAssignment[]> => {
    try {
        const allAssignments = await getEquipmentAssignments(businessId);
        return allAssignments.filter(assignment => assignment.project_id === projectId);
    } catch (err) {
        console.error("Error in getEquipmentAssignmentsByProjectId:", err);
        return [];
    }
};

/**
 * Get equipment assignments by crew ID - works offline
 */
export const getEquipmentAssignmentsByCrewId = async (businessId: string, crewId: string): Promise<EquipmentAssignment[]> => {
    try {
        const allAssignments = await getEquipmentAssignments(businessId);
        return allAssignments.filter(assignment => assignment.crew_id === crewId);
    } catch (err) {
        console.error("Error in getEquipmentAssignmentsByCrewId:", err);
        return [];
    }
};

/**
 * Get active equipment assignments - works offline
 */
export const getActiveEquipmentAssignments = async (businessId: string): Promise<EquipmentAssignment[]> => {
    try {
        const allAssignments = await getEquipmentAssignments(businessId);
        const now = new Date().toISOString();

        return allAssignments.filter(assignment => {
            // Assignment is active if:
            // 1. Status is 'active' or 'assigned'
            // 2. Start date has passed
            // 3. End date hasn't passed (or is null)
            const isStatusActive = ['active', 'assigned'].includes(assignment.status || '');
            const hasStarted = new Date(assignment.start_date) <= new Date(now);
            const hasNotEnded = !assignment.end_date || new Date(assignment.end_date) >= new Date(now);

            return isStatusActive && hasStarted && hasNotEnded;
        });
    } catch (err) {
        console.error("Error in getActiveEquipmentAssignments:", err);
        return [];
    }
};

/**
 * Get equipment assignments for date range - works offline
 */
export const getEquipmentAssignmentsForDateRange = async (
    businessId: string,
    startDate: string,
    endDate: string
): Promise<EquipmentAssignment[]> => {
    try {
        const allAssignments = await getEquipmentAssignments(businessId);
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return allAssignments.filter(assignment => {
            const assignmentStart = new Date(assignment.start_date).getTime();
            const assignmentEnd = assignment.end_date ? new Date(assignment.end_date).getTime() : Date.now();

            // Check if assignment period overlaps with query range
            return assignmentStart <= end && assignmentEnd >= start;
        });
    } catch (err) {
        console.error("Error in getEquipmentAssignmentsForDateRange:", err);
        return [];
    }
};

/**
 * Check if equipment is assigned on a specific date - works offline
 */
export const isEquipmentAssignedOnDate = async (
    businessId: string,
    equipmentId: string,
    date: string
): Promise<boolean> => {
    try {
        const assignments = await getEquipmentAssignmentsByEquipmentId(businessId, equipmentId);
        const checkDate = new Date(date).getTime();

        return assignments.some(assignment => {
            const startDate = new Date(assignment.start_date).getTime();
            const endDate = assignment.end_date ? new Date(assignment.end_date).getTime() : Date.now();

            return checkDate >= startDate && checkDate <= endDate &&
                ['active', 'assigned'].includes(assignment.status || '');
        });
    } catch (err) {
        console.error("Error in isEquipmentAssignedOnDate:", err);
        return false;
    }
};

/**
 * Get equipment availability for date range - works offline
 */
export const getEquipmentAvailability = async (
    businessId: string,
    startDate: string,
    endDate: string
): Promise<Record<string, { assigned: number; available: number; total: number }>> => {
    try {
        // This would require equipment data - placeholder implementation
        // TODO: Import equipment client actions when available
        const assignments = await getEquipmentAssignmentsForDateRange(businessId, startDate, endDate);

        const availability: Record<string, { assigned: number; available: number; total: number }> = {};

        assignments.forEach(assignment => {
            const equipmentId = assignment.equipment_id;
            if (!availability[equipmentId]) {
                availability[equipmentId] = { assigned: 0, available: 0, total: 1 };
            }

            if (['active', 'assigned'].includes(assignment.status || '')) {
                availability[equipmentId].assigned++;
            }
        });

        // Calculate available (total - assigned)
        Object.keys(availability).forEach(equipmentId => {
            availability[equipmentId].available = availability[equipmentId].total - availability[equipmentId].assigned;
        });

        return availability;
    } catch (err) {
        console.error("Error in getEquipmentAvailability:", err);
        return {};
    }
};

/**
 * Return equipment (end assignment) - works offline
 */
export const returnEquipment = async (businessId: string, assignmentId: string): Promise<boolean> => {
    try {
        const updated = await updateEquipmentAssignmentById(businessId, assignmentId, {
            end_date: new Date().toISOString(),
            status: 'returned'
        });

        return updated !== null;
    } catch (err) {
        console.error("Error in returnEquipment:", err);
        return false;
    }
};

/**
 * Bulk assign equipment to project/crew - works offline
 */
export const bulkAssignEquipment = async (
    businessId: string,
    equipmentIds: string[],
    projectId: string,
    crewId: string,
    startDate: string,
    endDate?: string
): Promise<EquipmentAssignment[]> => {
    try {
        const createPromises = equipmentIds.map(equipmentId =>
            createEquipmentAssignment(businessId, {
                equipment_id: equipmentId,
                project_id: projectId,
                crew_id: crewId,
                start_date: startDate,
                end_date: endDate || null,
                status: 'assigned',
                business_id: businessId,
                assigned_by: null,
                notes: null,
                created_by: null,
                updated_by: null
            })
        );

        const results = await Promise.all(createPromises);
        return results.filter(result => result !== null) as EquipmentAssignment[];
    } catch (err) {
        console.error("Error in bulkAssignEquipment:", err);
        return [];
    }
};

/**
 * Get assignment statistics - works offline
 */
export const getEquipmentAssignmentStats = async (businessId: string): Promise<{
    total: number;
    active: number;
    returned: number;
    overdue: number;
    byStatus: Record<string, number>;
    byProject: Record<string, number>;
    byCrew: Record<string, number>;
    averageAssignmentDuration: number;
}> => {
    try {
        const assignments = await getEquipmentAssignments(businessId);
        const now = new Date().getTime();

        const byStatus: Record<string, number> = {};
        const byProject: Record<string, number> = {};
        const byCrew: Record<string, number> = {};

        let totalDuration = 0;
        let completedAssignments = 0;
        let active = 0;
        let returned = 0;
        let overdue = 0;

        assignments.forEach(assignment => {
            // Track by status
            const status = assignment.status || 'unknown';
            byStatus[status] = (byStatus[status] || 0) + 1;

            // Track by project
            byProject[assignment.project_id] = (byProject[assignment.project_id] || 0) + 1;

            // Track by crew
            byCrew[assignment.crew_id] = (byCrew[assignment.crew_id] || 0) + 1;

            // Calculate duration and status
            const startTime = new Date(assignment.start_date).getTime();
            const endTime = assignment.end_date ? new Date(assignment.end_date).getTime() : now;

            if (assignment.end_date) {
                totalDuration += endTime - startTime;
                completedAssignments++;
                returned++;
            } else if (['active', 'assigned'].includes(status)) {
                active++;

                // Check if overdue (no specific end date logic, using 30 days as default)
                if (now - startTime > 30 * 24 * 60 * 60 * 1000) {
                    overdue++;
                }
            }
        });

        return {
            total: assignments.length,
            active,
            returned,
            overdue,
            byStatus,
            byProject,
            byCrew,
            averageAssignmentDuration: completedAssignments > 0 ? totalDuration / completedAssignments : 0
        };
    } catch (err) {
        console.error("Error in getEquipmentAssignmentStats:", err);
        return {
            total: 0,
            active: 0,
            returned: 0,
            overdue: 0,
            byStatus: {},
            byProject: {},
            byCrew: {},
            averageAssignmentDuration: 0
        };
    }
};

/**
 * Validate equipment assignment data
 */
export const validateEquipmentAssignment = (assignment: Partial<EquipmentAssignmentInsert>): string[] => {
    const errors: string[] = [];

    if (!assignment.equipment_id || assignment.equipment_id.trim().length === 0) {
        errors.push('Equipment ID is required');
    }

    if (!assignment.project_id || assignment.project_id.trim().length === 0) {
        errors.push('Project ID is required');
    }

    if (!assignment.crew_id || assignment.crew_id.trim().length === 0) {
        errors.push('Crew ID is required');
    }

    if (!assignment.start_date || assignment.start_date.trim().length === 0) {
        errors.push('Start date is required');
    }

    if (assignment.start_date && assignment.end_date) {
        const startDate = new Date(assignment.start_date);
        const endDate = new Date(assignment.end_date);

        if (endDate < startDate) {
            errors.push('End date cannot be before start date');
        }
    }

    const validStatuses = ['assigned', 'active', 'returned', 'cancelled'];
    if (assignment.status && !validStatuses.includes(assignment.status)) {
        errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return errors;
};
