/**
 * Client-Side Projects Actions
 * 
 * Replaces src/app/actions/projects.ts with offline-first implementation.
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

// Extract Supabase types for projects
type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Partial<Database['public']['Tables']['projects']['Update']> & { id: string };

// Extended type for projects with client details
type ProjectWithDetails = Project & {
    client_name: string;
};

// Create client-side project actions
const insertProject = createInsertAction('projects', 'high');
const updateProject = createUpdateAction('projects', 'high');
const deleteProject = createDeleteAction('projects', 'high');
const selectProjects = createSelectAction('projects');

/**
 * Get all projects for a business - works offline with server fallback
 */
export const getProjects = async (businessId: string): Promise<Project[]> => {
    try {
        // Try client-side (IndexedDB) first
        const result = await selectProjects({}, businessId);

        if (result.error) {
            console.error("Error fetching projects from IndexedDB:", result.error);
        }

        const clientData = (result.data || []) as Project[];

        // If we have data from IndexedDB, return it
        if (clientData.length > 0) {
            console.log(`✅ Projects loaded from IndexedDB: ${clientData.length} projects`);
            return clientData;
        }

        // Fallback to server if IndexedDB is empty
        console.log('🔄 IndexedDB empty, falling back to server for projects...');

        try {
            // Import server action dynamically to avoid bundling issues
            const { getProjects: getProjectsServer } = await import('@/app/actions/projects');
            const serverData = await getProjectsServer(businessId);

            if (serverData.length > 0) {
                console.log(`✅ Projects loaded from server: ${serverData.length} projects`);

                // Cache server data to IndexedDB for future offline use
                try {
                    const { cacheData } = await import('@/lib/offline/storage');
                    await cacheData('projects', serverData, businessId);
                    console.log(`💾 Cached ${serverData.length} projects to IndexedDB`);
                } catch (cacheError) {
                    console.warn('⚠️ Failed to cache projects data:', cacheError);
                }

                return serverData;
            }
        } catch (serverError) {
            console.error('❌ Server fallback failed for projects:', serverError);
        }

        console.log('📭 No projects found in IndexedDB or server');
        return [];
    } catch (err) {
        console.error("Error in getProjects:", err);
        return [];
    }
};

/**
 * Get project by ID - works offline
 */
export const getProjectById = async (businessId: string, id: string): Promise<Project | null> => {
    try {
        const projects = await getProjects(businessId);
        const project = projects.find(p => p.id === id);

        if (!project) {
            console.warn(`Project with ID ${id} not found`);
            return null;
        }

        return project;
    } catch (err) {
        console.error("Error in getProjectById:", err);
        return null;
    }
};

/**
 * Create new project - works offline with optimistic updates
 */
export const createProject = async (
    data: ProjectInsert,
    businessId: string,
    userId?: string
): Promise<{ data?: Project; error?: string }> => {
    try {
        // Ensure required fields
        const projectData = {
            ...data,
            id: data.id || uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: data.status || 'active',
        };

        const result = await insertProject(projectData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Project };
    } catch (err) {
        console.error("Error in createProject:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update project - works offline with optimistic updates
 */
export const updateProjectById = async (
    id: string,
    data: ProjectUpdate,
    businessId: string,
    userId?: string
): Promise<{ data?: Project; error?: string }> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateProject(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Project };
    } catch (err) {
        console.error("Error in updateProjectById:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Delete project - works offline with optimistic updates
 */
export const deleteProjectById = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteProject({ id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteProjectById:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Check if project operations are pending sync
 */
export const getProjectSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending project operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0
    };
};

/**
 * Get projects with client details - works offline
 */
export const getProjectsWithDetails = async (businessId: string): Promise<ProjectWithDetails[]> => {
    try {
        const projects = await getProjects(businessId);

        // For now, return projects as-is since client data relationship 
        // needs additional implementation for offline client caching
        // TODO: Implement client data caching and joining
        return projects.map(project => ({
            ...project,
            client_name: "Loading..." // Placeholder - implement client lookup
        })) as ProjectWithDetails[];

    } catch (err) {
        console.error("Error in getProjectsWithDetails:", err);
        return [];
    }
};

/**
 * Get project details with all related data - simplified for offline-first
 */
export const getProjectDetailsByID = async (businessId: string, projectId: string): Promise<{
    project: Project;
    milestones: any[];
    tasks: any[];
    crews: any[];
    issues: any[];
    client: any | null;
    contacts: any[];
    manager: any | null;
    stats: {
        totalTasks: number;
        completedTasks: number;
        totalMilestones: number;
        completedMilestones: number;
        totalIssues: number;
        openIssues: number;
        totalCrews: number;
    };
} | null> => {
    try {
        // Get the main project
        const project = await getProjectById(businessId, projectId);
        if (!project) {
            return null;
        }

        // For now, return simplified structure with placeholders
        // TODO: Implement proper related data fetching when other client actions are ready
        const stats = {
            totalTasks: 0,
            completedTasks: 0,
            totalMilestones: 0,
            completedMilestones: 0,
            totalIssues: 0,
            openIssues: 0,
            totalCrews: 0
        };

        return {
            project,
            milestones: [], // TODO: Fetch from project-milestones-client
            tasks: [],      // TODO: Fetch from tasks-client  
            crews: [],      // TODO: Fetch from project-crews-client
            issues: [],     // TODO: Fetch from projects-issues-client
            client: null,   // TODO: Fetch from clients-client
            contacts: [],   // TODO: Fetch from client-contacts-client
            manager: null,  // TODO: Fetch from crew-members-client
            stats
        };

    } catch (err) {
        console.error("Error in getProjectDetailsByID:", err);
        return null;
    }
};

/**
 * Update project progress with optimistic updates
 */
export const updateProjectProgress = async (
    businessId: string,
    projectId: string,
    progress: number,
    userId?: string
): Promise<{ data?: Project; error?: string }> => {
    try {
        return await updateProjectById(businessId, { id: projectId, progress }, userId || 'system');
    } catch (err) {
        console.error("Error updating project progress:", err);
        return { error: err instanceof Error ? err.message : "Failed to update progress" };
    }
};

// Export compatibility functions for existing code
export {
    getProjects as default,
    createProject as insertProject,
    updateProjectById as updateProject,
    deleteProjectById as deleteProject
};
