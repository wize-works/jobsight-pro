/**
 * Client-Side Tasks Actions
 * 
 * Replaces src/app/actions/tasks.ts with offline-first implementation.
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

// Task types from Supabase
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

// Extended types for detailed views
export type TaskWithDetails = Task & {
    project_name: string;
    assigned_user_name?: string | null;
    project: {
        id: string;
        name: string;
    };
    assigned_user?: {
        id: string;
        name: string;
    } | null;
};

// Status and priority types
export type TaskStatus = "to_do" | "in_progress" | "completed" | "on_hold" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

// Create client-side task actions
const insertTask = createInsertAction('tasks', 'high');
const updateTaskAction = createUpdateAction('tasks', 'high');
const deleteTaskAction = createDeleteAction('tasks', 'high');
const selectTasks = createSelectAction('tasks');

/**
 * Get all tasks for a business - works offline with server fallback
 */
export const getTasks = async (businessId: string): Promise<Task[]> => {
    try {
        // Try client-side (IndexedDB) first
        const result = await selectTasks({}, businessId);

        if (result.error) {
            console.error("Error fetching tasks from IndexedDB:", result.error);
        }

        const clientData = (result.data || []) as Task[];

        // If we have data from IndexedDB, return it
        if (clientData.length > 0) {
            console.log(`✅ Tasks loaded from IndexedDB: ${clientData.length} tasks`);
            return clientData;
        }

        // Fallback to server if IndexedDB is empty
        console.log('🔄 IndexedDB empty, falling back to server for tasks...');

        try {
            // Import server action dynamically to avoid bundling issues
            const { getTasks: getTasksServer } = await import('@/app/actions/tasks');
            const serverData = await getTasksServer(businessId);

            if (serverData.length > 0) {
                console.log(`✅ Tasks loaded from server: ${serverData.length} tasks`);

                // Cache server data to IndexedDB for future offline use
                try {
                    const { cacheData } = await import('@/lib/offline/storage');
                    await cacheData('tasks', serverData, businessId);
                    console.log(`💾 Cached ${serverData.length} tasks to IndexedDB`);
                } catch (cacheError) {
                    console.warn('⚠️ Failed to cache tasks data:', cacheError);
                }

                return serverData;
            }
        } catch (serverError) {
            console.error('❌ Server fallback failed for tasks:', serverError);
        }

        console.log('📭 No tasks found in IndexedDB or server');
        return [];
    } catch (err) {
        console.error("Error in getTasks:", err);
        return [];
    }
};

/**
 * Get task by ID - works offline
 */
export const getTaskById = async (businessId: string, id: string): Promise<Task | null> => {
    try {
        const tasks = await getTasks(businessId);
        const task = tasks.find(t => t.id === id);

        if (!task) {
            console.warn(`Task with ID ${id} not found`);
            return null;
        }

        return task;
    } catch (err) {
        console.error("Error in getTaskById:", err);
        return null;
    }
};

/**
 * Create new task - works offline with optimistic updates
 */
export const createTask = async (
    businessId: string,
    task: TaskInsert
): Promise<Task | null> => {
    try {
        // Ensure required fields
        const taskData = {
            ...task,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: task.status || 'to_do',
            priority: task.priority || 'medium',
            progress: task.progress || 0,
        };

        const result = await insertTask(taskData, businessId);

        if (result.error) {
            console.error("Error creating task:", result.error);
            return null;
        }

        return result.data as Task;
    } catch (err) {
        console.error("Error in createTask:", err);
        return null;
    }
};

/**
 * Update task - works offline with optimistic updates
 */
export const updateTask = async (
    businessId: string,
    id: string,
    task: TaskUpdate
): Promise<Task | null> => {
    try {
        const updateData = {
            ...task,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateTaskAction(updateData, businessId);

        if (result.error) {
            console.error("Error updating task:", result.error);
            return null;
        }

        return result.data as Task;
    } catch (err) {
        console.error("Error in updateTask:", err);
        return null;
    }
};

/**
 * Quick update task - works offline with optimistic updates
 */
export const quickUpdateTask = async (
    businessId: string,
    id: string,
    updates: Partial<TaskUpdate>
): Promise<Task | null> => {
    try {
        const updateData = {
            ...updates,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateTaskAction(updateData, businessId);

        if (result.error) {
            console.error("Error quick updating task:", result.error);
            return null;
        }

        return result.data as Task;
    } catch (err) {
        console.error("Error in quickUpdateTask:", err);
        return null;
    }
};

/**
 * Delete task - works offline with optimistic updates
 */
export const deleteTask = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteTaskAction({ id }, businessId);

        if (result.error) {
            console.error("Error deleting task:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteTask:", err);
        return false;
    }
};

/**
 * Search tasks - works offline
 */
export const searchTasks = async (businessId: string, query: string): Promise<Task[]> => {
    try {
        const allTasks = await getTasks(businessId);

        if (!query.trim()) {
            return allTasks;
        }

        // Simple client-side search - could be enhanced
        const searchLower = query.toLowerCase();
        return allTasks.filter(task =>
            task.name?.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower) ||
            task.project_id?.toLowerCase().includes(searchLower)
        );
    } catch (err) {
        console.error("Error in searchTasks:", err);
        return [];
    }
};

/**
 * Get tasks by project ID - works offline
 */
export const getTasksByProjectId = async (businessId: string, id: string): Promise<TaskWithDetails[]> => {
    try {
        const allTasks = await getTasks(businessId);
        const projectTasks = allTasks.filter(task => task.project_id === id);

        // Return tasks with placeholder details since project/user data relationships 
        // need additional implementation for offline caching
        // TODO: Implement project and user data caching and joining
        return projectTasks.map(task => ({
            ...task,
            project_name: "Loading...", // Placeholder - implement project lookup
            assigned_user_name: "Loading...", // Placeholder - implement user lookup
            project: {
                id: task.project_id,
                name: "Loading..."
            },
            assigned_user: task.assigned_to ? {
                id: task.assigned_to,
                name: "Loading..."
            } : null
        })) as TaskWithDetails[];

    } catch (err) {
        console.error("Error in getTasksByProjectId:", err);
        return [];
    }
};

/**
 * Get tasks with details - works offline
 */
export const getTasksWithDetails = async (businessId: string): Promise<TaskWithDetails[]> => {
    try {
        const tasks = await getTasks(businessId);

        // Return tasks with placeholder details since project/user data relationships 
        // need additional implementation for offline caching
        // TODO: Implement project and user data caching and joining
        return tasks.map(task => ({
            ...task,
            project_name: "Loading...", // Placeholder - implement project lookup
            assigned_user_name: "Loading...", // Placeholder - implement user lookup
            project: {
                id: task.project_id,
                name: "Loading..."
            },
            assigned_user: task.assigned_to ? {
                id: task.assigned_to,
                name: "Loading..."
            } : null
        })) as TaskWithDetails[];

    } catch (err) {
        console.error("Error in getTasksWithDetails:", err);
        return [];
    }
};

/**
 * Get task details by ID - works offline (legacy compatibility)
 */
export const getTaskDetailsByID = async (businessId: string, id: string) => {
    try {
        const task = await getTaskById(businessId, id);

        if (!task) {
            throw new Error(`Task with ID ${id} not found`);
        }

        // Return structure similar to server version but with offline placeholders
        return {
            task,
            project: { name: "Loading..." }, // Placeholder
            assigned_user: { name: "Loading..." }, // Placeholder
            subtasks: [], // TODO: Implement subtasks lookup
            notes: [], // TODO: Implement task notes lookup
            attachments: [], // TODO: Implement attachments lookup
            comments: [], // TODO: Implement comments lookup
            dependencies: [], // TODO: Implement dependencies lookup
            time_entries: [], // TODO: Implement time tracking lookup
            status_history: [] // TODO: Implement status history lookup
        };
    } catch (err) {
        console.error("Error in getTaskDetailsByID:", err);
        throw err;
    }
};

/**
 * Get tasks with stats - works offline
 */
export const getTasksWithStats = async (businessId: string) => {
    try {
        const tasks = await getTasks(businessId);

        // Calculate basic stats from task data
        const stats = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
            todoTasks: tasks.filter(t => t.status === 'to_do').length,
            onHoldTasks: tasks.filter(t => t.status === 'on_hold').length,
            cancelledTasks: tasks.filter(t => t.status === 'cancelled').length,
            highPriorityTasks: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
            overdueTasks: tasks.filter(t =>
                t.end_date && new Date(t.end_date) < new Date() && t.status !== 'completed'
            ).length,
            avgProgress: tasks.length > 0
                ? tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length
                : 0,
            completionRate: tasks.length > 0
                ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100
                : 0
        };

        return {
            tasks,
            stats,
            byStatus: tasks.reduce((acc, t) => {
                const status = t.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            byPriority: tasks.reduce((acc, t) => {
                const priority = t.priority || 'unknown';
                acc[priority] = (acc[priority] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            byProject: tasks.reduce((acc, t) => {
                const projectId = t.project_id || 'unknown';
                acc[projectId] = (acc[projectId] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };
    } catch (err) {
        console.error("Error in getTasksWithStats:", err);
        return {
            tasks: [],
            stats: {
                totalTasks: 0,
                completedTasks: 0,
                inProgressTasks: 0,
                todoTasks: 0,
                onHoldTasks: 0,
                cancelledTasks: 0,
                highPriorityTasks: 0,
                overdueTasks: 0,
                avgProgress: 0,
                completionRate: 0
            },
            byStatus: {},
            byPriority: {},
            byProject: {}
        };
    }
};

// Export compatibility functions for existing code
export {
    getTasks as default,
    createTask as insertTask
};
