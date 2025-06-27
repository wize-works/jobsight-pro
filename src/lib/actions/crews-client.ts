/**
 * Client-Side Crews Actions
 * 
 * Replaces src/app/actions/crews.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Crew, CrewInsert, CrewUpdate, CrewWithDetails } from "@/types/crews";
import type { CrewMember } from "@/types/crew-members";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Create client-side crew actions
const insertCrew = createInsertAction('crews', 'medium');
const updateCrewAction = createUpdateAction('crews', 'medium');
const deleteCrewAction = createDeleteAction('crews', 'medium');
const selectCrews = createSelectAction('crews');

/**
 * Get all crews for a business - works offline with server fallback
 */
export const getCrews = async (businessId: string): Promise<Crew[]> => {
    try {
        // Try client-side (IndexedDB) first
        const result = await selectCrews({}, businessId);

        if (result.error) {
            console.error("Error fetching crews from IndexedDB:", result.error);
        }

        const clientData = (result.data || []) as Crew[];

        // If we have data from IndexedDB, return it
        if (clientData.length > 0) {
            console.log(`✅ Crews loaded from IndexedDB: ${clientData.length} crews`);
            return clientData;
        }

        // Fallback to server if IndexedDB is empty
        console.log('🔄 IndexedDB empty, falling back to server for crews...');

        try {
            // Import server action dynamically to avoid bundling issues
            const { getCrews: getCrewsServer } = await import('@/app/actions/crews');
            const serverData = await getCrewsServer(businessId);

            if (serverData.length > 0) {
                console.log(`✅ Crews loaded from server: ${serverData.length} crews`);

                // Cache server data to IndexedDB for future offline use
                try {
                    const { cacheData } = await import('@/lib/offline/storage');
                    await cacheData('crews', serverData, businessId);
                    console.log(`💾 Cached ${serverData.length} crews to IndexedDB`);
                } catch (cacheError) {
                    console.warn('⚠️ Failed to cache crews data:', cacheError);
                }

                return serverData;
            }
        } catch (serverError) {
            console.error('❌ Server fallback failed for crews:', serverError);
        }

        console.log('📭 No crews found in IndexedDB or server');
        return [];
    } catch (err) {
        console.error("Error in getCrews:", err);
        return [];
    }
};

/**
 * Get crew by ID - works offline
 */
export const getCrewById = async (businessId: string, id: string): Promise<Crew | null> => {
    try {
        const crews = await getCrews(businessId);
        const crew = crews.find(c => c.id === id);

        if (!crew) {
            console.warn(`Crew with ID ${id} not found`);
            return null;
        }

        return crew;
    } catch (err) {
        console.error("Error in getCrewById:", err);
        return null;
    }
};

/**
 * Create new crew - works offline with optimistic updates
 */
export const createCrew = async (
    businessId: string,
    crew: CrewInsert
): Promise<Crew | null> => {
    try {
        // Ensure required fields
        const crewData = {
            ...crew,
            id: crew.id || uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertCrew(crewData, businessId);

        if (result.error) {
            console.error("Error creating crew:", result.error);
            return null;
        }

        return result.data as Crew;
    } catch (err) {
        console.error("Error in createCrew:", err);
        return null;
    }
};

/**
 * Update crew - works offline with optimistic updates
 */
export const updateCrew = async (
    businessId: string,
    id: string,
    crew: CrewUpdate
): Promise<Crew | null> => {
    try {
        const updateData = {
            ...crew,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateCrewAction(updateData, businessId);

        if (result.error) {
            console.error("Error updating crew:", result.error);
            return null;
        }

        return result.data as Crew;
    } catch (err) {
        console.error("Error in updateCrew:", err);
        return null;
    }
};

/**
 * Delete crew - works offline with optimistic updates
 */
export const deleteCrewById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteCrewAction({ id }, businessId);

        if (result.error) {
            console.error("Error deleting crew:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteCrewById:", err);
        return false;
    }
};

/**
 * Search crews - works offline
 */
export const searchCrews = async (businessId: string, query: string): Promise<Crew[]> => {
    try {
        const allCrews = await getCrews(businessId);

        if (!query.trim()) {
            return allCrews;
        }

        // Simple client-side search - could be enhanced
        const searchLower = query.toLowerCase();
        return allCrews.filter(crew =>
            crew.name?.toLowerCase().includes(searchLower) ||
            crew.notes?.toLowerCase().includes(searchLower) ||
            crew.specialty?.toLowerCase().includes(searchLower)
        );
    } catch (err) {
        console.error("Error in searchCrews:", err);
        return [];
    }
};

/**
 * Get crews with details - works offline
 */
export const getCrewsWithDetails = async (businessId: string): Promise<CrewWithDetails[]> => {
    try {
        const crews = await getCrews(businessId);

        // Return crews with the required structure for CrewWithDetails
        // TODO: Implement crew member and project data caching and joining
        return crews.map(crew => ({
            ...crew,
            leader: "Loading...", // Placeholder - implement leader lookup
            member_count: 0, // Placeholder - implement member count calculation
            current_project: null, // Placeholder - implement current project lookup
            current_project_id: null, // Placeholder - implement current project ID lookup
            active_projects: 0, // Placeholder - implement active project count
            total_hours: 0 // Placeholder - implement total hours calculation
        })) as CrewWithDetails[];

    } catch (err) {
        console.error("Error in getCrewsWithDetails:", err);
        return [];
    }
};

/**
 * Get crew with details by ID - works offline
 */
export const getCrewWithDetailsById = async (businessId: string, id: string): Promise<CrewWithDetails | null> => {
    try {
        const crewsWithDetails = await getCrewsWithDetails(businessId);
        const crewWithDetails = crewsWithDetails.find(crew => crew.id === id);

        if (!crewWithDetails) {
            console.warn(`Crew with details for ID ${id} not found`);
            return null;
        }

        return crewWithDetails;
    } catch (err) {
        console.error("Error in getCrewWithDetailsById:", err);
        return null;
    }
};

/**
 * Get crew members by crew ID - works offline
 */
export const getCrewMembersByCrewId = async (businessId: string, crewId: string): Promise<CrewMember[]> => {
    try {
        // This would need to query crew_members table
        // For now, return empty array as placeholder
        // TODO: Implement crew members table querying
        console.log("Getting crew members for crew:", crewId);
        return [];
    } catch (err) {
        console.error("Error in getCrewMembersByCrewId:", err);
        return [];
    }
};

/**
 * Get crew schedule - works offline
 */
export const getCrewSchedule = async (businessId: string, crewId: string): Promise<any[]> => {
    try {
        // This would need to query project_crews table with project details
        // For now, return empty array as placeholder
        // TODO: Implement project crews schedule querying
        console.log("Getting crew schedule for crew:", crewId);
        return [];
    } catch (err) {
        console.error("Error in getCrewSchedule:", err);
        return [];
    }
};

/**
 * Get crew schedule history - works offline
 */
export const getCrewScheduleHistory = async (businessId: string, crewId: string): Promise<any[]> => {
    try {
        // This would need to query historical project_crews data
        // For now, return empty array as placeholder
        // TODO: Implement crew schedule history querying
        console.log("Getting crew schedule history for crew:", crewId);
        return [];
    } catch (err) {
        console.error("Error in getCrewScheduleHistory:", err);
        return [];
    }
};

// Export compatibility functions for existing code
export {
    getCrews as default,
    createCrew as insertCrew
};
