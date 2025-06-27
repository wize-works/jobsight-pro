/**
 * Client-Side Equipment Specifications Actions
 * 
 * Replaces src/app/actions/equipment-specifications.ts with offline-first implementation.
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

// Extract Supabase types for equipment specifications
type EquipmentSpecification = Database['public']['Tables']['equipment_specifications']['Row'];
type EquipmentSpecificationInsert = Database['public']['Tables']['equipment_specifications']['Insert'];
type EquipmentSpecificationUpdate = Database['public']['Tables']['equipment_specifications']['Update'];

// Create client-side equipment specification actions
const insertEquipmentSpecification = createInsertAction('equipment_specifications', 'medium');
const updateEquipmentSpecification = createUpdateAction('equipment_specifications', 'medium');
const deleteEquipmentSpecification = createDeleteAction('equipment_specifications', 'medium');
const selectEquipmentSpecifications = createSelectAction('equipment_specifications');

/**
 * Get all equipment specifications for a business - works offline
 */
export const getEquipmentSpecifications = async (businessId: string, equipmentId?: string): Promise<EquipmentSpecification[]> => {
    try {
        const result = await selectEquipmentSpecifications({}, businessId);

        if (result.error) {
            console.error("Error fetching equipment specifications:", result.error);
            return [];
        }

        let specifications = (result.data || []) as EquipmentSpecification[];

        // Filter by equipment_id if provided
        if (equipmentId) {
            specifications = specifications.filter(spec => spec.equipment_id === equipmentId);
        }

        return specifications;
    } catch (err) {
        console.error("Error in getEquipmentSpecifications:", err);
        return [];
    }
};

/**
 * Create a new equipment specification - works offline
 */
export const createEquipmentSpecification = async (data: EquipmentSpecificationInsert): Promise<EquipmentSpecification | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for equipment specification');
        }

        const specificationData = {
            ...data,
            id: data.id || uuidv4(),
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertEquipmentSpecification(specificationData, data.business_id);

        if (result.error) {
            console.error("Error creating equipment specification:", result.error);
            return null;
        }

        return result.data as EquipmentSpecification;
    } catch (err) {
        console.error("Error in createEquipmentSpecification:", err);
        return null;
    }
};

/**
 * Update an equipment specification - works offline
 */
export const updateEquipmentSpecificationById = async (id: string, data: Partial<EquipmentSpecificationUpdate>, businessId: string): Promise<EquipmentSpecification | null> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateEquipmentSpecification(updateData, businessId);

        if (result.error) {
            console.error("Error updating equipment specification:", result.error);
            return null;
        }

        return result.data as EquipmentSpecification;
    } catch (err) {
        console.error("Error in updateEquipmentSpecificationById:", err);
        return null;
    }
};

/**
 * Delete an equipment specification - works offline
 */
export const removeEquipmentSpecification = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteEquipmentSpecification({ id }, businessId);

        if (result.error) {
            console.error("Error deleting equipment specification:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeEquipmentSpecification:", err);
        return false;
    }
};

/**
 * Get an equipment specification by ID - works offline
 */
export const getEquipmentSpecificationById = async (id: string, businessId: string): Promise<EquipmentSpecification | null> => {
    try {
        const specifications = await getEquipmentSpecifications(businessId);
        return specifications.find(spec => spec.id === id) || null;
    } catch (err) {
        console.error("Error in getEquipmentSpecificationById:", err);
        return null;
    }
};

/**
 * Get specifications for specific equipment - works offline
 */
export const getSpecificationsByEquipmentId = async (businessId: string, equipmentId: string): Promise<EquipmentSpecification[]> => {
    return await getEquipmentSpecifications(businessId, equipmentId);
};

/**
 * Get specification by name for specific equipment - works offline
 */
export const getEquipmentSpecificationByName = async (businessId: string, equipmentId: string, name: string): Promise<EquipmentSpecification | null> => {
    try {
        const specifications = await getEquipmentSpecifications(businessId, equipmentId);
        return specifications.find(spec => spec.name === name) || null;
    } catch (err) {
        console.error("Error in getEquipmentSpecificationByName:", err);
        return null;
    }
};

/**
 * Set or update specification value for specific equipment and name - works offline
 */
export const setEquipmentSpecification = async (businessId: string, equipmentId: string, name: string, value: string | null, userId?: string): Promise<EquipmentSpecification | null> => {
    try {
        // Check if specification already exists
        const existing = await getEquipmentSpecificationByName(businessId, equipmentId, name);

        if (existing) {
            // Update existing specification
            return await updateEquipmentSpecificationById(existing.id, {
                value,
                updated_by: userId || null,
            }, businessId);
        } else {
            // Create new specification
            return await createEquipmentSpecification({
                id: uuidv4(),
                business_id: businessId,
                equipment_id: equipmentId,
                name,
                value,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: userId || null,
                updated_by: userId || null,
            });
        }
    } catch (err) {
        console.error("Error in setEquipmentSpecification:", err);
        return null;
    }
};

// Bulk operations for equipment specifications
export const createMultipleSpecifications = async (specifications: EquipmentSpecificationInsert[]): Promise<EquipmentSpecification[]> => {
    const results: EquipmentSpecification[] = [];
    for (const spec of specifications) {
        try {
            const result = await createEquipmentSpecification(spec);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            console.error('Error creating equipment specification:', error);
        }
    }
    return results;
};

export const deleteSpecificationsByEquipmentId = async (businessId: string, equipmentId: string): Promise<boolean[]> => {
    const specifications = await getSpecificationsByEquipmentId(businessId, equipmentId);
    const deletePromises = specifications.map(spec => removeEquipmentSpecification(spec.id, businessId));
    return await Promise.all(deletePromises);
};

// Get all specifications as key-value pairs for specific equipment
export const getEquipmentSpecificationsAsObject = async (businessId: string, equipmentId: string): Promise<Record<string, string | null>> => {
    try {
        const specifications = await getEquipmentSpecifications(businessId, equipmentId);
        const result: Record<string, string | null> = {};
        specifications.forEach(spec => {
            result[spec.name] = spec.value;
        });
        return result;
    } catch (error) {
        console.error('Failed to get specifications as object:', error);
        return {};
    }
};

// Get unique specification names for a business
export const getUniqueSpecificationNames = async (businessId: string): Promise<string[]> => {
    try {
        const specifications = await getEquipmentSpecifications(businessId);
        const uniqueNames = [...new Set(specifications.map(spec => spec.name))];
        return uniqueNames;
    } catch (error) {
        console.error('Failed to get unique specification names:', error);
        return [];
    }
};

// Search equipment by specification criteria
export const searchEquipmentBySpecifications = async (businessId: string, searchCriteria: Record<string, string>): Promise<string[]> => {
    try {
        const specifications = await getEquipmentSpecifications(businessId);
        const matchingEquipmentIds = new Set<string>();

        Object.entries(searchCriteria).forEach(([name, value]) => {
            specifications
                .filter(spec => spec.name === name && spec.value === value)
                .forEach(spec => matchingEquipmentIds.add(spec.equipment_id));
        });

        return Array.from(matchingEquipmentIds);
    } catch (error) {
        console.error('Failed to search equipment by specifications:', error);
        return [];
    }
};

// Get specification usage statistics
export const getSpecificationStats = async (businessId: string): Promise<{
    totalSpecifications: number;
    specificationsByName: Record<string, number>;
    equipmentWithSpecifications: number;
}> => {
    try {
        const specifications = await getEquipmentSpecifications(businessId);

        const stats = {
            totalSpecifications: specifications.length,
            specificationsByName: {} as Record<string, number>,
            equipmentWithSpecifications: new Set(specifications.map(spec => spec.equipment_id)).size,
        };

        specifications.forEach(spec => {
            stats.specificationsByName[spec.name] = (stats.specificationsByName[spec.name] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error('Failed to get specification stats:', error);
        return {
            totalSpecifications: 0,
            specificationsByName: {},
            equipmentWithSpecifications: 0,
        };
    }
};

// Export compatibility functions for existing code
export {
    getEquipmentSpecifications as getAllEquipmentSpecifications,
    createEquipmentSpecification as addEquipmentSpecification,
    removeEquipmentSpecification as deleteEquipmentSpecification,
    getEquipmentSpecificationById as fetchEquipmentSpecification,
};
