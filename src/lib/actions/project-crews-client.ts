/**
 * Client-Side Project Crews Actions
 * 
 * Replaces src/app/actions/project-crews.ts with offline-first implementation.
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

// Extract Supabase types for project crews
type ProjectCrew = Database['public']['Tables']['project_crews']['Row'];
type ProjectCrewInsert = Database['public']['Tables']['project_crews']['Insert'];
type ProjectCrewUpdate = Partial<Database['public']['Tables']['project_crews']['Update']>;

// Extended types for project crews with related data
type ProjectCrewWithDetails = ProjectCrew & {
    crew_name: string;
    project_name: string;
    is_active: boolean;
};

// Create client-side project crew actions
const insertProjectCrew = createInsertAction('project_crews', 'high');
const updateProjectCrew = createUpdateAction('project_crews', 'high');
const deleteProjectCrew = createDeleteAction('project_crews', 'medium');
const selectProjectCrews = createSelectAction('project_crews');

/**
 * Get all project crew assignments for a business - works offline
 */
export const getProjectCrews = async (businessId: string): Promise<ProjectCrew[]> => {
    try {
        const result = await selectProjectCrews({}, businessId);

        if (result.error) {
            console.error("Error fetching project crews:", result.error);
            return [];
        }

        let projectCrews = (result.data || []) as ProjectCrew[];

        // Filter by business
        projectCrews = projectCrews.filter(pc => pc.business_id === businessId);

        // Sort by start date, newest first
        return projectCrews.sort((a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
    } catch (err) {
        console.error("Error in getProjectCrews:", err);
        return [];
    }
};

/**
 * Get project crew assignment by ID - works offline
 */
export const getProjectCrewById = async (businessId: string, id: string): Promise<ProjectCrew | null> => {
    try {
        const projectCrews = await getProjectCrews(businessId);
        const projectCrew = projectCrews.find(pc => pc.id === id);

        if (!projectCrew) {
            console.warn(`Project crew assignment with ID ${id} not found`);
            return null;
        }

        return projectCrew;
    } catch (err) {
        console.error("Error in getProjectCrewById:", err);
        return null;
    }
};

/**
 * Create new project crew assignment - works offline with optimistic updates
 */
export const createProjectCrew = async (
    data: ProjectCrewInsert,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectCrew; error?: string }> => {
    try {
        // Ensure required fields
        const projectCrewData = {
            ...data,
            id: data.id || uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            created_by: userId || data.created_by || null,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by || null,
        };

        const result = await insertProjectCrew(projectCrewData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as ProjectCrew };
    } catch (err) {
        console.error("Error in createProjectCrew:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update project crew assignment - works offline with optimistic updates
 */
export const updateProjectCrewById = async (
    id: string,
    data: ProjectCrewUpdate,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectCrew; error?: string }> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by || null,
        };

        const result = await updateProjectCrew(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as ProjectCrew };
    } catch (err) {
        console.error("Error in updateProjectCrewById:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Delete project crew assignment - works offline with optimistic updates
 */
export const deleteProjectCrewById = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteProjectCrew({ id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteProjectCrewById:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get crews assigned to a project - works offline
 */
export const getCrewsByProject = async (businessId: string, projectId: string): Promise<ProjectCrew[]> => {
    try {
        const projectCrews = await getProjectCrews(businessId);
        return projectCrews.filter(pc => pc.project_id === projectId);
    } catch (err) {
        console.error("Error in getCrewsByProject:", err);
        return [];
    }
};

/**
 * Get projects assigned to a crew - works offline
 */
export const getProjectsByCrew = async (businessId: string, crewId: string): Promise<ProjectCrew[]> => {
    try {
        const projectCrews = await getProjectCrews(businessId);
        return projectCrews.filter(pc => pc.crew_id === crewId);
    } catch (err) {
        console.error("Error in getProjectsByCrew:", err);
        return [];
    }
};

/**
 * Get active project crew assignments - works offline
 */
export const getActiveProjectCrews = async (businessId: string): Promise<ProjectCrew[]> => {
    try {
        const projectCrews = await getProjectCrews(businessId);
        const currentDate = new Date();

        return projectCrews.filter(pc => {
            const startDate = new Date(pc.start_date);
            const endDate = pc.end_date ? new Date(pc.end_date) : null;

            return startDate <= currentDate && (!endDate || endDate >= currentDate);
        });
    } catch (err) {
        console.error("Error in getActiveProjectCrews:", err);
        return [];
    }
};

/**
 * Get upcoming project crew assignments - works offline
 */
export const getUpcomingProjectCrews = async (businessId: string): Promise<ProjectCrew[]> => {
    try {
        const projectCrews = await getProjectCrews(businessId);
        const currentDate = new Date();

        return projectCrews.filter(pc => {
            const startDate = new Date(pc.start_date);
            return startDate > currentDate;
        });
    } catch (err) {
        console.error("Error in getUpcomingProjectCrews:", err);
        return [];
    }
};

/**
 * Get completed project crew assignments - works offline
 */
export const getCompletedProjectCrews = async (businessId: string): Promise<ProjectCrew[]> => {
    try {
        const projectCrews = await getProjectCrews(businessId);
        const currentDate = new Date();

        return projectCrews.filter(pc => {
            const endDate = pc.end_date ? new Date(pc.end_date) : null;
            return endDate && endDate < currentDate;
        });
    } catch (err) {
        console.error("Error in getCompletedProjectCrews:", err);
        return [];
    }
};

/**
 * Assign crew to project - works offline
 */
export const assignCrewToProject = async (
    crewId: string,
    projectId: string,
    startDate: string,
    endDate: string | null,
    notes: string | null,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectCrew; error?: string }> => {
    return createProjectCrew({
        id: uuidv4(),
        crew_id: crewId,
        project_id: projectId,
        business_id: businessId,
        start_date: startDate,
        end_date: endDate,
        notes: notes,
        created_at: new Date().toISOString(),
        created_by: userId || null,
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
    }, businessId, userId);
};

/**
 * Update assignment dates - works offline
 */
export const updateAssignmentDates = async (
    id: string,
    startDate: string,
    endDate: string | null,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectCrew; error?: string }> => {
    return updateProjectCrewById(id, {
        start_date: startDate,
        end_date: endDate,
    }, businessId, userId);
};

/**
 * Complete assignment (set end date to today) - works offline
 */
export const completeAssignment = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectCrew; error?: string }> => {
    return updateProjectCrewById(id, {
        end_date: new Date().toISOString().split('T')[0], // ISO date format
    }, businessId, userId);
};

/**
 * Get project crews with details - works offline
 */
export const getProjectCrewsWithDetails = async (businessId: string): Promise<ProjectCrewWithDetails[]> => {
    try {
        const projectCrews = await getProjectCrews(businessId);
        const currentDate = new Date();

        // TODO: Implement crew and project name lookup from cached data
        return projectCrews.map(pc => {
            const startDate = new Date(pc.start_date);
            const endDate = pc.end_date ? new Date(pc.end_date) : null;
            const isActive = startDate <= currentDate && (!endDate || endDate >= currentDate);

            return {
                ...pc,
                crew_name: "Loading...", // Placeholder - implement crew lookup
                project_name: "Loading...", // Placeholder - implement project lookup
                is_active: isActive
            };
        }) as ProjectCrewWithDetails[];

    } catch (err) {
        console.error("Error in getProjectCrewsWithDetails:", err);
        return [];
    }
};

/**
 * Check if project crew operations are pending sync
 */
export const getProjectCrewSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending project crew operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0
    };
};

// Export compatibility functions for existing code
export {
    getProjectCrews as default,
    createProjectCrew as insertProjectCrew,
    updateProjectCrewById as updateProjectCrew,
    deleteProjectCrewById as deleteProjectCrew
};
