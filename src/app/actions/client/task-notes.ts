"use client";

/**
 * Task Notes Client Actions - Offline-First Implementation (Phase 4.1 - Task Management Extensions)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { TaskNote, TaskNoteInsert, TaskNoteUpdate } from "@/types/task-notes";
import { db } from "@/lib/offline/dexie-db";
import { initializeAuthState } from "./business";
import { v4 as uuidv4 } from "uuid";

// Global auth state for client actions (imported from business actions)
declare let currentClerkUser: { id: string } | null;
declare let authStateInitialized: boolean;

// Check if we're online
function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

// Get current authenticated user ID (auth_id) from auth system
async function getCurrentUserId(): Promise<string | null> {
    // First priority: Use initialized Clerk user state (when online and available)
    if (authStateInitialized && currentClerkUser?.id) {
        return currentClerkUser.id;
    }

    // Second priority: Get from cached auth_id (for offline scenarios)
    if (typeof window !== 'undefined') {
        const cachedAuthId = window.localStorage.getItem('cached_auth_id');
        if (cachedAuthId) {
            return cachedAuthId;
        }
    }

    // If no auth state available, return null (user needs to authenticate)
    console.warn('No authenticated user found. Ensure initializeAuthState() is called from a React component.');
    return null;
}

// Validate that user has access to the specified business (using auth_id)
async function validateUserBusinessAccess(userAuthId: string, businessId: string): Promise<boolean> {
    try {
        // Check if user has a mapping to this business (using auth_id)
        const userBusinessId = await db.userBusinessMappings.get(userAuthId);
        if (userBusinessId?.businessId === businessId) {
            return true;
        }

        // If no mapping found locally, check with business table
        const business = await db.businesses.get(businessId);
        if (business && business.owner_id === userAuthId) {
            // Create the mapping for future use
            await db.userBusinessMappings.put({
                userId: userAuthId,
                businessId: businessId,
                role: 'owner',
                lastUpdated: Date.now()
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error validating business access:', error);
        return false;
    }
}

// Helper function to add sync operation to queue
async function addToSyncQueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    businessId: string,
    userId?: string
): Promise<void> {
    const syncItem = {
        id: uuidv4(),
        table,
        operation,
        data,
        businessId,
        userId,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    };

    await db.syncQueue.add(syncItem);
}

/**
 * Get all task notes for a task - Offline-first implementation
 * @param businessId - The business ID to get task notes for
 * @param taskId - The task ID to get notes for
 */
export async function getTaskNotes(businessId: string, taskId: string): Promise<TaskNote[]> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return [];
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return [];
        }

        // Verify the task exists and belongs to the business
        const task = await db.tasks.get(taskId);
        if (!task || task.business_id !== businessId) {
            console.warn('Task not found or does not belong to this business');
            return [];
        }

        // Try to get from local cache first
        const cachedNotes = await db.taskNotes
            .where('task_id')
            .equals(taskId)
            .and(note => note.business_id === businessId)
            .sortBy('created_at');

        if (cachedNotes.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 2 minutes for notes)
            const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`task_notes_${taskId}`);

            if (metadata && metadata.lastSync > twoMinutesAgo) {
                return cachedNotes.reverse(); // Most recent first
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/task-notes/task/${taskId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverNotes = await response.json();

                    if (serverNotes && Array.isArray(serverNotes)) {
                        // Update local cache
                        await db.taskNotes.bulkPut(serverNotes);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `task_notes_${taskId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'task_notes'
                        });

                        return serverNotes.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch task notes from server, using cache:', error);
            }
        }

        // Return cached data if available (most recent first)
        return cachedNotes.reverse();

    } catch (error) {
        console.error('Error getting task notes:', error);
        return [];
    }
}

/**
 * Get task note by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param noteId - The note ID to get
 */
export async function getTaskNoteById(businessId: string, noteId: string): Promise<TaskNote | null> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return null;
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return null;
        }

        // Try to get from local cache first
        const cachedNote = await db.taskNotes.get(noteId);

        if (cachedNote && cachedNote.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 2 minutes for notes)
                const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`task_notes_${cachedNote.task_id}`);

                if (metadata && metadata.lastSync > twoMinutesAgo) {
                    return cachedNote;
                }
            } else {
                // If offline, return cached data
                return cachedNote;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/task-notes/${noteId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverNote = await response.json();

                    if (serverNote) {
                        // Update local cache
                        await db.taskNotes.put(serverNote);

                        return serverNote;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch task note from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedNote || null;

    } catch (error) {
        console.error('Error getting task note by ID:', error);
        return null;
    }
}

/**
 * Create task note - Offline-first implementation with authorization
 * @param businessId - The business ID to create note for
 * @param taskId - The task ID to add note to
 * @param noteData - The note data to create
 */
export async function createTaskNote(
    businessId: string,
    taskId: string,
    noteData: TaskNoteInsert
): Promise<{ success: boolean; data?: TaskNote; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required. Please sign in to continue."
            };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "Access denied. You don't have permission to modify this business."
            };
        }

        // Validate task exists and belongs to business
        const task = await db.tasks.get(taskId);
        if (!task || task.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid task or task does not belong to this business."
            };
        }

        const now = new Date().toISOString();
        const noteId = uuidv4();

        // Create task note object
        const newNote: TaskNote = {
            id: noteId,
            task_id: taskId,
            business_id: businessId,
            content: noteData.content || null,
            author_id: currentUserAuthId,
            date: noteData.date || now,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.taskNotes.put(newNote);

        // Queue for sync with server
        await addToSyncQueue(
            'task_notes',
            'insert',
            newNote,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/task-notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...noteData,
                        businessId,
                        taskId,
                        id: noteId
                    }),
                });

                if (response.ok) {
                    const serverNote = await response.json();

                    // Update local data with server response
                    await db.taskNotes.put(serverNote);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('task_notes')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `task_notes_${taskId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'task_notes'
                    });

                    return { success: true, data: serverNote };
                }
            } catch (error) {
                console.warn('Failed to sync task note to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newNote };

    } catch (error) {
        console.error('Error creating task note:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create task note"
        };
    }
}

/**
 * Update task note - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param noteId - The note ID to update
 * @param noteData - The note data to update
 */
export async function updateTaskNote(
    businessId: string,
    noteId: string,
    noteData: TaskNoteUpdate
): Promise<{ success: boolean; data?: TaskNote; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required. Please sign in to continue."
            };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "Access denied. You don't have permission to modify this business."
            };
        }

        // Get current note
        const currentNote = await db.taskNotes.get(noteId);
        if (!currentNote) {
            return {
                success: false,
                error: "Task note not found."
            };
        }

        // Verify the note belongs to the business
        if (currentNote.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Note does not belong to this business."
            };
        }

        // Verify the user can edit this note (only author or business owner)
        if (currentNote.author_id !== currentUserAuthId) {
            const business = await db.businesses.get(businessId);
            if (!business || business.owner_id !== currentUserAuthId) {
                return {
                    success: false,
                    error: "Access denied. You can only edit your own notes."
                };
            }
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<TaskNote> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from noteData
        if (noteData.content !== undefined) updateData.content = noteData.content;
        if (noteData.date !== undefined) updateData.date = noteData.date;

        // Update locally first (optimistic update)
        const updatedNote = { ...currentNote, ...updateData };
        await db.taskNotes.put(updatedNote);

        // Queue for sync with server
        await addToSyncQueue(
            'task_notes',
            'update',
            updatedNote,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/task-notes/${noteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverNote = await response.json();

                    // Update local data with server response
                    await db.taskNotes.put(serverNote);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('task_notes')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `task_notes_${currentNote.task_id}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'task_notes'
                    });

                    return { success: true, data: serverNote };
                }
            } catch (error) {
                console.warn('Failed to sync task note update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedNote };

    } catch (error) {
        console.error('Error updating task note:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update task note"
        };
    }
}

/**
 * Delete task note - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param noteId - The note ID to delete
 */
export async function deleteTaskNote(
    businessId: string,
    noteId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required. Please sign in to continue."
            };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "Access denied. You don't have permission to modify this business."
            };
        }

        // Get current note to verify it exists and belongs to business
        const currentNote = await db.taskNotes.get(noteId);
        if (!currentNote) {
            return {
                success: false,
                error: "Task note not found."
            };
        }

        // Verify the note belongs to the business
        if (currentNote.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Note does not belong to this business."
            };
        }

        // Verify the user can delete this note (only author or business owner)
        if (currentNote.author_id !== currentUserAuthId) {
            const business = await db.businesses.get(businessId);
            if (!business || business.owner_id !== currentUserAuthId) {
                return {
                    success: false,
                    error: "Access denied. You can only delete your own notes."
                };
            }
        }

        // Remove from local database immediately (optimistic update)
        await db.taskNotes.delete(noteId);

        // Queue for sync with server
        await addToSyncQueue(
            'task_notes',
            'delete',
            { id: noteId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/task-notes/${noteId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('task_notes')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === noteId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `task_notes_${currentNote.task_id}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'task_notes'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync task note deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting task note:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete task note"
        };
    }
}

/**
 * Search task notes within a task - Offline-first implementation
 * @param businessId - The business ID
 * @param taskId - The task ID to search notes in
 * @param searchQuery - The search query
 */
export async function searchTaskNotes(businessId: string, taskId: string, searchQuery: string): Promise<TaskNote[]> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return [];
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return [];
        }

        // Get all notes from cache first
        const allNotes = await db.taskNotes
            .where('task_id')
            .equals(taskId)
            .and(note => note.business_id === businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allNotes.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allNotes.filter(note =>
                note.content && note.content.toLowerCase().includes(query)
            ).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/task-notes/search?businessId=${businessId}&taskId=${taskId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverNotes = await response.json();

                if (serverNotes && Array.isArray(serverNotes)) {
                    // Update local cache
                    await db.taskNotes.bulkPut(serverNotes);

                    return serverNotes;
                }
            }
        } catch (error) {
            console.warn('Failed to search task notes on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allNotes.filter(note =>
            note.content && note.content.toLowerCase().includes(query)
        ).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

    } catch (error) {
        console.error('Error searching task notes:', error);
        return [];
    }
}
