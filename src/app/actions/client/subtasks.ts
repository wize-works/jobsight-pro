"use client";

/**
 * Subtasks Client Actions - Offline-First Implementation (Phase 4.1 - Task Management Extensions)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { Subtask, SubtaskInsert, SubtaskUpdate } from "@/types/subtasks";
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
 * Get all subtasks for a task - Offline-first implementation
 * @param businessId - The business ID to get subtasks for
 * @param taskId - The task ID to get subtasks for
 */
export async function getSubtasks(businessId: string, taskId: string): Promise<Subtask[]> {
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
        const cachedSubtasks = await db.subtasks
            .where('task_id')
            .equals(taskId)
            .and(subtask => subtask.business_id === businessId)
            .sortBy('created_at');

        if (cachedSubtasks.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`subtasks_${taskId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedSubtasks;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/subtasks/task/${taskId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverSubtasks = await response.json();

                    if (serverSubtasks && Array.isArray(serverSubtasks)) {
                        // Update local cache
                        await db.subtasks.bulkPut(serverSubtasks);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `subtasks_${taskId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'subtasks'
                        });

                        return serverSubtasks.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch subtasks from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedSubtasks;

    } catch (error) {
        console.error('Error getting subtasks:', error);
        return [];
    }
}

/**
 * Get subtask by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param subtaskId - The subtask ID to get
 */
export async function getSubtaskById(businessId: string, subtaskId: string): Promise<Subtask | null> {
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
        const cachedSubtask = await db.subtasks.get(subtaskId);

        if (cachedSubtask && cachedSubtask.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`subtasks_${cachedSubtask.task_id}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedSubtask;
                }
            } else {
                // If offline, return cached data
                return cachedSubtask;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/subtasks/${subtaskId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverSubtask = await response.json();

                    if (serverSubtask) {
                        // Update local cache
                        await db.subtasks.put(serverSubtask);

                        return serverSubtask;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch subtask from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedSubtask || null;

    } catch (error) {
        console.error('Error getting subtask by ID:', error);
        return null;
    }
}

/**
 * Create subtask - Offline-first implementation with authorization
 * @param businessId - The business ID to create subtask for
 * @param taskId - The parent task ID
 * @param subtaskData - The subtask data to create
 */
export async function createSubtask(
    businessId: string,
    taskId: string,
    subtaskData: SubtaskInsert
): Promise<{ success: boolean; data?: Subtask; error?: string }> {
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

        // Validate parent task exists and belongs to business
        const task = await db.tasks.get(taskId);
        if (!task || task.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid task or task does not belong to this business."
            };
        }

        const now = new Date().toISOString();
        const subtaskId = uuidv4();

        // Create subtask object
        const newSubtask: Subtask = {
            id: subtaskId,
            task_id: taskId,
            business_id: businessId,
            name: subtaskData.name,
            description: subtaskData.description || null,
            status: subtaskData.status || 'not_started',
            priority: subtaskData.priority || 'medium',
            assigned_to: subtaskData.assigned_to || null,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.subtasks.put(newSubtask);

        // Queue for sync with server
        await addToSyncQueue(
            'subtasks',
            'insert',
            newSubtask,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/subtasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...subtaskData,
                        businessId,
                        taskId,
                        id: subtaskId
                    }),
                });

                if (response.ok) {
                    const serverSubtask = await response.json();

                    // Update local data with server response
                    await db.subtasks.put(serverSubtask);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('subtasks')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `subtasks_${taskId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'subtasks'
                    });

                    return { success: true, data: serverSubtask };
                }
            } catch (error) {
                console.warn('Failed to sync subtask to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newSubtask };

    } catch (error) {
        console.error('Error creating subtask:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create subtask"
        };
    }
}

/**
 * Update subtask - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param subtaskId - The subtask ID to update
 * @param subtaskData - The subtask data to update
 */
export async function updateSubtask(
    businessId: string,
    subtaskId: string,
    subtaskData: SubtaskUpdate
): Promise<{ success: boolean; data?: Subtask; error?: string }> {
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

        // Get current subtask
        const currentSubtask = await db.subtasks.get(subtaskId);
        if (!currentSubtask) {
            return {
                success: false,
                error: "Subtask not found."
            };
        }

        // Verify the subtask belongs to the business
        if (currentSubtask.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Subtask does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<Subtask> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from subtaskData
        if (subtaskData.name !== undefined) updateData.name = subtaskData.name;
        if (subtaskData.description !== undefined) updateData.description = subtaskData.description;
        if (subtaskData.status !== undefined) updateData.status = subtaskData.status;
        if (subtaskData.priority !== undefined) updateData.priority = subtaskData.priority;
        if (subtaskData.assigned_to !== undefined) updateData.assigned_to = subtaskData.assigned_to;

        // Update locally first (optimistic update)
        const updatedSubtask = { ...currentSubtask, ...updateData };
        await db.subtasks.put(updatedSubtask);

        // Queue for sync with server
        await addToSyncQueue(
            'subtasks',
            'update',
            updatedSubtask,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/subtasks/${subtaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverSubtask = await response.json();

                    // Update local data with server response
                    await db.subtasks.put(serverSubtask);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('subtasks')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `subtasks_${currentSubtask.task_id}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'subtasks'
                    });

                    return { success: true, data: serverSubtask };
                }
            } catch (error) {
                console.warn('Failed to sync subtask update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedSubtask };

    } catch (error) {
        console.error('Error updating subtask:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update subtask"
        };
    }
}

/**
 * Delete subtask - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param subtaskId - The subtask ID to delete
 */
export async function deleteSubtask(
    businessId: string,
    subtaskId: string
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

        // Get current subtask to verify it exists and belongs to business
        const currentSubtask = await db.subtasks.get(subtaskId);
        if (!currentSubtask) {
            return {
                success: false,
                error: "Subtask not found."
            };
        }

        // Verify the subtask belongs to the business
        if (currentSubtask.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Subtask does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.subtasks.delete(subtaskId);

        // Queue for sync with server
        await addToSyncQueue(
            'subtasks',
            'delete',
            { id: subtaskId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/subtasks/${subtaskId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('subtasks')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === subtaskId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `subtasks_${currentSubtask.task_id}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'subtasks'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync subtask deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting subtask:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete subtask"
        };
    }
}

/**
 * Search subtasks within a task - Offline-first implementation
 * @param businessId - The business ID
 * @param taskId - The parent task ID
 * @param searchQuery - The search query
 */
export async function searchSubtasks(businessId: string, taskId: string, searchQuery: string): Promise<Subtask[]> {
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

        // Get all subtasks from cache first
        const allSubtasks = await db.subtasks
            .where('task_id')
            .equals(taskId)
            .and(subtask => subtask.business_id === businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allSubtasks.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allSubtasks.filter(subtask =>
                subtask.name.toLowerCase().includes(query) ||
                (subtask.description && subtask.description.toLowerCase().includes(query))
            ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/subtasks/search?businessId=${businessId}&taskId=${taskId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverSubtasks = await response.json();

                if (serverSubtasks && Array.isArray(serverSubtasks)) {
                    // Update local cache
                    await db.subtasks.bulkPut(serverSubtasks);

                    return serverSubtasks;
                }
            }
        } catch (error) {
            console.warn('Failed to search subtasks on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allSubtasks.filter(subtask =>
            subtask.name.toLowerCase().includes(query) ||
            (subtask.description && subtask.description.toLowerCase().includes(query))
        ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error searching subtasks:', error);
        return [];
    }
}
