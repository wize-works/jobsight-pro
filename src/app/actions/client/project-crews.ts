"use client";

/**
 * Project Crews Client Actions - Offline-First Implementation (Phase 4.3)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { ProjectCrew, ProjectCrewInsert, ProjectCrewUpdate, ProjectCrewWithDetails } from "@/types/project-crews";
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
 * Get all project crews for a business - Offline-first implementation
 * @param businessId - The business ID to get project crews for
 */
export async function getProjectCrews(businessId: string): Promise<ProjectCrew[]> {
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
        const cachedProjectCrews = await db.projectCrews
            .where('business_id')
            .equals(businessId)
            .sortBy('start_date');

        if (cachedProjectCrews.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`projectCrews_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedProjectCrews;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-crews/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverProjectCrews = await response.json();

                    if (serverProjectCrews && Array.isArray(serverProjectCrews)) {
                        // Update local cache
                        await db.projectCrews.bulkPut(serverProjectCrews);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `projectCrews_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'projectCrews'
                        });

                        return serverProjectCrews.sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch project crews from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedProjectCrews;

    } catch (error) {
        console.error('Error getting project crews:', error);
        return [];
    }
}

/**
 * Get project crew by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param projectCrewId - The project crew ID to get
 */
export async function getProjectCrewById(businessId: string, projectCrewId: string): Promise<ProjectCrew | null> {
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
        const cachedProjectCrew = await db.projectCrews.get(projectCrewId);

        if (cachedProjectCrew && cachedProjectCrew.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`projectCrews_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedProjectCrew;
                }
            } else {
                // If offline, return cached data
                return cachedProjectCrew;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-crews/${projectCrewId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverProjectCrew = await response.json();

                    if (serverProjectCrew) {
                        // Update local cache
                        await db.projectCrews.put(serverProjectCrew);

                        return serverProjectCrew;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch project crew from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedProjectCrew || null;

    } catch (error) {
        console.error('Error getting project crew by ID:', error);
        return null;
    }
}

/**
 * Create project crew - Offline-first implementation with authorization
 * @param businessId - The business ID to create project crew for
 * @param projectCrewData - The project crew data to create
 */
export async function createProjectCrew(
    businessId: string,
    projectCrewData: ProjectCrewInsert
): Promise<{ success: boolean; data?: ProjectCrew; error?: string }> {
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

        // Validate crew exists and belongs to business
        const crew = await db.crews.get(projectCrewData.crew_id);
        if (!crew || crew.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid crew or crew does not belong to this business."
            };
        }

        // Validate project exists and belongs to business
        const project = await db.projects.get(projectCrewData.project_id);
        if (!project || project.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid project or project does not belong to this business."
            };
        }

        // Check for overlapping assignments
        const existingAssignments = await db.projectCrews
            .where('crew_id')
            .equals(projectCrewData.crew_id)
            .and(pc => pc.business_id === businessId)
            .toArray();

        const startDate = new Date(projectCrewData.start_date);
        const endDate = projectCrewData.end_date ? new Date(projectCrewData.end_date) : null;

        const hasOverlap = existingAssignments.some(existing => {
            const existingStart = new Date(existing.start_date);
            const existingEnd = existing.end_date ? new Date(existing.end_date) : null;

            // Check for date overlap
            if (endDate && existingEnd) {
                // Both have end dates
                return startDate <= existingEnd && (endDate >= existingStart);
            } else if (endDate) {
                // New assignment has end date, existing doesn't
                return endDate >= existingStart;
            } else if (existingEnd) {
                // Existing has end date, new assignment doesn't
                return startDate <= existingEnd;
            } else {
                // Neither has end date - they overlap
                return true;
            }
        });

        if (hasOverlap) {
            return {
                success: false,
                error: "Crew is already assigned to another project during this time period."
            };
        }

        const now = new Date().toISOString();
        const projectCrewId = uuidv4();

        // Create project crew object
        const newProjectCrew: ProjectCrew = {
            id: projectCrewId,
            business_id: businessId,
            crew_id: projectCrewData.crew_id,
            project_id: projectCrewData.project_id,
            start_date: projectCrewData.start_date,
            end_date: projectCrewData.end_date || null,
            notes: projectCrewData.notes || null,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.projectCrews.put(newProjectCrew);

        // Queue for sync with server
        await addToSyncQueue(
            'projectCrews',
            'insert',
            newProjectCrew,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/project-crews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...projectCrewData,
                        businessId,
                        id: projectCrewId
                    }),
                });

                if (response.ok) {
                    const serverProjectCrew = await response.json();

                    // Update local data with server response
                    await db.projectCrews.put(serverProjectCrew);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('projectCrews')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projectCrews_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projectCrews'
                    });

                    return { success: true, data: serverProjectCrew };
                }
            } catch (error) {
                console.warn('Failed to sync project crew to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newProjectCrew };

    } catch (error) {
        console.error('Error creating project crew:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create project crew"
        };
    }
}

/**
 * Update project crew - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param projectCrewId - The project crew ID to update
 * @param projectCrewData - The project crew data to update
 */
export async function updateProjectCrew(
    businessId: string,
    projectCrewId: string,
    projectCrewData: ProjectCrewUpdate
): Promise<{ success: boolean; data?: ProjectCrew; error?: string }> {
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

        // Get current project crew
        const currentProjectCrew = await db.projectCrews.get(projectCrewId);
        if (!currentProjectCrew) {
            return {
                success: false,
                error: "Project crew not found."
            };
        }

        // Verify the project crew belongs to the business
        if (currentProjectCrew.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Project crew does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<ProjectCrew> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from projectCrewData
        if (projectCrewData.start_date !== undefined) updateData.start_date = projectCrewData.start_date;
        if (projectCrewData.end_date !== undefined) updateData.end_date = projectCrewData.end_date;
        if (projectCrewData.notes !== undefined) updateData.notes = projectCrewData.notes;

        // Update locally first (optimistic update)
        const updatedProjectCrew = { ...currentProjectCrew, ...updateData };
        await db.projectCrews.put(updatedProjectCrew);

        // Queue for sync with server
        await addToSyncQueue(
            'projectCrews',
            'update',
            updatedProjectCrew,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-crews/${projectCrewId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverProjectCrew = await response.json();

                    // Update local data with server response
                    await db.projectCrews.put(serverProjectCrew);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('projectCrews')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projectCrews_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projectCrews'
                    });

                    return { success: true, data: serverProjectCrew };
                }
            } catch (error) {
                console.warn('Failed to sync project crew update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedProjectCrew };

    } catch (error) {
        console.error('Error updating project crew:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update project crew"
        };
    }
}

/**
 * Delete project crew - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param projectCrewId - The project crew ID to delete
 */
export async function deleteProjectCrew(
    businessId: string,
    projectCrewId: string
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

        // Get current project crew to verify it exists and belongs to business
        const currentProjectCrew = await db.projectCrews.get(projectCrewId);
        if (!currentProjectCrew) {
            return {
                success: false,
                error: "Project crew not found."
            };
        }

        // Verify the project crew belongs to the business
        if (currentProjectCrew.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Project crew does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.projectCrews.delete(projectCrewId);

        // Queue for sync with server
        await addToSyncQueue(
            'projectCrews',
            'delete',
            { id: projectCrewId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-crews/${projectCrewId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('projectCrews')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === projectCrewId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projectCrews_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projectCrews'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync project crew deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting project crew:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete project crew"
        };
    }
}

/**
 * Get project crews by project ID - Offline-first implementation
 * @param businessId - The business ID
 * @param projectId - The project ID to get crews for
 */
export async function getProjectCrewsByProjectId(businessId: string, projectId: string): Promise<ProjectCrewWithDetails[]> {
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

        // Get project crews from cache
        const projectCrews = await db.projectCrews
            .where('project_id')
            .equals(projectId)
            .and(pc => pc.business_id === businessId)
            .toArray();

        // Get project info for ProjectCrewWithDetails
        const project = await db.projects.get(projectId);

        // Transform to ProjectCrewWithDetails
        const projectCrewsWithDetails: ProjectCrewWithDetails[] = projectCrews.map(pc => ({
            ...pc,
            project_name: project?.name || '',
            project_id: projectId
        }));

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-crews/project/${projectId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverProjectCrews = await response.json();

                    if (serverProjectCrews && Array.isArray(serverProjectCrews)) {
                        // Extract base project crew data and update local cache
                        const baseProjectCrews = serverProjectCrews.map(projectCrewWithDetails => {
                            const { project_name, ...baseProjectCrew } = projectCrewWithDetails;
                            return baseProjectCrew;
                        });

                        // Update local cache
                        await db.projectCrews.bulkPut(baseProjectCrews);

                        return serverProjectCrews;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch project crews by project from server, using cache:', error);
            }
        }

        return projectCrewsWithDetails.sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime());

    } catch (error) {
        console.error('Error getting project crews by project ID:', error);
        return [];
    }
}

/**
 * Get project crews by crew ID - Offline-first implementation
 * @param businessId - The business ID
 * @param crewId - The crew ID to get project assignments for
 */
export async function getProjectCrewsByCrewId(businessId: string, crewId: string): Promise<ProjectCrew[]> {
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

        // Get project crews from cache
        const projectCrews = await db.projectCrews
            .where('crew_id')
            .equals(crewId)
            .and(pc => pc.business_id === businessId)
            .sortBy('start_date');

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-crews/crew/${crewId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverProjectCrews = await response.json();

                    if (serverProjectCrews && Array.isArray(serverProjectCrews)) {
                        // Update local cache
                        await db.projectCrews.bulkPut(serverProjectCrews);

                        return serverProjectCrews.sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch project crews by crew from server, using cache:', error);
            }
        }

        return projectCrews;

    } catch (error) {
        console.error('Error getting project crews by crew ID:', error);
        return [];
    }
}

/**
 * Get active project crews (no end date or end date in future) - Offline-first implementation
 * @param businessId - The business ID
 */
export async function getActiveProjectCrews(businessId: string): Promise<ProjectCrew[]> {
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

        // Get all project crews for this business
        const allProjectCrews = await db.projectCrews
            .where('business_id')
            .equals(businessId)
            .toArray();

        // Filter for active ones (no end date or end date in future)
        const now = new Date();
        const activeProjectCrews = allProjectCrews.filter(pc =>
            !pc.end_date || new Date(pc.end_date) > now
        );

        return activeProjectCrews.sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime());

    } catch (error) {
        console.error('Error getting active project crews:', error);
        return [];
    }
}

/**
 * Search project crews - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchProjectCrews(businessId: string, searchQuery: string): Promise<ProjectCrew[]> {
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

        // Get all project crews from cache first
        const allProjectCrews = await db.projectCrews
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allProjectCrews.sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime());
            }

            // Simple local search by notes
            const query = searchQuery.toLowerCase();
            return allProjectCrews.filter(pc =>
                (pc.notes && pc.notes.toLowerCase().includes(query))
            ).sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime());
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/project-crews/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverProjectCrews = await response.json();

                if (serverProjectCrews && Array.isArray(serverProjectCrews)) {
                    // Update local cache
                    await db.projectCrews.bulkPut(serverProjectCrews);

                    return serverProjectCrews;
                }
            }
        } catch (error) {
            console.warn('Failed to search project crews on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allProjectCrews.filter(pc =>
            (pc.notes && pc.notes.toLowerCase().includes(query))
        ).sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime());

    } catch (error) {
        console.error('Error searching project crews:', error);
        return [];
    }
}
