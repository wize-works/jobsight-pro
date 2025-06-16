"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { TaskNote, TaskNoteInsert, TaskNoteUpdate } from "@/types/task-notes";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";


export const getTaskNotes = async (businessId: string): Promise<TaskNote[]> => {


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

export const getTaskNoteById = async (businessId: string, id: string): Promise<TaskNote | null> => {


    const { data, error } = await fetchByBusiness("task_notes", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching task note by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as TaskNote;
    }

    return null;
};

export const createTaskNote = async (businessId: string, note: TaskNoteInsert): Promise<TaskNote | null> => {


    note = await applyCreated<TaskNoteInsert>(note);

    const { data, error } = await insertWithBusiness("task_notes", note, businessId);

    if (error) {
        console.error("Error creating task note:", error);
        return null;
    }

    return data as unknown as TaskNote;
}

export const updateTaskNote = async (businessId: string, id: string, note: TaskNoteUpdate): Promise<TaskNote | null> => {


    note = await applyUpdated<TaskNoteUpdate>(note);

    const { data, error } = await updateWithBusinessCheck("task_notes", id, note, businessId);

    if (error) {
        console.error("Error updating task note:", error);
        return null;
    }

    return data as unknown as TaskNote;
}

export const deleteTaskNote = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("task_notes", id, businessId);

    if (error) {
        console.error("Error deleting task note:", error);
        return false;
    }

    return true;
}

export const searchTaskNotes = async (businessId: string, query: string): Promise<TaskNote[]> => {


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
