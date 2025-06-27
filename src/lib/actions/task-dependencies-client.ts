/**
 * Client-Side Task Dependencies Actions
 * 
 * Replaces src/app/actions/task_dependencies.ts with offline-first implementation.
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

// Extract Supabase types for task dependencies
type TaskDependency = Database['public']['Tables']['task_dependencies']['Row'];
type TaskDependencyInsert = Database['public']['Tables']['task_dependencies']['Insert'];
type TaskDependencyUpdate = Partial<Database['public']['Tables']['task_dependencies']['Update']> & { id: string };

// Create client-side task dependency actions
const insertTaskDependency = createInsertAction('task_dependencies', 'high');
const updateTaskDependency = createUpdateAction('task_dependencies', 'high');
const deleteTaskDependency = createDeleteAction('task_dependencies', 'high');
const selectTaskDependencies = createSelectAction('task_dependencies');

/**
 * Get all task dependencies for a business - works offline
 */
export const getTaskDependencies = async (businessId: string): Promise<TaskDependency[]> => {
    try {
        const result = await selectTaskDependencies({}, businessId);

        if (result.error) {
            console.error("Error fetching task dependencies:", result.error);
            return [];
        }

        return (result.data || []) as TaskDependency[];
    } catch (err) {
        console.error("Error in getTaskDependencies:", err);
        return [];
    }
};

/**
 * Get a task dependency by ID - works offline
 */
export const getTaskDependencyById = async (businessId: string, id: string): Promise<TaskDependency | null> => {
    try {
        const result = await selectTaskDependencies({ id }, businessId);

        if (result.error) {
            console.error("Error fetching task dependency:", result.error);
            return null;
        }

        const dependencies = (result.data || []) as TaskDependency[];
        return dependencies.length > 0 ? dependencies[0] : null;
    } catch (err) {
        console.error("Error in getTaskDependencyById:", err);
        return null;
    }
};

/**
 * Create a new task dependency - works offline
 */
export const createTaskDependency = async (
    businessId: string,
    dependency: Omit<TaskDependencyInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<TaskDependency | null> => {
    try {
        const newTaskDependency: TaskDependencyInsert = {
            ...dependency,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertTaskDependency(newTaskDependency, businessId);

        if (result.error) {
            console.error("Error creating task dependency:", result.error);
            return null;
        }

        return result.data as TaskDependency;
    } catch (err) {
        console.error("Error in createTaskDependency:", err);
        return null;
    }
};

/**
 * Update a task dependency - works offline
 */
export const updateTaskDependencyById = async (
    businessId: string,
    id: string,
    updates: Partial<TaskDependencyUpdate>
): Promise<TaskDependency | null> => {
    try {
        const updateData: TaskDependencyUpdate = {
            ...updates,
            id,
            updated_at: new Date().toISOString()
        };

        const result = await updateTaskDependency(updateData, businessId);

        if (result.error) {
            console.error("Error updating task dependency:", result.error);
            return null;
        }

        return result.data as TaskDependency;
    } catch (err) {
        console.error("Error in updateTaskDependencyById:", err);
        return null;
    }
};

/**
 * Delete a task dependency - works offline
 */
export const deleteTaskDependencyById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteTaskDependency({ id }, businessId);

        if (result.error) {
            console.error("Error deleting task dependency:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteTaskDependencyById:", err);
        return false;
    }
};

/**
 * Get dependencies for a specific task - works offline
 */
export const getTaskDependenciesForTask = async (businessId: string, taskId: string): Promise<TaskDependency[]> => {
    try {
        const allDependencies = await getTaskDependencies(businessId);
        return allDependencies.filter(dep => dep.task_id === taskId);
    } catch (err) {
        console.error("Error in getTaskDependenciesForTask:", err);
        return [];
    }
};

/**
 * Get tasks that depend on a specific task - works offline
 */
export const getTasksDependingOnTask = async (businessId: string, taskId: string): Promise<TaskDependency[]> => {
    try {
        const allDependencies = await getTaskDependencies(businessId);
        return allDependencies.filter(dep => dep.dependency_on_task_id === taskId);
    } catch (err) {
        console.error("Error in getTasksDependingOnTask:", err);
        return [];
    }
};

/**
 * Check if a task depends on another task - works offline
 */
export const isTaskDependentOn = async (businessId: string, taskId: string, dependencyTaskId: string): Promise<boolean> => {
    try {
        const dependencies = await getTaskDependenciesForTask(businessId, taskId);
        return dependencies.some(dep => dep.dependency_on_task_id === dependencyTaskId);
    } catch (err) {
        console.error("Error in isTaskDependentOn:", err);
        return false;
    }
};

/**
 * Get all dependencies for a task recursively (dependency chain) - works offline
 */
export const getTaskDependencyChain = async (businessId: string, taskId: string): Promise<string[]> => {
    try {
        const allDependencies = await getTaskDependencies(businessId);
        const visited = new Set<string>();
        const chain: string[] = [];

        const buildChain = (currentTaskId: string) => {
            if (visited.has(currentTaskId)) {
                return; // Avoid circular dependencies
            }

            visited.add(currentTaskId);
            const deps = allDependencies.filter(dep => dep.task_id === currentTaskId);

            for (const dep of deps) {
                chain.push(dep.dependency_on_task_id);
                buildChain(dep.dependency_on_task_id);
            }
        };

        buildChain(taskId);
        return [...new Set(chain)]; // Remove duplicates
    } catch (err) {
        console.error("Error in getTaskDependencyChain:", err);
        return [];
    }
};

/**
 * Remove all dependencies for a task - works offline
 */
export const removeAllTaskDependencies = async (businessId: string, taskId: string): Promise<boolean> => {
    try {
        const dependencies = await getTaskDependenciesForTask(businessId, taskId);

        const deletePromises = dependencies.map(dep =>
            deleteTaskDependencyById(businessId, dep.id)
        );

        const results = await Promise.all(deletePromises);
        return results.every(result => result === true);
    } catch (err) {
        console.error("Error in removeAllTaskDependencies:", err);
        return false;
    }
};

/**
 * Add multiple dependencies to a task - works offline
 */
export const addTaskDependencies = async (
    businessId: string,
    taskId: string,
    dependencyTaskIds: string[],
    dependencyType: string = 'finish-to-start'
): Promise<TaskDependency[]> => {
    try {
        const createPromises = dependencyTaskIds.map(depTaskId =>
            createTaskDependency(businessId, {
                task_id: taskId,
                dependency_on_task_id: depTaskId,
                dependency_type: dependencyType,
                business_id: businessId,
                created_by: null,
                updated_by: null
            })
        );

        const results = await Promise.all(createPromises);
        return results.filter(result => result !== null) as TaskDependency[];
    } catch (err) {
        console.error("Error in addTaskDependencies:", err);
        return [];
    }
};

/**
 * Get dependency statistics - works offline
 */
export const getTaskDependencyStats = async (businessId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    tasksWithDependencies: number;
    tasksBeingDependedOn: number;
    circularDependencies: string[][];
}> => {
    try {
        const dependencies = await getTaskDependencies(businessId);
        const byType: Record<string, number> = {};
        const tasksWithDeps = new Set<string>();
        const tasksBeingDependedOn = new Set<string>();

        dependencies.forEach(dep => {
            // Count by type
            const type = dep.dependency_type || 'unknown';
            byType[type] = (byType[type] || 0) + 1;

            // Track tasks with dependencies
            tasksWithDeps.add(dep.task_id);
            tasksBeingDependedOn.add(dep.dependency_on_task_id);
        });

        // TODO: Implement circular dependency detection
        const circularDependencies: string[][] = [];

        return {
            total: dependencies.length,
            byType,
            tasksWithDependencies: tasksWithDeps.size,
            tasksBeingDependedOn: tasksBeingDependedOn.size,
            circularDependencies
        };
    } catch (err) {
        console.error("Error in getTaskDependencyStats:", err);
        return {
            total: 0,
            byType: {},
            tasksWithDependencies: 0,
            tasksBeingDependedOn: 0,
            circularDependencies: []
        };
    }
};

/**
 * Validate task dependency data
 */
export const validateTaskDependency = (dependency: Partial<TaskDependencyInsert>): string[] => {
    const errors: string[] = [];

    if (!dependency.task_id || dependency.task_id.trim().length === 0) {
        errors.push('Task ID is required');
    }

    if (!dependency.dependency_on_task_id || dependency.dependency_on_task_id.trim().length === 0) {
        errors.push('Dependency task ID is required');
    }

    if (dependency.task_id === dependency.dependency_on_task_id) {
        errors.push('A task cannot depend on itself');
    }

    const validTypes = ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'];
    if (dependency.dependency_type && !validTypes.includes(dependency.dependency_type)) {
        errors.push(`Invalid dependency type. Must be one of: ${validTypes.join(', ')}`);
    }

    return errors;
};
