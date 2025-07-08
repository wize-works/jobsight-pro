"use client";

/**
 * Task Dependencies Client Actions - Offline-First Implementation (Phase 4.1 - Task Management Extensions)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { TaskDependency, TaskDependencyInsert, TaskDependencyUpdate } from "@/types/task_dependencies";
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
 * Get all task dependencies for a task - Offline-first implementation
 * @param businessId - The business ID to get dependencies for
 * @param taskId - The task ID to get dependencies for
 */
export async function getTaskDependencies(businessId: string, taskId: string): Promise<TaskDependency[]> {
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
        const cachedDependencies = await db.taskDependencies
            .where('task_id')
            .equals(taskId)
            .and(dependency => dependency.business_id === businessId)
            .sortBy('created_at');

        if (cachedDependencies.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`task_dependencies_${taskId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedDependencies;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/task-dependencies/task/${taskId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverDependencies = await response.json();

                    if (serverDependencies && Array.isArray(serverDependencies)) {
                        // Update local cache
                        await db.taskDependencies.bulkPut(serverDependencies);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `task_dependencies_${taskId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'task_dependencies'
                        });

                        return serverDependencies.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch task dependencies from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedDependencies;

    } catch (error) {
        console.error('Error getting task dependencies:', error);
        return [];
    }
}

/**
 * Get task dependency by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param dependencyId - The dependency ID to get
 */
export async function getTaskDependencyById(businessId: string, dependencyId: string): Promise<TaskDependency | null> {
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
        const cachedDependency = await db.taskDependencies.get(dependencyId);

        if (cachedDependency && cachedDependency.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`task_dependencies_${cachedDependency.task_id}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedDependency;
                }
            } else {
                // If offline, return cached data
                return cachedDependency;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/task-dependencies/${dependencyId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverDependency = await response.json();

                    if (serverDependency) {
                        // Update local cache
                        await db.taskDependencies.put(serverDependency);

                        return serverDependency;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch task dependency from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedDependency || null;

    } catch (error) {
        console.error('Error getting task dependency by ID:', error);
        return null;
    }
}

/**
 * Create task dependency - Offline-first implementation with authorization
 * @param businessId - The business ID to create dependency for
 * @param taskId - The task ID
 * @param dependencyOnTaskId - The task ID this task depends on
 * @param dependencyData - The dependency data to create
 */
export async function createTaskDependency(
    businessId: string,
    taskId: string,
    dependencyOnTaskId: string,
    dependencyData: TaskDependencyInsert
): Promise<{ success: boolean; data?: TaskDependency; error?: string }> {
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

        // Validate both tasks exist and belong to business
        const task = await db.tasks.get(taskId);
        const dependencyTask = await db.tasks.get(dependencyOnTaskId);

        if (!task || task.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid task or task does not belong to this business."
            };
        }

        if (!dependencyTask || dependencyTask.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid dependency task or task does not belong to this business."
            };
        }

        // Prevent self-dependency
        if (taskId === dependencyOnTaskId) {
            return {
                success: false,
                error: "A task cannot depend on itself."
            };
        }

        // Check if dependency already exists
        const existingDependency = await db.taskDependencies
            .where('task_id')
            .equals(taskId)
            .and(dep => dep.dependency_on_task_id === dependencyOnTaskId && dep.business_id === businessId)
            .first();

        if (existingDependency) {
            return {
                success: false,
                error: "This dependency already exists."
            };
        }

        const now = new Date().toISOString();
        const dependencyId = uuidv4();

        // Create task dependency object
        const newDependency: TaskDependency = {
            id: dependencyId,
            task_id: taskId,
            business_id: businessId,
            dependency_on_task_id: dependencyOnTaskId,
            dependency_type: dependencyData.dependency_type || 'predecessor',
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.taskDependencies.put(newDependency);

        // Queue for sync with server
        await addToSyncQueue(
            'task_dependencies',
            'insert',
            newDependency,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/task-dependencies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...dependencyData,
                        businessId,
                        taskId,
                        dependencyOnTaskId,
                        id: dependencyId
                    }),
                });

                if (response.ok) {
                    const serverDependency = await response.json();

                    // Update local data with server response
                    await db.taskDependencies.put(serverDependency);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('task_dependencies')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `task_dependencies_${taskId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'task_dependencies'
                    });

                    return { success: true, data: serverDependency };
                }
            } catch (error) {
                console.warn('Failed to sync task dependency to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newDependency };

    } catch (error) {
        console.error('Error creating task dependency:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create task dependency"
        };
    }
}

/**
 * Update task dependency - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param dependencyId - The dependency ID to update
 * @param dependencyData - The dependency data to update
 */
export async function updateTaskDependency(
    businessId: string,
    dependencyId: string,
    dependencyData: TaskDependencyUpdate
): Promise<{ success: boolean; data?: TaskDependency; error?: string }> {
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

        // Get current dependency
        const currentDependency = await db.taskDependencies.get(dependencyId);
        if (!currentDependency) {
            return {
                success: false,
                error: "Task dependency not found."
            };
        }

        // Verify the dependency belongs to the business
        if (currentDependency.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Dependency does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<TaskDependency> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from dependencyData
        if (dependencyData.dependency_type !== undefined) updateData.dependency_type = dependencyData.dependency_type;

        // Update locally first (optimistic update)
        const updatedDependency = { ...currentDependency, ...updateData };
        await db.taskDependencies.put(updatedDependency);

        // Queue for sync with server
        await addToSyncQueue(
            'task_dependencies',
            'update',
            updatedDependency,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/task-dependencies/${dependencyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverDependency = await response.json();

                    // Update local data with server response
                    await db.taskDependencies.put(serverDependency);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('task_dependencies')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `task_dependencies_${currentDependency.task_id}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'task_dependencies'
                    });

                    return { success: true, data: serverDependency };
                }
            } catch (error) {
                console.warn('Failed to sync task dependency update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedDependency };

    } catch (error) {
        console.error('Error updating task dependency:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update task dependency"
        };
    }
}

/**
 * Delete task dependency - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param dependencyId - The dependency ID to delete
 */
export async function deleteTaskDependency(
    businessId: string,
    dependencyId: string
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

        // Get current dependency to verify it exists and belongs to business
        const currentDependency = await db.taskDependencies.get(dependencyId);
        if (!currentDependency) {
            return {
                success: false,
                error: "Task dependency not found."
            };
        }

        // Verify the dependency belongs to the business
        if (currentDependency.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Dependency does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.taskDependencies.delete(dependencyId);

        // Queue for sync with server
        await addToSyncQueue(
            'task_dependencies',
            'delete',
            { id: dependencyId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/task-dependencies/${dependencyId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('task_dependencies')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === dependencyId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `task_dependencies_${currentDependency.task_id}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'task_dependencies'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync task dependency deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting task dependency:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete task dependency"
        };
    }
}

/**
 * Get all dependencies where this task is blocking other tasks (predecessors)
 * @param businessId - The business ID
 * @param taskId - The task ID to find what it blocks
 */
export async function getTaskPredecessors(businessId: string, taskId: string): Promise<TaskDependency[]> {
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

        // Get all dependencies where this task is the dependency (blocking other tasks)
        const predecessors = await db.taskDependencies
            .where('dependency_on_task_id')
            .equals(taskId)
            .and(dependency => dependency.business_id === businessId)
            .toArray();

        return predecessors.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error getting task predecessors:', error);
        return [];
    }
}

/**
 * Check if creating a dependency would create a circular dependency
 * @param businessId - The business ID
 * @param taskId - The task that would depend on another
 * @param dependsOnTaskId - The task that would be depended upon
 */
export async function checkCircularDependency(
    businessId: string,
    taskId: string,
    dependsOnTaskId: string
): Promise<{ hasCircularDependency: boolean; path?: string[] }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return { hasCircularDependency: false };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return { hasCircularDependency: false };
        }

        // Get all dependencies for the business
        const allDependencies = await db.taskDependencies
            .where('business_id')
            .equals(businessId)
            .toArray();

        // Create a dependency map
        const dependencyMap = new Map<string, string[]>();
        allDependencies.forEach(dep => {
            const dependents = dependencyMap.get(dep.dependency_on_task_id) || [];
            dependents.push(dep.task_id);
            dependencyMap.set(dep.dependency_on_task_id, dependents);
        });

        // Check if adding this dependency would create a cycle
        // We need to see if dependsOnTaskId eventually depends on taskId
        const visited = new Set<string>();
        const path: string[] = [];

        function hasPath(from: string, to: string): boolean {
            if (from === to) return true;
            if (visited.has(from)) return false;

            visited.add(from);
            path.push(from);

            const dependents = dependencyMap.get(from) || [];
            for (const dependent of dependents) {
                if (hasPath(dependent, to)) {
                    return true;
                }
            }

            path.pop();
            return false;
        }

        const hasCircular = hasPath(dependsOnTaskId, taskId);

        return {
            hasCircularDependency: hasCircular,
            path: hasCircular ? [...path, taskId] : undefined
        };

    } catch (error) {
        console.error('Error checking circular dependency:', error);
        return { hasCircularDependency: false };
    }
}
