"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Task, TaskInsert, TaskUpdate } from "@/types/tasks";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getTasks = async (): Promise<Task[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("tasks", business.id);

        if (error) {
            console.error("Error fetching tasks:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as Task[];
        }

        return data as unknown as Task[];
    } catch (err) {
        console.error("Error in getTasks:", err);
        return [];
    }
}

export const getTaskById = async (id: string): Promise<Task | null> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("tasks", business.id, id);

        if (error) {
            console.error("Error fetching task by ID:", error);
            return null;
        }

        if (data && data[0]) {
            return data[0] as unknown as Task;
        }

        return null;
    } catch (err) {
        console.error("Error in getTaskById:", err);
        return null;
    }
};

export const createTask = async (task: TaskInsert): Promise<Task | null> => {
    try {
        const { business } = await withBusinessServer();

        task = await applyCreated<TaskInsert>(task);

        const { data, error } = await insertWithBusiness("tasks", task, business.id);

        if (error) {
            console.error("Error creating task:", error);
            return null;
        }

        return data as unknown as Task;
    } catch (err) {
        console.error("Error in createTask:", err);
        return null;
    }
}

export const updateTask = async (id: string, task: TaskUpdate): Promise<Task | null> => {
    try {
        const { business } = await withBusinessServer();

        task = await applyUpdated<TaskUpdate>(task);

        const { data, error } = await updateWithBusinessCheck("tasks", id, task, business.id);

        if (error) {
            console.error("Error updating task:", error);
            return null;
        }

        return data as unknown as Task;
    } catch (err) {
        console.error("Error in updateTask:", err);
        return null;
    }
}

export const deleteTask = async (id: string): Promise<boolean> => {
    try {
        const { business } = await withBusinessServer();

        const { error } = await deleteWithBusinessCheck("tasks", id, business.id);

        if (error) {
            console.error("Error deleting task:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteTask:", err);
        return false;
    }
}

export const searchTasks = async (query: string): Promise<Task[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("tasks", business.id, "*", {
            filter: {
                or: [
                    { name: { ilike: `%${query}%` } },
                    { description: { ilike: `%${query}%` } },
                ],
            },
            orderBy: { column: "name", ascending: true },
        });

        if (error) {
            console.error("Error searching tasks:", error);
            return [];
        }

        return data as unknown as Task[];
    } catch (err) {
        console.error("Error in searchTasks:", err);
        return [];
    }
};
