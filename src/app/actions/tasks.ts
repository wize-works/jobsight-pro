"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Task, TaskInsert, TaskUpdate } from "@/types/tasks";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getTasks = async (): Promise<Task[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch tasks.");
        return [];
    }

    const { data, error } = await fetchByBusiness("tasks", businessId);

    if (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Task[];
    }

    return data as unknown as Task[];
}

export const getTaskById = async (id: string): Promise<Task | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch tasks.");
        return null;
    }

    const { data, error } = await fetchByBusiness("tasks", businessId, id);

    if (error) {
        console.error("Error fetching task by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as Task;
    }

    return null;
};

export const createTask = async (task: TaskInsert): Promise<Task | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a task.");
        return null;
    }

    const { data, error } = await insertWithBusiness("tasks", task, businessId);

    if (error) {
        console.error("Error creating task:", error);
        return null;
    }

    return data as unknown as Task;
}

export const updateTask = async (id: string, task: TaskUpdate): Promise<Task | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a task.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("tasks", id, task, businessId);

    if (error) {
        console.error("Error updating task:", error);
        return null;
    }

    return data as unknown as Task;
}

export const deleteTask = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a task.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("tasks", id, businessId);

    if (error) {
        console.error("Error deleting task:", error);
        return false;
    }

    return true;
}

export const searchTasks = async (query: string): Promise<Task[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search tasks.");
        return [];
    }

    const { data, error } = await fetchByBusiness("tasks", businessId, "*", {
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
};
