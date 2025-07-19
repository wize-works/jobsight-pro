import { createServerClient } from '@/lib/supabase';
import { serverFetchByBusiness, serverDeleteWithBusinessCheck, serverUpdateWithBusinessCheck, serverInsertWithBusiness } from '@/lib/db';
import { Task, TaskInsert, TaskUpdate, TaskWithDetails } from '@/types/tasks';

/**
 * Server-side utility to get all tasks for a business
 * Replaces server action for API route usage
 */
export async function getTasksServer(businessId: string): Promise<Task[]> {
    try {
        const { data, error } = await serverFetchByBusiness("tasks", businessId);

        if (error) {
            console.error("Error fetching tasks:", error);
            return [];
        }

        return (data as unknown as Task[]) || [];
    } catch (err) {
        console.error("Error in getTasksServer:", err);
        return [];
    }
}

/**
 * Server-side utility to get tasks with details (joined with related tables)
 * Replaces server action for API route usage
 */
export async function getTasksWithDetailsServer(businessId: string): Promise<TaskWithDetails[]> {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            console.error("Supabase client not initialized");
            return [];
        }

        const { data, error } = await supabase
            .from("tasks")
            .select(`
                *,
                projects!inner(id, name),
                crews(id, name),
                assigned_user:users!tasks_assigned_to_fkey(id, first_name, last_name, email)
            `)
            .eq("business_id", businessId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching tasks with details:", error);
            return [];
        }

        return (data as unknown as TaskWithDetails[]) || [];
    } catch (err) {
        console.error("Error in getTasksWithDetailsServer:", err);
        return [];
    }
}

/**
 * Server-side utility to get a task by ID
 * Replaces server action for API route usage
 */
export async function getTaskByIdServer(businessId: string, id: string): Promise<Task | null> {
    try {
        const { data, error } = await serverFetchByBusiness("tasks", businessId, "*", {
            filter: { id }
        });

        if (error) {
            console.error("Error fetching task by ID:", error);
            return null;
        }

        if (data && data.length > 0) {
            return data[0] as unknown as Task;
        }

        return null;
    } catch (err) {
        console.error("Error in getTaskByIdServer:", err);
        return null;
    }
}

/**
 * Server-side utility to create a new task
 * Replaces server action for API route usage
 */
export async function createTaskServer(businessId: string, userId: string, task: TaskInsert): Promise<Task | null> {
    try {
        const taskWithTimestamp = {
            ...task,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await serverInsertWithBusiness(
            "tasks",
            taskWithTimestamp,
            businessId,
            userId
        );

        if (error) {
            console.error("Error creating task:", error);
            return null;
        }

        return data as unknown as Task;
    } catch (err) {
        console.error("Error in createTaskServer:", err);
        return null;
    }
}

/**
 * Server-side utility to update a task
 * Replaces server action for API route usage
 */
export async function updateTaskServer(businessId: string, userId: string, id: string, task: TaskUpdate): Promise<Task | null> {
    try {
        const taskWithTimestamp = {
            ...task,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await serverUpdateWithBusinessCheck(
            "tasks",
            id,
            taskWithTimestamp,
            businessId,
            userId
        );

        if (error) {
            console.error("Error updating task:", error);
            return null;
        }

        return data as unknown as Task;
    } catch (err) {
        console.error("Error in updateTaskServer:", err);
        return null;
    }
}

/**
 * Server-side utility to quickly update a task (minimal fields)
 * Replaces server action for API route usage
 */
export async function quickUpdateTaskServer(businessId: string, userId: string, id: string, updates: Partial<TaskUpdate>): Promise<Task | null> {
    try {
        const taskWithTimestamp = {
            ...updates,
            updated_at: new Date().toISOString(),
        } as TaskUpdate;

        const { data, error } = await serverUpdateWithBusinessCheck(
            "tasks",
            id,
            taskWithTimestamp,
            businessId,
            userId
        );

        if (error) {
            console.error("Error quick updating task:", error);
            return null;
        }

        return data as unknown as Task;
    } catch (err) {
        console.error("Error in quickUpdateTaskServer:", err);
        return null;
    }
}

/**
 * Server-side utility to delete a task
 * Replaces server action for API route usage
 */
export async function deleteTaskServer(businessId: string, id: string): Promise<boolean> {
    try {
        const { error } = await serverDeleteWithBusinessCheck("tasks", id, businessId);

        if (error) {
            console.error("Error deleting task:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteTaskServer:", err);
        return false;
    }
}

/**
 * Server-side utility to search tasks
 * Replaces server action for API route usage
 */
export async function searchTasksServer(businessId: string, query: string): Promise<Task[]> {
    try {
        const { data, error } = await serverFetchByBusiness("tasks", businessId, "*", {
            filter: {
                or: [
                    { name: { ilike: `%${query}%` } },
                    { description: { ilike: `%${query}%` } },
                ],
            },
        });

        if (error) {
            console.error("Error searching tasks:", error);
            return [];
        }

        return (data as unknown as Task[]) || [];
    } catch (err) {
        console.error("Error in searchTasksServer:", err);
        return [];
    }
}
