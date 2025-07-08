"use client";

/**
 * Projects Client Actions - Offline-First Implementation (Phase 3)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { Project, ProjectInsert, ProjectUpdate, ProjectWithDetails } from "@/types/projects";
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
 * Get all projects for a business - Offline-first implementation
 * @param businessId - The business ID to get projects for
 */
export async function getProjects(businessId: string): Promise<Project[]> {
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
        const cachedProjects = await db.projects
            .where('business_id')
            .equals(businessId)
            .reverse()
            .sortBy('created_at');

        if (cachedProjects.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`projects_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedProjects;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/projects/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverProjects = await response.json();

                    if (serverProjects && Array.isArray(serverProjects)) {
                        // Update local cache
                        await db.projects.bulkPut(serverProjects);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `projects_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'projects'
                        });

                        return serverProjects;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch projects from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedProjects;

    } catch (error) {
        console.error('Error getting projects:', error);
        return [];
    }
}

/**
 * Get project by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param projectId - The project ID to get
 */
export async function getProjectById(businessId: string, projectId: string): Promise<Project | null> {
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
        const cachedProject = await db.projects.get(projectId);

        if (cachedProject && cachedProject.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`projects_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedProject;
                }
            } else {
                // If offline, return cached data
                return cachedProject;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/projects/${projectId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverProject = await response.json();

                    if (serverProject) {
                        // Update local cache
                        await db.projects.put(serverProject);

                        return serverProject;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch project from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedProject || null;

    } catch (error) {
        console.error('Error getting project by ID:', error);
        return null;
    }
}

/**
 * Create project - Offline-first implementation with authorization
 * @param businessId - The business ID to create project for
 * @param projectData - The project data to create
 */
export async function createProject(
    businessId: string,
    projectData: ProjectInsert
): Promise<{ success: boolean; data?: Project; error?: string }> {
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

        const now = new Date().toISOString();
        const projectId = uuidv4();

        // Create project object
        const newProject: Project = {
            id: projectId,
            business_id: businessId,
            client_id: projectData.client_id,
            name: projectData.name,
            type: projectData.type || null,
            status: projectData.status || 'planning',
            start_date: projectData.start_date || null,
            end_date: projectData.end_date || null,
            budget: projectData.budget || null,
            location: projectData.location || null,
            description: projectData.description || null,
            manager_id: projectData.manager_id || null,
            progress: projectData.progress || 0,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.projects.put(newProject);

        // Queue for sync with server
        await addToSyncQueue(
            'projects',
            'insert',
            newProject,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...projectData,
                        businessId,
                        id: projectId
                    }),
                });

                if (response.ok) {
                    const serverProject = await response.json();

                    // Update local data with server response
                    await db.projects.put(serverProject);

                    // Mark as synced
                    await db.syncQueue
                        .where('[table+businessId+operation]')
                        .equals(['projects', businessId, 'insert'])
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projects_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projects'
                    });

                    return { success: true, data: serverProject };
                }
            } catch (error) {
                console.warn('Failed to sync project to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newProject };

    } catch (error) {
        console.error('Error creating project:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create project"
        };
    }
}

/**
 * Update project - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param projectId - The project ID to update
 * @param projectData - The project data to update
 */
export async function updateProject(
    businessId: string,
    projectId: string,
    projectData: ProjectUpdate
): Promise<{ success: boolean; data?: Project; error?: string }> {
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

        // Get current project
        const currentProject = await db.projects.get(projectId);
        if (!currentProject) {
            return {
                success: false,
                error: "Project not found."
            };
        }

        // Verify the project belongs to the business
        if (currentProject.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Project does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data - be explicit about types
        const updateData: Partial<Project> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from projectData that match Project schema
        if (projectData.name !== undefined) updateData.name = projectData.name;
        if (projectData.client_id !== undefined) updateData.client_id = projectData.client_id;
        if (projectData.type !== undefined) updateData.type = projectData.type;
        if (projectData.status !== undefined) updateData.status = projectData.status;
        if (projectData.start_date !== undefined) updateData.start_date = projectData.start_date;
        if (projectData.end_date !== undefined) updateData.end_date = projectData.end_date;
        if (projectData.budget !== undefined) updateData.budget = projectData.budget;
        if (projectData.location !== undefined) updateData.location = projectData.location;
        if (projectData.description !== undefined) updateData.description = projectData.description;
        if (projectData.manager_id !== undefined) updateData.manager_id = projectData.manager_id;
        if (projectData.progress !== undefined) updateData.progress = projectData.progress;

        // Update locally first (optimistic update)
        const updatedProject = { ...currentProject, ...updateData };
        await db.projects.put(updatedProject);

        // Queue for sync with server
        await addToSyncQueue(
            'projects',
            'update',
            updatedProject,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/projects/${projectId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverProject = await response.json();

                    // Update local data with server response
                    await db.projects.put(serverProject);

                    // Mark as synced
                    await db.syncQueue
                        .where('[table+businessId+operation]')
                        .equals(['projects', businessId, 'update'])
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projects_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projects'
                    });

                    return { success: true, data: serverProject };
                }
            } catch (error) {
                console.warn('Failed to sync project update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedProject };

    } catch (error) {
        console.error('Error updating project:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update project"
        };
    }
}

/**
 * Delete project - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param projectId - The project ID to delete
 */
export async function deleteProject(
    businessId: string,
    projectId: string
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

        // Get current project
        const currentProject = await db.projects.get(projectId);
        if (!currentProject) {
            return {
                success: false,
                error: "Project not found."
            };
        }

        // Verify the project belongs to the business
        if (currentProject.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Project does not belong to this business."
            };
        }

        // Delete locally immediately (optimistic update)
        await db.projects.delete(projectId);

        // Queue for sync with server
        await addToSyncQueue(
            'projects',
            'delete',
            { id: projectId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/projects/${projectId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('[table+businessId+operation]')
                        .equals(['projects', businessId, 'delete'])
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projects_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projects'
                    });
                }
            } catch (error) {
                console.warn('Failed to sync project deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting project:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete project"
        };
    }
}

/**
 * Get projects by client ID - Offline-first implementation
 * @param businessId - The business ID
 * @param clientId - The client ID to get projects for
 */
export async function getProjectsByClientId(businessId: string, clientId: string): Promise<Project[]> {
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
        const cachedProjects = await db.projects
            .where(['business_id', 'client_id'])
            .equals([businessId, clientId])
            .reverse()
            .sortBy('created_at');

        if (cachedProjects.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`projects_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedProjects;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/projects/client/${clientId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverProjects = await response.json();

                    if (serverProjects && Array.isArray(serverProjects)) {
                        // Update local cache
                        await db.projects.bulkPut(serverProjects);

                        return serverProjects;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch projects by client from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedProjects;

    } catch (error) {
        console.error('Error getting projects by client:', error);
        return [];
    }
}

/**
 * Search projects - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchProjects(businessId: string, searchQuery: string): Promise<Project[]> {
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

        // Get all projects from cache first
        const allProjects = await db.projects
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allProjects.sort((a, b) =>
                    new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
                );
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allProjects.filter(project =>
                project.name.toLowerCase().includes(query) ||
                (project.description && project.description.toLowerCase().includes(query)) ||
                (project.location && project.location.toLowerCase().includes(query))
            ).sort((a, b) =>
                new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
            );
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/projects/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverProjects = await response.json();

                if (serverProjects && Array.isArray(serverProjects)) {
                    // Update local cache
                    await db.projects.bulkPut(serverProjects);

                    return serverProjects;
                }
            }
        } catch (error) {
            console.warn('Failed to search projects on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allProjects.filter(project =>
            project.name.toLowerCase().includes(query) ||
            (project.description && project.description.toLowerCase().includes(query)) ||
            (project.location && project.location.toLowerCase().includes(query))
        ).sort((a, b) =>
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );

    } catch (error) {
        console.error('Error searching projects:', error);
        return [];
    }
}

/**
 * Update project progress - Offline-first implementation
 * @param businessId - The business ID
 * @param projectId - The project ID
 * @param progress - The progress percentage (0-100)
 */
export async function updateProjectProgress(
    businessId: string,
    projectId: string,
    progress: number
): Promise<{ success: boolean; data?: Project; error?: string }> {
    try {
        // Validate progress value
        if (progress < 0 || progress > 100) {
            return {
                success: false,
                error: "Progress must be between 0 and 100"
            };
        }

        return await updateProject(businessId, projectId, { progress } as ProjectUpdate);

    } catch (error) {
        console.error('Error updating project progress:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update project progress"
        };
    }
}
