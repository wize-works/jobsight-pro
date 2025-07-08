"use client";

/**
 * Project Issues Client Actions - Offline-First Implementation (Phase 4.5 - Project Extensions)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { ProjectIssue, ProjectIssueInsert, ProjectIssueUpdate, ProjectIssueWithDetails } from "@/types/projects-issues";
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
 * Get all project issues for a business - Offline-first implementation
 * @param businessId - The business ID to get project issues for
 */
export async function getProjectIssues(businessId: string): Promise<ProjectIssue[]> {
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
        const cachedIssues = await db.projectIssues
            .where('business_id')
            .equals(businessId)
            .sortBy('created_at');

        if (cachedIssues.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`projectIssues_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedIssues;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-issues/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverIssues = await response.json();

                    if (serverIssues && Array.isArray(serverIssues)) {
                        // Update local cache
                        await db.projectIssues.bulkPut(serverIssues);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `projectIssues_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'projectIssues'
                        });

                        return serverIssues.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch project issues from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedIssues;

    } catch (error) {
        console.error('Error getting project issues:', error);
        return [];
    }
}

/**
 * Get project issue by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param issueId - The project issue ID to get
 */
export async function getProjectIssueById(businessId: string, issueId: string): Promise<ProjectIssue | null> {
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
        const cachedIssue = await db.projectIssues.get(issueId);

        if (cachedIssue && cachedIssue.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`projectIssues_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedIssue;
                }
            } else {
                // If offline, return cached data
                return cachedIssue;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-issues/${issueId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverIssue = await response.json();

                    if (serverIssue) {
                        // Update local cache
                        await db.projectIssues.put(serverIssue);

                        return serverIssue;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch project issue from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedIssue || null;

    } catch (error) {
        console.error('Error getting project issue by ID:', error);
        return null;
    }
}

/**
 * Create project issue - Offline-first implementation with authorization
 * @param businessId - The business ID to create project issue for
 * @param issueData - The project issue data to create
 */
export async function createProjectIssue(
    businessId: string,
    issueData: ProjectIssueInsert
): Promise<{ success: boolean; data?: ProjectIssue; error?: string }> {
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
        const project = await db.projects.get(issueData.project_id);
        if (!project || project.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid project or project does not belong to this business."
            };
        }

        const now = new Date().toISOString();
        const issueId = uuidv4();

        // Create project issue object
        const newIssue: ProjectIssue = {
            id: issueId,
            business_id: businessId,
            project_id: issueData.project_id,
            title: issueData.title,
            description: issueData.description || null,
            status: issueData.status || 'open',
            priority: issueData.priority || 'medium',
            reported_date: issueData.reported_date || now,
            reported_by: issueData.reported_by || currentUserAuthId,
            assigned_to: issueData.assigned_to || null,
            resolution: issueData.resolution || null,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.projectIssues.put(newIssue);

        // Queue for sync with server
        await addToSyncQueue(
            'projectIssues',
            'insert',
            newIssue,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/project-issues', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...issueData,
                        businessId,
                        id: issueId
                    }),
                });

                if (response.ok) {
                    const serverIssue = await response.json();

                    // Update local data with server response
                    await db.projectIssues.put(serverIssue);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('projectIssues')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projectIssues_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projectIssues'
                    });

                    return { success: true, data: serverIssue };
                }
            } catch (error) {
                console.warn('Failed to sync project issue to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newIssue };

    } catch (error) {
        console.error('Error creating project issue:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create project issue"
        };
    }
}

/**
 * Update project issue - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param issueId - The project issue ID to update
 * @param issueData - The project issue data to update
 */
export async function updateProjectIssue(
    businessId: string,
    issueId: string,
    issueData: ProjectIssueUpdate
): Promise<{ success: boolean; data?: ProjectIssue; error?: string }> {
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

        // Get current project issue
        const currentIssue = await db.projectIssues.get(issueId);
        if (!currentIssue) {
            return {
                success: false,
                error: "Project issue not found."
            };
        }

        // Verify the issue belongs to the business
        if (currentIssue.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Project issue does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<ProjectIssue> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from issueData
        if (issueData.title !== undefined) updateData.title = issueData.title;
        if (issueData.description !== undefined) updateData.description = issueData.description;
        if (issueData.status !== undefined) updateData.status = issueData.status;
        if (issueData.priority !== undefined) updateData.priority = issueData.priority;
        if (issueData.assigned_to !== undefined) updateData.assigned_to = issueData.assigned_to;
        if (issueData.reported_date !== undefined) updateData.reported_date = issueData.reported_date;
        if (issueData.reported_by !== undefined) updateData.reported_by = issueData.reported_by;
        if (issueData.resolution !== undefined) updateData.resolution = issueData.resolution;

        // Update locally first (optimistic update)
        const updatedIssue = { ...currentIssue, ...updateData };
        await db.projectIssues.put(updatedIssue);

        // Queue for sync with server
        await addToSyncQueue(
            'projectIssues',
            'update',
            updatedIssue,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-issues/${issueId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverIssue = await response.json();

                    // Update local data with server response
                    await db.projectIssues.put(serverIssue);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('projectIssues')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projectIssues_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projectIssues'
                    });

                    return { success: true, data: serverIssue };
                }
            } catch (error) {
                console.warn('Failed to sync project issue update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedIssue };

    } catch (error) {
        console.error('Error updating project issue:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update project issue"
        };
    }
}

/**
 * Delete project issue - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param issueId - The project issue ID to delete
 */
export async function deleteProjectIssue(
    businessId: string,
    issueId: string
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

        // Get current issue to verify it exists and belongs to business
        const currentIssue = await db.projectIssues.get(issueId);
        if (!currentIssue) {
            return {
                success: false,
                error: "Project issue not found."
            };
        }

        // Verify the issue belongs to the business
        if (currentIssue.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Project issue does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.projectIssues.delete(issueId);

        // Queue for sync with server
        await addToSyncQueue(
            'projectIssues',
            'delete',
            { id: issueId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-issues/${issueId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('projectIssues')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === issueId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projectIssues_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projectIssues'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync project issue deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting project issue:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete project issue"
        };
    }
}

/**
 * Get project issues by project ID - Offline-first implementation
 * @param businessId - The business ID
 * @param projectId - The project ID to get issues for
 */
export async function getProjectIssuesByProjectId(businessId: string, projectId: string): Promise<ProjectIssueWithDetails[]> {
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

        // Get issues from cache
        const issues = await db.projectIssues
            .where('project_id')
            .equals(projectId)
            .and(issue => issue.business_id === businessId)
            .toArray();

        // Get project info for ProjectIssueWithDetails
        const project = await db.projects.get(projectId);

        // Get user info for assigned_to fields
        const issuesWithDetails: ProjectIssueWithDetails[] = [];
        for (const issue of issues) {
            let assignedToName = '';

            if (issue.assigned_to) {
                const assignedUser = await db.users
                    .where('auth_id')
                    .equals(issue.assigned_to)
                    .first();
                assignedToName = assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : '';
            }

            issuesWithDetails.push({
                ...issue,
                project_name: project?.name || '',
                assigned_to_name: assignedToName
            });
        }

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/project-issues/project/${projectId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverIssues = await response.json();

                    if (serverIssues && Array.isArray(serverIssues)) {
                        // Extract base issue data and update local cache
                        const baseIssues = serverIssues.map(issueWithDetails => {
                            const { project_name, assigned_to_name, ...baseIssue } = issueWithDetails;
                            return baseIssue;
                        });

                        // Update local cache
                        await db.projectIssues.bulkPut(baseIssues);

                        return serverIssues;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch project issues by project from server, using cache:', error);
            }
        }

        return issuesWithDetails.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error getting project issues by project ID:', error);
        return [];
    }
}

/**
 * Search project issues - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchProjectIssues(businessId: string, searchQuery: string): Promise<ProjectIssue[]> {
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

        // Get all issues from cache first
        const allIssues = await db.projectIssues
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allIssues.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allIssues.filter(issue =>
                issue.title.toLowerCase().includes(query) ||
                (issue.description && issue.description.toLowerCase().includes(query))
            ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/project-issues/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverIssues = await response.json();

                if (serverIssues && Array.isArray(serverIssues)) {
                    // Update local cache
                    await db.projectIssues.bulkPut(serverIssues);

                    return serverIssues;
                }
            }
        } catch (error) {
            console.warn('Failed to search project issues on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allIssues.filter(issue =>
            issue.title.toLowerCase().includes(query) ||
            (issue.description && issue.description.toLowerCase().includes(query))
        ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error searching project issues:', error);
        return [];
    }
}

/**
 * Bulk create project issues - Offline-first implementation
 * @param businessId - The business ID
 * @param issuesData - Array of project issue data to create
 */
export async function bulkCreateProjectIssues(
    businessId: string,
    issuesData: ProjectIssueInsert[]
): Promise<{ success: boolean; data?: ProjectIssue[]; error?: string }> {
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
        const issues: ProjectIssue[] = issuesData.map(data => ({
            id: uuidv4(),
            business_id: businessId,
            project_id: data.project_id,
            title: data.title,
            description: data.description || null,
            status: data.status || 'open',
            priority: data.priority || 'medium',
            reported_date: data.reported_date || now,
            reported_by: data.reported_by || currentUserAuthId,
            assigned_to: data.assigned_to || null,
            resolution: data.resolution || null,
            created_at: now,
            updated_at: now,
            created_by: currentUserAuthId,
            updated_by: currentUserAuthId,
        }));

        // Store in local database immediately (optimistic update)
        await db.projectIssues.bulkPut(issues);

        // Queue for sync with server
        for (const issue of issues) {
            await addToSyncQueue(
                'projectIssues',
                'insert',
                issue,
                businessId,
                currentUserAuthId
            );
        }

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/project-issues/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId,
                        issues: issuesData.map((data, index) => ({
                            ...data,
                            id: issues[index].id
                        }))
                    }),
                });

                if (response.ok) {
                    const serverIssues = await response.json();

                    if (serverIssues && Array.isArray(serverIssues)) {
                        // Update local data with server response
                        await db.projectIssues.bulkPut(serverIssues);

                        // Mark as synced
                        await db.syncQueue
                            .where('table')
                            .equals('projectIssues')
                            .and(item =>
                                item.businessId === businessId &&
                                item.operation === 'insert'
                            )
                            .modify({ synced: true });

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `projectIssues_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'projectIssues'
                        });

                        return { success: true, data: serverIssues };
                    }
                }
            } catch (error) {
                console.warn('Failed to sync bulk project issues to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: issues };

    } catch (error) {
        console.error('Error bulk creating project issues:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create project issues"
        };
    }
}

/**
 * Get sync status for project issues
 * @param businessId - The business ID
 */
export async function getProjectIssuesSyncStatus(businessId: string): Promise<{
    lastSync: number | null;
    pendingChanges: number;
    hasUnsyncedData: boolean;
}> {
    try {
        // Get sync metadata
        const metadata = await db.syncMetadata.get(`projectIssues_${businessId}`);

        // Count pending sync items
        const pendingChanges = await db.syncQueue
            .where('table')
            .equals('projectIssues')
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        return {
            lastSync: metadata?.lastSync || null,
            pendingChanges,
            hasUnsyncedData: pendingChanges > 0
        };
    } catch (error) {
        console.error('Error getting project issues sync status:', error);
        return {
            lastSync: null,
            pendingChanges: 0,
            hasUnsyncedData: false
        };
    }
}
