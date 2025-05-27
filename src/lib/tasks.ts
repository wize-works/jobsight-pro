import { TaskInsert, TaskUpdate } from "@/types/tasks";
import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "./db";
import { createServerClient } from "./supabase";

// Fetch all tasks for a business
export async function getTasks(businessId: string) {
    return await fetchByBusiness("tasks", businessId, "*", {
        orderBy: { column: "start_date", ascending: true },
    });
}

// Fetch a single task by ID
export async function getTaskById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("tasks", businessId, "*", {
        filter: { id },
    });

    return {
        data: data?.[0] || null,
        error,
    };
}

// Create a new task
export async function createTask(task: Omit<TaskInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("tasks", task, businessId);
}

// Update an existing task
export async function updateTask(id: string, task: TaskUpdate, businessId: string) {
    return await updateWithBusinessCheck("tasks", id, task, businessId);
}

// Delete a task
export async function deleteTask(id: string, businessId: string) {
    return await deleteWithBusinessCheck("tasks", id, businessId);
}

// Get tasks by project
export async function getTasksByProject(projectId: string, businessId: string) {
    return await fetchByBusiness("tasks", businessId, "*", {
        filter: { project_id: projectId },
        orderBy: { column: "start_date", ascending: true },
    });
}

// Get tasks by assigned to
export async function getTasksByAssignedTo(assignedTo: string, businessId: string) {
    return await fetchByBusiness("tasks", businessId, "*", {
        filter: { assigned_to: assignedTo },
        orderBy: { column: "start_date", ascending: true },
    });
}

// Get tasks by status
export async function getTasksByStatus(status: string, businessId: string) {
    return await fetchByBusiness("tasks", businessId, "*", {
        filter: { status },
        orderBy: { column: "start_date", ascending: true },
    });
}

// Get tasks by priority
export async function getTasksByPriority(priority: string, businessId: string) {
    return await fetchByBusiness("tasks", businessId, "*", {
        filter: { priority },
        orderBy: { column: "start_date", ascending: true },
    });
}

// Search tasks by name or description
export async function searchTasks(query: string, businessId: string) {
    const supabase = createServerClient();
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") };
    }

    return await supabase
        .from("tasks")
        .select("*")
        .eq("business_id", businessId)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order("start_date");
}
