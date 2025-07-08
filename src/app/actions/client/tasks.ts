"use client";

/**
 * Tasks Client Actions - Offline-First Implementation (Phase 4 - Priority 1)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { Task, TaskInsert, TaskUpdate, TaskWithDetails } from "@/types/tasks";
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
 * Get all tasks for a business - Offline-first implementation
 * @param businessId - The business ID to get tasks for
 */
export async function getTasks(businessId: string): Promise<Task[]> {
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

        // Try to get from local cache first
        const cachedTasks = await db.tasks
            .where('business_id')
            .equals(businessId)
            .sortBy('created_at');

        if (cachedTasks.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`tasks_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedTasks;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/tasks/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverTasks = await response.json();

                    if (serverTasks && Array.isArray(serverTasks)) {
                        // Update local cache
                        await db.tasks.bulkPut(serverTasks);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `tasks_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'tasks'
                        });

                        return serverTasks.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch tasks from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedTasks;

    } catch (error) {
        console.error('Error getting tasks:', error);
        return [];
    }
}

/**
 * Get task by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param taskId - The task ID to get
 */
export async function getTaskById(businessId: string, taskId: string): Promise<Task | null> {
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
        const cachedTask = await db.tasks.get(taskId);

        if (cachedTask && cachedTask.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`tasks_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedTask;
                }
            } else {
                // If offline, return cached data
                return cachedTask;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/tasks/${taskId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverTask = await response.json();

                    if (serverTask) {
                        // Update local cache
                        await db.tasks.put(serverTask);

                        return serverTask;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch task from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedTask || null;

    } catch (error) {
        console.error('Error getting task by ID:', error);
        return null;
    }
}

/**
 * Create task - Offline-first implementation with authorization
 * @param businessId - The business ID to create task for
 * @param taskData - The task data to create
 */
export async function createTask(
    businessId: string,
    taskData: TaskInsert
): Promise<{ success: boolean; data?: Task; error?: string }> {
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

        // Validate project exists and belongs to business
        const project = await db.projects.get(taskData.project_id);
        if (!project || project.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid project or project does not belong to this business."
            };
        }

        const now = new Date().toISOString();
        const taskId = uuidv4();

        // Create task object
        const newTask: Task = {
            id: taskId,
            business_id: businessId,
            project_id: taskData.project_id,
            name: taskData.name,
            description: taskData.description || null,
            status: taskData.status || 'not_started',
            priority: taskData.priority || 'medium',
            start_date: taskData.start_date || null,
            end_date: taskData.end_date || null,
            assigned_to: taskData.assigned_to || null,
            progress: taskData.progress || 0,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.tasks.put(newTask);

        // Queue for sync with server
        await addToSyncQueue(
            'tasks',
            'insert',
            newTask,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...taskData,
                        businessId,
                        id: taskId
                    }),
                });

                if (response.ok) {
                    const serverTask = await response.json();

                    // Update local data with server response
                    await db.tasks.put(serverTask);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('tasks')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `tasks_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'tasks'
                    });

                    return { success: true, data: serverTask };
                }
            } catch (error) {
                console.warn('Failed to sync task to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newTask };

    } catch (error) {
        console.error('Error creating task:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create task"
        };
    }
}

/**
 * Update task - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param taskId - The task ID to update
 * @param taskData - The task data to update
 */
export async function updateTask(
    businessId: string,
    taskId: string,
    taskData: TaskUpdate
): Promise<{ success: boolean; data?: Task; error?: string }> {
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

        // Get current task
        const currentTask = await db.tasks.get(taskId);
        if (!currentTask) {
            return {
                success: false,
                error: "Task not found."
            };
        }

        // Verify the task belongs to the business
        if (currentTask.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Task does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<Task> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from taskData
        if (taskData.name !== undefined) updateData.name = taskData.name;
        if (taskData.description !== undefined) updateData.description = taskData.description;
        if (taskData.status !== undefined) updateData.status = taskData.status;
        if (taskData.priority !== undefined) updateData.priority = taskData.priority;
        if (taskData.start_date !== undefined) updateData.start_date = taskData.start_date;
        if (taskData.end_date !== undefined) updateData.end_date = taskData.end_date;
        if (taskData.assigned_to !== undefined) updateData.assigned_to = taskData.assigned_to;
        if (taskData.progress !== undefined) updateData.progress = taskData.progress;

        // Update locally first (optimistic update)
        const updatedTask = { ...currentTask, ...updateData };
        await db.tasks.put(updatedTask);

        // Queue for sync with server
        await addToSyncQueue(
            'tasks',
            'update',
            updatedTask,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverTask = await response.json();

                    // Update local data with server response
                    await db.tasks.put(serverTask);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('tasks')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `tasks_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'tasks'
                    });

                    return { success: true, data: serverTask };
                }
            } catch (error) {
                console.warn('Failed to sync task update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedTask };

    } catch (error) {
        console.error('Error updating task:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update task"
        };
    }
}

/**
 * Delete task - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param taskId - The task ID to delete
 */
export async function deleteTask(
    businessId: string,
    taskId: string
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

        // Get current task to verify it exists and belongs to business
        const currentTask = await db.tasks.get(taskId);
        if (!currentTask) {
            return {
                success: false,
                error: "Task not found."
            };
        }

        // Verify the task belongs to the business
        if (currentTask.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Task does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.tasks.delete(taskId);

        // Queue for sync with server
        await addToSyncQueue(
            'tasks',
            'delete',
            { id: taskId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/tasks/${taskId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('tasks')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === taskId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `tasks_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'tasks'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync task deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting task:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete task"
        };
    }
}

/**
 * Get tasks by project ID - Offline-first implementation
 * @param businessId - The business ID
 * @param projectId - The project ID to get tasks for
 */
export async function getTasksByProjectId(businessId: string, projectId: string): Promise<TaskWithDetails[]> {
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

        // Get tasks from cache
        const tasks = await db.tasks
            .where('project_id')
            .equals(projectId)
            .and(task => task.business_id === businessId)
            .toArray();

        // Get project and client info for TaskWithDetails
        const project = await db.projects.get(projectId);
        const client = project ? await db.clients.get(project.client_id || '') : null;

        // Get crew information for tasks (now that crew entities are implemented)
        const tasksWithDetails: TaskWithDetails[] = [];
        for (const task of tasks) {
            let crewName = undefined;

            // Find crew assigned to this task's project
            const projectCrews = await db.projectCrews
                .where('project_id')
                .equals(task.project_id)
                .toArray();

            // Get the most recent active crew assignment
            const activeProjectCrew = projectCrews
                .filter(pc => !pc.end_date || new Date(pc.end_date) > new Date())
                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];

            if (activeProjectCrew) {
                const crew = await db.crews.get(activeProjectCrew.crew_id);
                crewName = crew?.name;
            }

            tasksWithDetails.push({
                ...task,
                project_name: project?.name || '',
                client_name: client?.name || '',
                crew_name: crewName
            });
        }

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/tasks/project/${projectId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverTasks = await response.json();

                    if (serverTasks && Array.isArray(serverTasks)) {
                        // Extract base task data and update local cache
                        const baseTasks = serverTasks.map(taskWithDetails => {
                            const { project_name, client_name, crew_name, ...baseTask } = taskWithDetails;
                            return baseTask;
                        });

                        // Update local cache
                        await db.tasks.bulkPut(baseTasks);

                        return serverTasks;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch tasks by project from server, using cache:', error);
            }
        }

        return tasksWithDetails.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error getting tasks by project ID:', error);
        return [];
    }
}

/**
 * Search tasks - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchTasks(businessId: string, searchQuery: string): Promise<Task[]> {
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

        // Get all tasks from cache first
        const allTasks = await db.tasks
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allTasks.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allTasks.filter(task =>
                task.name.toLowerCase().includes(query) ||
                (task.description && task.description.toLowerCase().includes(query))
            ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/tasks/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverTasks = await response.json();

                if (serverTasks && Array.isArray(serverTasks)) {
                    // Update local cache
                    await db.tasks.bulkPut(serverTasks);

                    return serverTasks;
                }
            }
        } catch (error) {
            console.warn('Failed to search tasks on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allTasks.filter(task =>
            task.name.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error searching tasks:', error);
        return [];
    }
}

/**
 * Quick update task (for status, progress, etc.) - Offline-first implementation
 * @param businessId - The business ID
 * @param taskId - The task ID
 * @param updates - Partial updates to apply
 */
export async function quickUpdateTask(
    businessId: string,
    taskId: string,
    updates: Partial<TaskUpdate>
): Promise<{ success: boolean; data?: Task; error?: string }> {
    try {
        // Convert partial updates to the format expected by updateTask
        const taskUpdate: TaskUpdate = updates as TaskUpdate;
        return await updateTask(businessId, taskId, taskUpdate);
    } catch (error) {
        console.error('Error quick updating task:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update task"
        };
    }
}
