"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { TaskDependency, TaskDependencyInsert, TaskDependencyUpdate } from "@/types/task_dependencies";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getTaskDependencies = async (): Promise<TaskDependency[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch task dependencies.");
        return [];
    }

    const { data, error } = await fetchByBusiness("task_dependencies", businessId);

    if (error) {
        console.error("Error fetching task dependencies:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as TaskDependency[];
    }

    return data as unknown as TaskDependency[];
}

export const getTaskDependencyById = async (id: string): Promise<TaskDependency | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch task dependencies.");
        return null;
    }

    const { data, error } = await fetchByBusiness("task_dependencies", businessId, id);

    if (error) {
        console.error("Error fetching task dependency by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as TaskDependency;
    }

    return null;
};

export const createTaskDependency = async (dependency: TaskDependencyInsert): Promise<TaskDependency | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a task dependency.");
        return null;
    }

    const { data, error } = await insertWithBusiness("task_dependencies", dependency, businessId);

    if (error) {
        console.error("Error creating task dependency:", error);
        return null;
    }

    return data as unknown as TaskDependency;
}

export const updateTaskDependency = async (id: string, dependency: TaskDependencyUpdate): Promise<TaskDependency | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a task dependency.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("task_dependencies", id, dependency, businessId);

    if (error) {
        console.error("Error updating task dependency:", error);
        return null;
    }

    return data as unknown as TaskDependency;
}

export const deleteTaskDependency = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a task dependency.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("task_dependencies", id, businessId);

    if (error) {
        console.error("Error deleting task dependency:", error);
        return false;
    }

    return true;
}

export const searchTaskDependencies = async (query: string): Promise<TaskDependency[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search task dependencies.");
        return [];
    }

    const { data, error } = await fetchByBusiness("task_dependencies", businessId, "*", {
        filter: {
            or: [
                { task_id: { ilike: `%${query}%` } },
                { depends_on_task_id: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "task_id", ascending: true },
    });

    if (error) {
        console.error("Error searching task dependencies:", error);
        return [];
    }

    return data as unknown as TaskDependency[];
};
