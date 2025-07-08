"use client";

/**
 * Equipment Assignments Client Actions - Offline-First Implementation (Phase 4.6 - Equipment Extensions)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { EquipmentAssignment, EquipmentAssignmentInsert, EquipmentAssignmentUpdate, EquipmentAssignmentWithDetails } from "@/types/equipment-assignments";
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
 * Get all equipment assignments for a business - Offline-first implementation
 * @param businessId - The business ID to get equipment assignments for
 */
export async function getEquipmentAssignments(businessId: string): Promise<EquipmentAssignment[]> {
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
        const cachedAssignments = await db.equipmentAssignments
            .where('business_id')
            .equals(businessId)
            .sortBy('created_at');

        if (cachedAssignments.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`equipmentAssignments_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedAssignments;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-assignments/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverAssignments = await response.json();

                    if (serverAssignments && Array.isArray(serverAssignments)) {
                        // Update local cache
                        await db.equipmentAssignments.bulkPut(serverAssignments);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `equipmentAssignments_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'equipmentAssignments'
                        });

                        return serverAssignments.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment assignments from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedAssignments;

    } catch (error) {
        console.error('Error getting equipment assignments:', error);
        return [];
    }
}

/**
 * Get equipment assignment by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param assignmentId - The equipment assignment ID to get
 */
export async function getEquipmentAssignmentById(businessId: string, assignmentId: string): Promise<EquipmentAssignment | null> {
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
        const cachedAssignment = await db.equipmentAssignments.get(assignmentId);

        if (cachedAssignment && cachedAssignment.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`equipmentAssignments_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedAssignment;
                }
            } else {
                // If offline, return cached data
                return cachedAssignment;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-assignments/${assignmentId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverAssignment = await response.json();

                    if (serverAssignment) {
                        // Update local cache
                        await db.equipmentAssignments.put(serverAssignment);

                        return serverAssignment;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment assignment from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedAssignment || null;

    } catch (error) {
        console.error('Error getting equipment assignment by ID:', error);
        return null;
    }
}

/**
 * Create equipment assignment - Offline-first implementation with authorization
 * @param businessId - The business ID to create equipment assignment for
 * @param assignmentData - The equipment assignment data to create
 */
export async function createEquipmentAssignment(
    businessId: string,
    assignmentData: EquipmentAssignmentInsert
): Promise<{ success: boolean; data?: EquipmentAssignment; error?: string }> {
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

        // Validate equipment exists and belongs to business
        const equipment = await db.equipment.get(assignmentData.equipment_id);
        if (!equipment || equipment.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid equipment or equipment does not belong to this business."
            };
        }

        // Validate project exists and belongs to business
        const project = await db.projects.get(assignmentData.project_id);
        if (!project || project.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid project or project does not belong to this business."
            };
        }

        // Validate crew exists and belongs to business
        const crew = await db.crews.get(assignmentData.crew_id);
        if (!crew || crew.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid crew or crew does not belong to this business."
            };
        }

        const now = new Date().toISOString();
        const assignmentId = uuidv4();

        // Create equipment assignment object
        const newAssignment: EquipmentAssignment = {
            id: assignmentId,
            business_id: businessId,
            equipment_id: assignmentData.equipment_id,
            crew_id: assignmentData.crew_id,
            project_id: assignmentData.project_id,
            assigned_by: assignmentData.assigned_by || currentUserAuthId,
            start_date: assignmentData.start_date,
            end_date: assignmentData.end_date || null,
            status: assignmentData.status || 'active',
            notes: assignmentData.notes || null,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.equipmentAssignments.put(newAssignment);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentAssignments',
            'insert',
            newAssignment,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/equipment-assignments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...assignmentData,
                        businessId,
                        id: assignmentId
                    }),
                });

                if (response.ok) {
                    const serverAssignment = await response.json();

                    // Update local data with server response
                    await db.equipmentAssignments.put(serverAssignment);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentAssignments')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentAssignments_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentAssignments'
                    });

                    return { success: true, data: serverAssignment };
                }
            } catch (error) {
                console.warn('Failed to sync equipment assignment to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newAssignment };

    } catch (error) {
        console.error('Error creating equipment assignment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create equipment assignment"
        };
    }
}

/**
 * Update equipment assignment - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param assignmentId - The equipment assignment ID to update
 * @param assignmentData - The equipment assignment data to update
 */
export async function updateEquipmentAssignment(
    businessId: string,
    assignmentId: string,
    assignmentData: EquipmentAssignmentUpdate
): Promise<{ success: boolean; data?: EquipmentAssignment; error?: string }> {
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

        // Get current assignment
        const currentAssignment = await db.equipmentAssignments.get(assignmentId);
        if (!currentAssignment) {
            return {
                success: false,
                error: "Equipment assignment not found."
            };
        }

        // Verify the assignment belongs to the business
        if (currentAssignment.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment assignment does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<EquipmentAssignment> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from assignmentData
        if (assignmentData.equipment_id !== undefined) updateData.equipment_id = assignmentData.equipment_id;
        if (assignmentData.crew_id !== undefined) updateData.crew_id = assignmentData.crew_id;
        if (assignmentData.project_id !== undefined) updateData.project_id = assignmentData.project_id;
        if (assignmentData.assigned_by !== undefined) updateData.assigned_by = assignmentData.assigned_by;
        if (assignmentData.start_date !== undefined) updateData.start_date = assignmentData.start_date;
        if (assignmentData.end_date !== undefined) updateData.end_date = assignmentData.end_date;
        if (assignmentData.status !== undefined) updateData.status = assignmentData.status;
        if (assignmentData.notes !== undefined) updateData.notes = assignmentData.notes;

        // Update locally first (optimistic update)
        const updatedAssignment = { ...currentAssignment, ...updateData };
        await db.equipmentAssignments.put(updatedAssignment);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentAssignments',
            'update',
            updatedAssignment,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-assignments/${assignmentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverAssignment = await response.json();

                    // Update local data with server response
                    await db.equipmentAssignments.put(serverAssignment);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentAssignments')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentAssignments_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentAssignments'
                    });

                    return { success: true, data: serverAssignment };
                }
            } catch (error) {
                console.warn('Failed to sync equipment assignment update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedAssignment };

    } catch (error) {
        console.error('Error updating equipment assignment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update equipment assignment"
        };
    }
}

/**
 * Delete equipment assignment - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param assignmentId - The equipment assignment ID to delete
 */
export async function deleteEquipmentAssignment(
    businessId: string,
    assignmentId: string
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

        // Get current assignment to verify it exists and belongs to business
        const currentAssignment = await db.equipmentAssignments.get(assignmentId);
        if (!currentAssignment) {
            return {
                success: false,
                error: "Equipment assignment not found."
            };
        }

        // Verify the assignment belongs to the business
        if (currentAssignment.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment assignment does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.equipmentAssignments.delete(assignmentId);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentAssignments',
            'delete',
            { id: assignmentId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-assignments/${assignmentId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentAssignments')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === assignmentId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentAssignments_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentAssignments'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync equipment assignment deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting equipment assignment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete equipment assignment"
        };
    }
}

/**
 * Get equipment assignments by equipment ID - Offline-first implementation
 * @param businessId - The business ID
 * @param equipmentId - The equipment ID to get assignments for
 */
export async function getEquipmentAssignmentsByEquipmentId(businessId: string, equipmentId: string): Promise<EquipmentAssignmentWithDetails[]> {
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

        // Get assignments from cache
        const assignments = await db.equipmentAssignments
            .where('equipment_id')
            .equals(equipmentId)
            .and(assignment => assignment.business_id === businessId)
            .toArray();

        // Get additional details for EquipmentAssignmentWithDetails
        const assignmentsWithDetails: EquipmentAssignmentWithDetails[] = [];
        for (const assignment of assignments) {
            // Get project and crew info
            const project = await db.projects.get(assignment.project_id);
            const crew = await db.crews.get(assignment.crew_id);

            assignmentsWithDetails.push({
                ...assignment,
                project_name: project?.name || null,
                crew_name: crew?.name || null
            });
        }

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-assignments/equipment/${equipmentId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverAssignments = await response.json();

                    if (serverAssignments && Array.isArray(serverAssignments)) {
                        // Extract base assignment data and update local cache
                        const baseAssignments = serverAssignments.map(assignmentWithDetails => {
                            const { project_name, crew_name, ...baseAssignment } = assignmentWithDetails;
                            return baseAssignment;
                        });

                        // Update local cache
                        await db.equipmentAssignments.bulkPut(baseAssignments);

                        return serverAssignments;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment assignments by equipment from server, using cache:', error);
            }
        }

        return assignmentsWithDetails.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error getting equipment assignments by equipment ID:', error);
        return [];
    }
}

/**
 * Search equipment assignments - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchEquipmentAssignments(businessId: string, searchQuery: string): Promise<EquipmentAssignment[]> {
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

        // Get all assignments from cache first
        const allAssignments = await db.equipmentAssignments
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allAssignments.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
            }

            // Simple local search (on notes and status)
            const query = searchQuery.toLowerCase();
            return allAssignments.filter(assignment =>
                (assignment.notes && assignment.notes.toLowerCase().includes(query)) ||
                (assignment.status && assignment.status.toLowerCase().includes(query))
            ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/equipment-assignments/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverAssignments = await response.json();

                if (serverAssignments && Array.isArray(serverAssignments)) {
                    // Update local cache
                    await db.equipmentAssignments.bulkPut(serverAssignments);

                    return serverAssignments;
                }
            }
        } catch (error) {
            console.warn('Failed to search equipment assignments on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allAssignments.filter(assignment =>
            (assignment.notes && assignment.notes.toLowerCase().includes(query)) ||
            (assignment.status && assignment.status.toLowerCase().includes(query))
        ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error searching equipment assignments:', error);
        return [];
    }
}

/**
 * Get sync status for equipment assignments
 * @param businessId - The business ID
 */
export async function getEquipmentAssignmentsSyncStatus(businessId: string): Promise<{
    lastSync: number | null;
    pendingChanges: number;
    hasUnsyncedData: boolean;
}> {
    try {
        // Get sync metadata
        const metadata = await db.syncMetadata.get(`equipmentAssignments_${businessId}`);

        // Count pending sync items
        const pendingChanges = await db.syncQueue
            .where('table')
            .equals('equipmentAssignments')
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        return {
            lastSync: metadata?.lastSync || null,
            pendingChanges,
            hasUnsyncedData: pendingChanges > 0
        };
    } catch (error) {
        console.error('Error getting equipment assignments sync status:', error);
        return {
            lastSync: null,
            pendingChanges: 0,
            hasUnsyncedData: false
        };
    }
}
