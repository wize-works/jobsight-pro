"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Subtask, SubtaskInsert, SubtaskUpdate } from "@/types/subtasks";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getSubtasks = async (): Promise<Subtask[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch subtasks.");
        return [];
    }

    const { data, error } = await fetchByBusiness("subtasks", businessId);

    if (error) {
        console.error("Error fetching subtasks:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Subtask[];
    }

    return data as unknown as Subtask[];
}

export const getSubtaskById = async (id: string): Promise<Subtask | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch subtasks.");
        return null;
    }

    const { data, error } = await fetchByBusiness("subtasks", businessId, id);

    if (error) {
        console.error("Error fetching subtask by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as Subtask;
    }

    return null;
};

export const createSubtask = async (subtask: SubtaskInsert): Promise<Subtask | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a subtask.");
        return null;
    }

    const { data, error } = await insertWithBusiness("subtasks", subtask, businessId);

    if (error) {
        console.error("Error creating subtask:", error);
        return null;
    }

    return data as unknown as Subtask;
}

export const updateSubtask = async (id: string, subtask: SubtaskUpdate): Promise<Subtask | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a subtask.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("subtasks", id, subtask, businessId);

    if (error) {
        console.error("Error updating subtask:", error);
        return null;
    }

    return data as unknown as Subtask;
}

export const deleteSubtask = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a subtask.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("subtasks", id, businessId);

    if (error) {
        console.error("Error deleting subtask:", error);
        return false;
    }

    return true;
}

export const searchSubtasks = async (query: string): Promise<Subtask[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search subtasks.");
        return [];
    }

    const { data, error } = await fetchByBusiness("subtasks", businessId, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { description: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error searching subtasks:", error);
        return [];
    }

    return data as unknown as Subtask[];
};
