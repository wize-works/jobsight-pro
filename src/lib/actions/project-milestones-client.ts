/**
 * Client-Side Project Milestones Actions
 * 
 * Replaces src/app/actions/project-milestones.ts with offline-first implementation.
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

// Extract Supabase types for project milestones
type ProjectMilestone = Database['public']['Tables']['project_milestones']['Row'];
type ProjectMilestoneInsert = Database['public']['Tables']['project_milestones']['Insert'];
type ProjectMilestoneUpdate = Database['public']['Tables']['project_milestones']['Update'];

// Extended types for project milestones with additional data
type ProjectMilestoneWithDetails = ProjectMilestone & {
    project_name: string;
    is_overdue: boolean;
    days_until_due: number | null;
    completion_percentage: number;
};

// Create client-side project milestone actions
const insertProjectMilestone = createInsertAction('project_milestones', 'high');
const updateProjectMilestone = createUpdateAction('project_milestones', 'high');
const deleteProjectMilestone = createDeleteAction('project_milestones', 'medium');
const selectProjectMilestones = createSelectAction('project_milestones');

/**
 * Get all project milestones for a business - works offline
 */
export const getProjectMilestones = async (businessId: string): Promise<ProjectMilestone[]> => {
    try {
        const result = await selectProjectMilestones({}, businessId);

        if (result.error) {
            console.error("Error fetching project milestones:", result.error);
            return [];
        }

        let milestones = (result.data || []) as ProjectMilestone[];

        // Filter by business
        milestones = milestones.filter(m => m.business_id === businessId);

        // Sort by due date, earliest first
        return milestones.sort((a, b) => {
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
    } catch (err) {
        console.error("Error in getProjectMilestones:", err);
        return [];
    }
};

/**
 * Get project milestone by ID - works offline
 */
export const getProjectMilestoneById = async (businessId: string, id: string): Promise<ProjectMilestone | null> => {
    try {
        const milestones = await getProjectMilestones(businessId);
        const milestone = milestones.find(m => m.id === id);

        if (!milestone) {
            console.warn(`Project milestone with ID ${id} not found`);
            return null;
        }

        return milestone;
    } catch (err) {
        console.error("Error in getProjectMilestoneById:", err);
        return null;
    }
};

/**
 * Create new project milestone - works offline with optimistic updates
 */
export const createProjectMilestone = async (
    data: ProjectMilestoneInsert,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectMilestone; error?: string }> => {
    try {
        // Ensure required fields
        const milestoneData = {
            ...data,
            id: data.id || uuidv4(),
            business_id: businessId,
            created_at: data.created_at || new Date().toISOString(),
            created_by: data.created_by || userId || null,
            updated_at: data.updated_at || new Date().toISOString(),
            updated_by: data.updated_by || userId || null,
            status: data.status || 'pending',
        };

        const result = await insertProjectMilestone(milestoneData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as ProjectMilestone };
    } catch (err) {
        console.error("Error in createProjectMilestone:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update project milestone - works offline with optimistic updates
 */
export const updateProjectMilestoneById = async (
    id: string,
    data: ProjectMilestoneUpdate,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectMilestone; error?: string }> => {
    try {
        const updateData = {
            ...data,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by || null,
        };

        const result = await updateProjectMilestone(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as ProjectMilestone };
    } catch (err) {
        console.error("Error in updateProjectMilestoneById:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Delete project milestone - works offline with optimistic updates
 */
export const deleteProjectMilestoneById = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteProjectMilestone({ id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteProjectMilestoneById:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get milestones by project - works offline
 */
export const getMilestonesByProject = async (businessId: string, projectId: string): Promise<ProjectMilestone[]> => {
    try {
        const milestones = await getProjectMilestones(businessId);
        return milestones.filter(m => m.project_id === projectId);
    } catch (err) {
        console.error("Error in getMilestonesByProject:", err);
        return [];
    }
};

/**
 * Get milestones by status - works offline
 */
export const getMilestonesByStatus = async (businessId: string, status: string): Promise<ProjectMilestone[]> => {
    try {
        const milestones = await getProjectMilestones(businessId);
        return milestones.filter(m => m.status === status);
    } catch (err) {
        console.error("Error in getMilestonesByStatus:", err);
        return [];
    }
};

/**
 * Get overdue milestones - works offline
 */
export const getOverdueMilestones = async (businessId: string): Promise<ProjectMilestone[]> => {
    try {
        const milestones = await getProjectMilestones(businessId);
        const currentDate = new Date();

        return milestones.filter(m => {
            if (!m.due_date || m.status === 'completed') return false;
            return new Date(m.due_date) < currentDate;
        });
    } catch (err) {
        console.error("Error in getOverdueMilestones:", err);
        return [];
    }
};

/**
 * Get upcoming milestones (due within specified days) - works offline
 */
export const getUpcomingMilestones = async (businessId: string, daysAhead: number = 7): Promise<ProjectMilestone[]> => {
    try {
        const milestones = await getProjectMilestones(businessId);
        const currentDate = new Date();
        const futureDate = new Date();
        futureDate.setDate(currentDate.getDate() + daysAhead);

        return milestones.filter(m => {
            if (!m.due_date || m.status === 'completed') return false;
            const dueDate = new Date(m.due_date);
            return dueDate >= currentDate && dueDate <= futureDate;
        });
    } catch (err) {
        console.error("Error in getUpcomingMilestones:", err);
        return [];
    }
};

/**
 * Mark milestone as completed - works offline
 */
export const markMilestoneCompleted = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectMilestone; error?: string }> => {
    return updateProjectMilestoneById(id, {
        status: 'completed',
    }, businessId, userId);
};

/**
 * Mark milestone as in progress - works offline
 */
export const markMilestoneInProgress = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectMilestone; error?: string }> => {
    return updateProjectMilestoneById(id, {
        status: 'in_progress',
    }, businessId, userId);
};

/**
 * Update milestone due date - works offline
 */
export const updateMilestoneDueDate = async (
    id: string,
    dueDate: string | null,
    businessId: string,
    userId?: string
): Promise<{ data?: ProjectMilestone; error?: string }> => {
    return updateProjectMilestoneById(id, {
        due_date: dueDate,
    }, businessId, userId);
};

/**
 * Get milestones with details - works offline
 */
export const getMilestonesWithDetails = async (businessId: string): Promise<ProjectMilestoneWithDetails[]> => {
    try {
        const milestones = await getProjectMilestones(businessId);
        const currentDate = new Date();

        // TODO: Implement project name lookup from cached data
        return milestones.map(milestone => {
            const dueDate = milestone.due_date ? new Date(milestone.due_date) : null;
            const isOverdue = dueDate ? (dueDate < currentDate && milestone.status !== 'completed') : false;
            const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

            // Simple completion percentage based on status
            let completionPercentage = 0;
            switch (milestone.status) {
                case 'completed':
                    completionPercentage = 100;
                    break;
                case 'in_progress':
                    completionPercentage = 50;
                    break;
                case 'pending':
                default:
                    completionPercentage = 0;
                    break;
            }

            return {
                ...milestone,
                project_name: "Loading...", // Placeholder - implement project lookup
                is_overdue: isOverdue,
                days_until_due: daysUntilDue,
                completion_percentage: completionPercentage
            };
        }) as ProjectMilestoneWithDetails[];

    } catch (err) {
        console.error("Error in getMilestonesWithDetails:", err);
        return [];
    }
};

/**
 * Get milestone statistics for a project - works offline
 */
export const getProjectMilestoneStats = async (businessId: string, projectId: string): Promise<{
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    overdue: number;
    completion_percentage: number;
}> => {
    try {
        const milestones = await getMilestonesByProject(businessId, projectId);
        const currentDate = new Date();

        const total = milestones.length;
        const completed = milestones.filter(m => m.status === 'completed').length;
        const in_progress = milestones.filter(m => m.status === 'in_progress').length;
        const pending = milestones.filter(m => m.status === 'pending').length;
        const overdue = milestones.filter(m => {
            if (!m.due_date || m.status === 'completed') return false;
            return new Date(m.due_date) < currentDate;
        }).length;

        const completion_percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            in_progress,
            pending,
            overdue,
            completion_percentage
        };
    } catch (err) {
        console.error("Error in getProjectMilestoneStats:", err);
        return {
            total: 0,
            completed: 0,
            in_progress: 0,
            pending: 0,
            overdue: 0,
            completion_percentage: 0
        };
    }
};

/**
 * Check if project milestone operations are pending sync
 */
export const getProjectMilestoneSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending milestone operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0
    };
};

// Export compatibility functions for existing code
export {
    getProjectMilestones as default,
    createProjectMilestone as insertProjectMilestone,
    updateProjectMilestoneById as updateProjectMilestone,
    deleteProjectMilestoneById as deleteProjectMilestone
};
