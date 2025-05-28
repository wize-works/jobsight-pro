"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Subtask, SubtaskInsert, SubtaskUpdate } from "@/types/subtasks";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getSubtasks = async (): Promise<Subtask[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("subtasks", business.id);

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
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("subtasks", business.id, id);

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
    const { business } = await withBusinessServer();

    subtask = await applyCreated<SubtaskInsert>(subtask);

    const { data, error } = await insertWithBusiness("subtasks", subtask, business.id);

    if (error) {
        console.error("Error creating subtask:", error);
        return null;
    }

    return data as unknown as Subtask;
}

export const updateSubtask = async (id: string, subtask: SubtaskUpdate): Promise<Subtask | null> => {
    const { business } = await withBusinessServer();

    subtask = await applyUpdated<SubtaskUpdate>(subtask);

    const { data, error } = await updateWithBusinessCheck("subtasks", id, subtask, business.id);

    if (error) {
        console.error("Error updating subtask:", error);
        return null;
    }

    return data as unknown as Subtask;
}

export const deleteSubtask = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("subtasks", id, business.id);

    if (error) {
        console.error("Error deleting subtask:", error);
        return false;
    }

    return true;
}

export const searchSubtasks = async (query: string): Promise<Subtask[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("subtasks", business.id, "*", {
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
