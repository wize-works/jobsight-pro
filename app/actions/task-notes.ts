"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { TaskNote, TaskNoteInsert, TaskNoteUpdate } from "@/types/task-notes";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getTaskNotes = async (): Promise<TaskNote[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch task notes.");
        return [];
    }

    const { data, error } = await fetchByBusiness("task_notes", businessId);

    if (error) {
        console.error("Error fetching task notes:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as TaskNote[];
    }

    return data as unknown as TaskNote[];
}

export const getTaskNoteById = async (id: string): Promise<TaskNote | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch task notes.");
        return null;
    }

    const { data, error } = await fetchByBusiness("task_notes", businessId, id);

    if (error) {
        console.error("Error fetching task note by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as TaskNote;
    }

    return null;
};

export const createTaskNote = async (note: TaskNoteInsert): Promise<TaskNote | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a task note.");
        return null;
    }

    const { data, error } = await insertWithBusiness("task_notes", note, businessId);

    if (error) {
        console.error("Error creating task note:", error);
        return null;
    }

    return data as unknown as TaskNote;
}

export const updateTaskNote = async (id: string, note: TaskNoteUpdate): Promise<TaskNote | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a task note.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("task_notes", id, note, businessId);

    if (error) {
        console.error("Error updating task note:", error);
        return null;
    }

    return data as unknown as TaskNote;
}

export const deleteTaskNote = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a task note.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("task_notes", id, businessId);

    if (error) {
        console.error("Error deleting task note:", error);
        return false;
    }

    return true;
}

export const searchTaskNotes = async (query: string): Promise<TaskNote[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search task notes.");
        return [];
    }

    const { data, error } = await fetchByBusiness("task_notes", businessId, "*", {
        filter: {
            or: [
                { note: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching task notes:", error);
        return [];
    }

    return data as unknown as TaskNote[];
};
