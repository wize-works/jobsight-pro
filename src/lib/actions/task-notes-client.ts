/**
 * Client-Side Task Notes Actions
 * 
 * Replaces src/app/actions/task-notes.ts with offline-first implementation.
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

// Extract Supabase types for task notes
type TaskNote = Database['public']['Tables']['task_notes']['Row'];
type TaskNoteInsert = Database['public']['Tables']['task_notes']['Insert'];
type TaskNoteUpdate = Partial<Database['public']['Tables']['task_notes']['Update']> & { id: string };

// Create client-side task note actions
const insertTaskNote = createInsertAction('task_notes', 'medium');
const updateTaskNote = createUpdateAction('task_notes', 'medium');
const deleteTaskNote = createDeleteAction('task_notes', 'medium');
const selectTaskNotes = createSelectAction('task_notes');

/**
 * Get all task notes for a business - works offline
 */
export const getTaskNotes = async (businessId: string): Promise<TaskNote[]> => {
    try {
        const result = await selectTaskNotes({}, businessId);

        if (result.error) {
            console.error("Error fetching task notes:", result.error);
            return [];
        }

        return (result.data || []) as TaskNote[];
    } catch (err) {
        console.error("Error in getTaskNotes:", err);
        return [];
    }
};

/**
 * Get a task note by ID - works offline
 */
export const getTaskNoteById = async (businessId: string, id: string): Promise<TaskNote | null> => {
    try {
        const result = await selectTaskNotes({ id }, businessId);

        if (result.error) {
            console.error("Error fetching task note:", result.error);
            return null;
        }

        const taskNotes = (result.data || []) as TaskNote[];
        return taskNotes.length > 0 ? taskNotes[0] : null;
    } catch (err) {
        console.error("Error in getTaskNoteById:", err);
        return null;
    }
};

/**
 * Create a new task note - works offline
 */
export const createTaskNote = async (
    businessId: string,
    note: Omit<TaskNoteInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<TaskNote | null> => {
    try {
        const newTaskNote: TaskNoteInsert = {
            ...note,
            id: uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await insertTaskNote(newTaskNote, businessId);

        if (result.error) {
            console.error("Error creating task note:", result.error);
            return null;
        }

        return result.data as TaskNote;
    } catch (err) {
        console.error("Error in createTaskNote:", err);
        return null;
    }
};

/**
 * Update a task note - works offline
 */
export const updateTaskNoteById = async (
    businessId: string,
    id: string,
    updates: Partial<TaskNoteUpdate>
): Promise<TaskNote | null> => {
    try {
        const updateData: TaskNoteUpdate = {
            ...updates,
            id,
            updated_at: new Date().toISOString()
        };

        const result = await updateTaskNote(updateData, businessId);

        if (result.error) {
            console.error("Error updating task note:", result.error);
            return null;
        }

        return result.data as TaskNote;
    } catch (err) {
        console.error("Error in updateTaskNoteById:", err);
        return null;
    }
};

/**
 * Delete a task note - works offline
 */
export const deleteTaskNoteById = async (businessId: string, id: string): Promise<boolean> => {
    try {
        const result = await deleteTaskNote({ id }, businessId);

        if (result.error) {
            console.error("Error deleting task note:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteTaskNoteById:", err);
        return false;
    }
};

/**
 * Get task notes by task ID - works offline
 */
export const getTaskNotesByTaskId = async (businessId: string, taskId: string): Promise<TaskNote[]> => {
    try {
        const allTaskNotes = await getTaskNotes(businessId);
        return allTaskNotes.filter(note => note.task_id === taskId);
    } catch (err) {
        console.error("Error in getTaskNotesByTaskId:", err);
        return [];
    }
};

/**
 * Get task notes by author ID - works offline
 */
export const getTaskNotesByAuthorId = async (businessId: string, authorId: string): Promise<TaskNote[]> => {
    try {
        const allTaskNotes = await getTaskNotes(businessId);
        return allTaskNotes.filter(note => note.author_id === authorId);
    } catch (err) {
        console.error("Error in getTaskNotesByAuthorId:", err);
        return [];
    }
};

/**
 * Search task notes by content - works offline
 */
export const searchTaskNotes = async (businessId: string, query: string): Promise<TaskNote[]> => {
    try {
        const allTaskNotes = await getTaskNotes(businessId);
        const searchTerm = query.toLowerCase();

        return allTaskNotes.filter((note: TaskNote) =>
            note.content?.toLowerCase().includes(searchTerm)
        );
    } catch (err) {
        console.error("Error in searchTaskNotes:", err);
        return [];
    }
};

/**
 * Get recent task notes - works offline
 */
export const getRecentTaskNotes = async (businessId: string, limit: number = 10): Promise<TaskNote[]> => {
    try {
        const allTaskNotes = await getTaskNotes(businessId);

        // Sort by created_at descending and limit
        return allTaskNotes
            .sort((a, b) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateB - dateA;
            })
            .slice(0, limit);
    } catch (err) {
        console.error("Error in getRecentTaskNotes:", err);
        return [];
    }
};

/**
 * Get task notes for a date range - works offline
 */
export const getTaskNotesForDateRange = async (
    businessId: string,
    startDate: string,
    endDate: string
): Promise<TaskNote[]> => {
    try {
        const allTaskNotes = await getTaskNotes(businessId);
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return allTaskNotes.filter(note => {
            if (!note.date) return false;
            const noteDate = new Date(note.date).getTime();
            return noteDate >= start && noteDate <= end;
        });
    } catch (err) {
        console.error("Error in getTaskNotesForDateRange:", err);
        return [];
    }
};

/**
 * Validate task note data
 */
export const validateTaskNote = (note: Partial<TaskNoteInsert>): string[] => {
    const errors: string[] = [];

    if (!note.task_id || note.task_id.trim().length === 0) {
        errors.push('Task ID is required');
    }

    if (!note.content || note.content.trim().length === 0) {
        errors.push('Note content is required');
    }

    if (note.content && note.content.length > 10000) {
        errors.push('Note content is too long (maximum 10,000 characters)');
    }

    return errors;
};

/**
 * Get task note statistics - works offline
 */
export const getTaskNoteStats = async (businessId: string): Promise<{
    total: number;
    byTaskId: Record<string, number>;
    byAuthor: Record<string, number>;
    recent: number; // notes from last 7 days
}> => {
    try {
        const taskNotes = await getTaskNotes(businessId);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();

        const byTaskId: Record<string, number> = {};
        const byAuthor: Record<string, number> = {};
        let recent = 0;

        taskNotes.forEach(note => {
            // Count by task
            byTaskId[note.task_id] = (byTaskId[note.task_id] || 0) + 1;

            // Count by author
            if (note.author_id) {
                byAuthor[note.author_id] = (byAuthor[note.author_id] || 0) + 1;
            }

            // Count recent notes
            if (note.created_at && new Date(note.created_at).getTime() > sevenDaysAgo) {
                recent++;
            }
        });

        return {
            total: taskNotes.length,
            byTaskId,
            byAuthor,
            recent
        };
    } catch (err) {
        console.error("Error in getTaskNoteStats:", err);
        return { total: 0, byTaskId: {}, byAuthor: {}, recent: 0 };
    }
};
