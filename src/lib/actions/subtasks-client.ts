/**
 * Client-Side Subtasks Actions
 * 
 * Replaces src/app/actions/subtasks.ts with offline-first implementation.
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

// Extract Supabase types for subtasks
type Subtask = Database['public']['Tables']['subtasks']['Row'];
type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert'];
type SubtaskUpdate = Partial<Database['public']['Tables']['subtasks']['Update']>;

// Extended types for subtasks with additional data
type SubtaskWithDetails = Subtask & {
    task_name: string;
    assigned_to_name?: string;
    completion_percentage: number;
};

// Create client-side subtask actions
const insertSubtask = createInsertAction('subtasks', 'high');
const updateSubtask = createUpdateAction('subtasks', 'high');
const deleteSubtask = createDeleteAction('subtasks', 'medium');
const selectSubtasks = createSelectAction('subtasks');

/**
 * Get all subtasks for a business - works offline
 */
export const getSubtasks = async (businessId: string): Promise<Subtask[]> => {
    try {
        const result = await selectSubtasks({}, businessId);

        if (result.error) {
            console.error("Error fetching subtasks:", result.error);
            return [];
        }

        let subtasks = (result.data || []) as Subtask[];

        // Filter by business
        subtasks = subtasks.filter(st => st.business_id === businessId);

        // Sort by creation date, newest first
        return subtasks.sort((a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    } catch (err) {
        console.error("Error in getSubtasks:", err);
        return [];
    }
};

/**
 * Get subtask by ID - works offline
 */
export const getSubtaskById = async (businessId: string, id: string): Promise<Subtask | null> => {
    try {
        const subtasks = await getSubtasks(businessId);
        const subtask = subtasks.find(st => st.id === id);

        if (!subtask) {
            console.warn(`Subtask with ID ${id} not found`);
            return null;
        }

        return subtask;
    } catch (err) {
        console.error("Error in getSubtaskById:", err);
        return null;
    }
};

/**
 * Create new subtask - works offline with optimistic updates
 */
export const createSubtask = async (
    data: SubtaskInsert,
    businessId: string,
    userId?: string
): Promise<{ data?: Subtask; error?: string }> => {
    try {
        // Ensure required fields
        const subtaskData = {
            ...data,
            id: data.id || uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            created_by: userId || data.created_by || null,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by || null,
            status: data.status || 'pending',
            priority: data.priority || 'medium',
        };

        const result = await insertSubtask(subtaskData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Subtask };
    } catch (err) {
        console.error("Error in createSubtask:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update subtask - works offline with optimistic updates
 */
export const updateSubtaskById = async (
    id: string,
    data: SubtaskUpdate,
    businessId: string,
    userId?: string
): Promise<{ data?: Subtask; error?: string }> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by || null,
        };

        const result = await updateSubtask(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Subtask };
    } catch (err) {
        console.error("Error in updateSubtaskById:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Delete subtask - works offline with optimistic updates
 */
export const deleteSubtaskById = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteSubtask({ id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteSubtaskById:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get subtasks by parent task - works offline
 */
export const getSubtasksByTask = async (businessId: string, taskId: string): Promise<Subtask[]> => {
    try {
        const subtasks = await getSubtasks(businessId);
        return subtasks.filter(st => st.task_id === taskId);
    } catch (err) {
        console.error("Error in getSubtasksByTask:", err);
        return [];
    }
};

/**
 * Get subtasks by status - works offline
 */
export const getSubtasksByStatus = async (businessId: string, status: string): Promise<Subtask[]> => {
    try {
        const subtasks = await getSubtasks(businessId);
        return subtasks.filter(st => st.status === status);
    } catch (err) {
        console.error("Error in getSubtasksByStatus:", err);
        return [];
    }
};

/**
 * Get subtasks by assignee - works offline
 */
export const getSubtasksByAssignee = async (businessId: string, assigneeId: string): Promise<Subtask[]> => {
    try {
        const subtasks = await getSubtasks(businessId);
        return subtasks.filter(st => st.assigned_to === assigneeId);
    } catch (err) {
        console.error("Error in getSubtasksByAssignee:", err);
        return [];
    }
};

/**
 * Get subtasks by priority - works offline
 */
export const getSubtasksByPriority = async (businessId: string, priority: string): Promise<Subtask[]> => {
    try {
        const subtasks = await getSubtasks(businessId);
        return subtasks.filter(st => st.priority === priority);
    } catch (err) {
        console.error("Error in getSubtasksByPriority:", err);
        return [];
    }
};

/**
 * Mark subtask as completed - works offline
 */
export const markSubtaskCompleted = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ data?: Subtask; error?: string }> => {
    return updateSubtaskById(id, {
        status: 'completed',
    }, businessId, userId);
};

/**
 * Mark subtask as in progress - works offline
 */
export const markSubtaskInProgress = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ data?: Subtask; error?: string }> => {
    return updateSubtaskById(id, {
        status: 'in_progress',
    }, businessId, userId);
};

/**
 * Assign subtask to user - works offline
 */
export const assignSubtask = async (
    id: string,
    assigneeId: string,
    businessId: string,
    userId?: string
): Promise<{ data?: Subtask; error?: string }> => {
    return updateSubtaskById(id, {
        assigned_to: assigneeId,
    }, businessId, userId);
};

/**
 * Update subtask priority - works offline
 */
export const updateSubtaskPriority = async (
    id: string,
    priority: string,
    businessId: string,
    userId?: string
): Promise<{ data?: Subtask; error?: string }> => {
    return updateSubtaskById(id, {
        priority: priority,
    }, businessId, userId);
};

/**
 * Get subtasks with details - works offline
 */
export const getSubtasksWithDetails = async (businessId: string): Promise<SubtaskWithDetails[]> => {
    try {
        const subtasks = await getSubtasks(businessId);

        // TODO: Implement task and user name lookup from cached data
        return subtasks.map(subtask => {
            // Simple completion percentage based on status
            let completionPercentage = 0;
            switch (subtask.status) {
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
                ...subtask,
                task_name: "Loading...", // Placeholder - implement task lookup
                assigned_to_name: subtask.assigned_to ? "Loading..." : undefined, // Placeholder - implement user lookup
                completion_percentage: completionPercentage
            };
        }) as SubtaskWithDetails[];

    } catch (err) {
        console.error("Error in getSubtasksWithDetails:", err);
        return [];
    }
};

/**
 * Get subtask statistics for a task - works offline
 */
export const getTaskSubtaskStats = async (businessId: string, taskId: string): Promise<{
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    completion_percentage: number;
}> => {
    try {
        const subtasks = await getSubtasksByTask(businessId, taskId);

        const total = subtasks.length;
        const completed = subtasks.filter(st => st.status === 'completed').length;
        const in_progress = subtasks.filter(st => st.status === 'in_progress').length;
        const pending = subtasks.filter(st => st.status === 'pending').length;

        const completion_percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            in_progress,
            pending,
            completion_percentage
        };
    } catch (err) {
        console.error("Error in getTaskSubtaskStats:", err);
        return {
            total: 0,
            completed: 0,
            in_progress: 0,
            pending: 0,
            completion_percentage: 0
        };
    }
};

/**
 * Bulk update subtask status for a task - works offline
 */
export const bulkUpdateSubtaskStatus = async (
    taskId: string,
    status: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; updated: number; error?: string }> => {
    try {
        const subtasks = await getSubtasksByTask(businessId, taskId);

        const updatePromises = subtasks.map(subtask =>
            updateSubtaskById(subtask.id, { status }, businessId, userId)
        );

        const results = await Promise.all(updatePromises);

        // Count successful updates
        const successfulUpdates = results.filter(result => !result.error).length;
        const failedUpdates = results.filter(result => result.error);

        if (failedUpdates.length > 0) {
            console.error("Some subtasks failed to update:", failedUpdates);
        }

        return {
            success: failedUpdates.length === 0,
            updated: successfulUpdates,
            error: failedUpdates.length > 0 ? "Some subtasks failed to update" : undefined
        };
    } catch (err) {
        console.error("Error in bulkUpdateSubtaskStatus:", err);
        return { success: false, updated: 0, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Check if subtask operations are pending sync
 */
export const getSubtaskSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending subtask operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0
    };
};

// Export compatibility functions for existing code
export {
    getSubtasks as default,
    createSubtask as insertSubtask,
    updateSubtaskById as updateSubtask,
    deleteSubtaskById as deleteSubtask
};
