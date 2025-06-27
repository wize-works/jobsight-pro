/**
 * Client-Side Equipment Actions
 * 
 * Replaces src/app/actions/equipments.ts with offline-first implementation.
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

// Equipment types from Supabase
export type Equipment = Database["public"]["Tables"]["equipment"]["Row"];
export type EquipmentInsert = Database["public"]["Tables"]["equipment"]["Insert"];
export type EquipmentUpdate = Database["public"]["Tables"]["equipment"]["Update"];

// Status type
export type EquipmentStatus = "active" | "maintenance" | "retired" | "damaged" | "available" | "in_use";

// Create client-side equipment actions (note: table name is 'equipment' not 'equipments')
const insertEquipment = createInsertAction('equipment', 'medium');
const updateEquipmentAction = createUpdateAction('equipment', 'medium');
const deleteEquipmentAction = createDeleteAction('equipment', 'medium');
const selectEquipment = createSelectAction('equipment');

/**
 * Get all equipment for a business - works offline with server fallback
 */
export const getEquipments = async (businessId: string): Promise<Equipment[]> => {
    try {
        // Try client-side (IndexedDB) first
        const result = await selectEquipment({}, businessId);

        if (result.error) {
            console.error("Error fetching equipment from IndexedDB:", result.error);
        }

        const clientData = (result.data || []) as Equipment[];

        // If we have data from IndexedDB, return it
        if (clientData.length > 0) {
            console.log(`✅ Equipment loaded from IndexedDB: ${clientData.length} equipment`);
            return clientData;
        }

        // Fallback to server if IndexedDB is empty
        console.log('🔄 IndexedDB empty, falling back to server for equipment...');

        try {
            // Import server action dynamically to avoid bundling issues
            const { getEquipments: getEquipmentsServer } = await import('@/app/actions/equipments');
            const serverData = await getEquipmentsServer(businessId);

            if (serverData.length > 0) {
                console.log(`✅ Equipment loaded from server: ${serverData.length} equipment`);

                // Cache server data to IndexedDB for future offline use
                try {
                    const { cacheData } = await import('@/lib/offline/storage');
                    await cacheData('equipment', serverData, businessId);
                    console.log(`💾 Cached ${serverData.length} equipment to IndexedDB`);
                } catch (cacheError) {
                    console.warn('⚠️ Failed to cache equipment data:', cacheError);
                }

                return serverData;
            }
        } catch (serverError) {
            console.error('❌ Server fallback failed for equipment:', serverError);
        }

        console.log('📭 No equipment found in IndexedDB or server');
        return [];
    } catch (err) {
        console.error("Error in getEquipments:", err);
        return [];
    }
};

/**
 * Get equipment by ID - works offline
 */
export const getEquipmentById = async (businessId: string, id: string): Promise<Equipment | null> => {
    try {
        const equipment = await getEquipments(businessId);
        const item = equipment.find(e => e.id === id);

        if (!item) {
            console.warn(`Equipment with ID ${id} not found`);
            return null;
        }

        return item;
    } catch (err) {
        console.error("Error in getEquipmentById:", err);
        return null;
    }
};

/**
 * Get equipment detail - works offline
 */
export const getEquipmentDetail = async (businessId: string, id: string) => {
    try {
        const equipment = await getEquipmentById(businessId, id);

        if (!equipment) {
            throw new Error(`Equipment with ID ${id} not found`);
        }

        // Return structure similar to server version but with offline placeholders
        return {
            equipment,
            usage_logs: [], // TODO: Implement usage logs lookup
            maintenance_records: [], // TODO: Implement maintenance records lookup
            assignments: [], // TODO: Implement assignments lookup
            location_history: [], // TODO: Implement location history lookup
            specifications: [], // TODO: Implement specifications lookup
            media: [] // TODO: Implement media lookup
        };
    } catch (err) {
        console.error("Error in getEquipmentDetail:", err);
        throw err;
    }
};

/**
 * Create new equipment - works offline with optimistic updates
 */
export const createEquipment = async (
    businessId: string,
    equipment: EquipmentInsert
): Promise<Equipment | null> => {
    try {
        // Ensure required fields
        const equipmentData = {
            ...equipment,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: equipment.status || 'available',
        };

        const result = await insertEquipment(equipmentData, businessId);

        if (result.error) {
            console.error("Error creating equipment:", result.error);
            return null;
        }

        return result.data as Equipment;
    } catch (err) {
        console.error("Error in createEquipment:", err);
        return null;
    }
};

/**
 * Update equipment - works offline with optimistic updates
 */
export const updateEquipment = async (
    businessId: string,
    id: string,
    equipment: EquipmentUpdate
): Promise<Equipment | null> => {
    try {
        const updateData = {
            ...equipment,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateEquipmentAction(updateData, businessId);

        if (result.error) {
            console.error("Error updating equipment:", result.error);
            return null;
        }

        return result.data as Equipment;
    } catch (err) {
        console.error("Error in updateEquipment:", err);
        return null;
    }
};

/**
 * Delete equipment - works offline with optimistic updates
 */
export const deleteEquipment = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteEquipmentAction({ id }, businessId);

        if (result.error) {
            console.error("Error deleting equipment:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteEquipment:", err);
        return false;
    }
};

/**
 * Search equipment - works offline
 */
export const searchEquipments = async (businessId: string, query: string): Promise<Equipment[]> => {
    try {
        const allEquipment = await getEquipments(businessId);

        if (!query.trim()) {
            return allEquipment;
        }

        // Simple client-side search - could be enhanced
        const searchLower = query.toLowerCase();
        return allEquipment.filter(equipment =>
            equipment.name?.toLowerCase().includes(searchLower) ||
            equipment.description?.toLowerCase().includes(searchLower) ||
            equipment.make?.toLowerCase().includes(searchLower) ||
            equipment.model?.toLowerCase().includes(searchLower) ||
            equipment.serial_number?.toLowerCase().includes(searchLower)
        );
    } catch (err) {
        console.error("Error in searchEquipments:", err);
        return [];
    }
};

/**
 * Set equipment status - works offline with optimistic updates
 */
export const setEquipmentStatus = async (
    businessId: string,
    id: string,
    status: EquipmentStatus
): Promise<Equipment | null> => {
    try {
        const updateData = {
            id,
            status,
            updated_at: new Date().toISOString(),
        };

        const result = await updateEquipmentAction(updateData, businessId);

        if (result.error) {
            console.error("Error setting equipment status:", result.error);
            return null;
        }

        return result.data as Equipment;
    } catch (err) {
        console.error("Error in setEquipmentStatus:", err);
        return null;
    }
};

/**
 * Set equipment location - works offline with optimistic updates
 */
export const setEquipmentLocation = async (
    businessId: string,
    equipment: EquipmentUpdate
): Promise<Equipment | null> => {
    try {
        const updateData = {
            ...equipment,
            updated_at: new Date().toISOString(),
        };

        const result = await updateEquipmentAction(updateData, businessId);

        if (result.error) {
            console.error("Error setting equipment location:", result.error);
            return null;
        }

        return result.data as Equipment;
    } catch (err) {
        console.error("Error in setEquipmentLocation:", err);
        return null;
    }
};

/**
 * Get equipment details by ID - works offline (legacy compatibility)
 */
export const getEquipmentDetailsByID = async (businessId: string, id: string) => {
    try {
        // Use the existing getEquipmentDetail function for consistency
        return await getEquipmentDetail(businessId, id);
    } catch (err) {
        console.error("Error in getEquipmentDetailsByID:", err);
        throw err;
    }
};

/**
 * Get equipment with stats - works offline
 */
export const getEquipmentsWithStats = async (businessId: string) => {
    try {
        const equipment = await getEquipments(businessId);

        // Calculate basic stats from equipment data
        const stats = {
            total: equipment.length,
            available: equipment.filter(e => e.status === 'available').length,
            in_use: equipment.filter(e => e.status === 'in_use').length,
            maintenance: equipment.filter(e => e.status === 'maintenance').length,
            retired: equipment.filter(e => e.status === 'retired').length
        };

        // Return equipment with placeholder stats since detailed data relationships 
        // need additional implementation for offline caching
        // TODO: Implement usage, maintenance, and assignment data caching
        const equipmentWithStats = equipment.map(item => ({
            ...item,
            total_hours: 0, // Placeholder - implement hours calculation
            maintenance_due: false, // Placeholder - implement maintenance check
            current_project: null, // Placeholder - implement project lookup
            utilization_rate: 0, // Placeholder - implement utilization calculation
            last_service_date: null, // Placeholder - implement service date lookup
            next_service_due: null // Placeholder - implement service schedule calculation
        }));

        return {
            equipment: equipmentWithStats,
            stats
        };
    } catch (err) {
        console.error("Error in getEquipmentsWithStats:", err);
        return {
            equipment: [],
            stats: { total: 0, available: 0, in_use: 0, maintenance: 0, retired: 0 }
        };
    }
};

// Export compatibility functions for existing code
export {
    getEquipments as default,
    createEquipment as insertEquipment
};
