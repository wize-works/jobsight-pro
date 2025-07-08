"use client";

/**
 * Crew Member Assignments Client Actions - Offline-First Implementation (Phase 4.3)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { CrewMemberAssignment, CrewMemberAssignmentInsert, CrewMemberAssignmentUpdate } from "@/types/crew-member-assignments";
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
 * Get all crew member assignments for a business - Offline-first implementation
 * @param businessId - The business ID to get assignments for
 */
export async function getCrewMemberAssignments(businessId: string): Promise<CrewMemberAssignment[]> {
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
        const cachedAssignments = await db.crewMemberAssignments
            .where('business_id')
            .equals(businessId)
            .sortBy('created_at');

        if (cachedAssignments.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`crewMemberAssignments_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedAssignments;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-member-assignments/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverAssignments = await response.json();

                    if (serverAssignments && Array.isArray(serverAssignments)) {
                        // Update local cache
                        await db.crewMemberAssignments.bulkPut(serverAssignments);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `crewMemberAssignments_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'crewMemberAssignments'
                        });

                        return serverAssignments.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch crew member assignments from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedAssignments;

    } catch (error) {
        console.error('Error getting crew member assignments:', error);
        return [];
    }
}

/**
 * Get crew member assignment by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param assignmentId - The assignment ID to get
 */
export async function getCrewMemberAssignmentById(businessId: string, assignmentId: string): Promise<CrewMemberAssignment | null> {
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
        const cachedAssignment = await db.crewMemberAssignments.get(assignmentId);

        if (cachedAssignment && cachedAssignment.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`crewMemberAssignments_${businessId}`);

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
                const response = await fetch(`/api/crew-member-assignments/${assignmentId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverAssignment = await response.json();

                    if (serverAssignment) {
                        // Update local cache
                        await db.crewMemberAssignments.put(serverAssignment);

                        return serverAssignment;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch crew member assignment from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedAssignment || null;

    } catch (error) {
        console.error('Error getting crew member assignment by ID:', error);
        return null;
    }
}

/**
 * Create crew member assignment - Offline-first implementation with authorization
 * @param businessId - The business ID to create assignment for
 * @param assignmentData - The assignment data to create
 */
export async function createCrewMemberAssignment(
    businessId: string,
    assignmentData: CrewMemberAssignmentInsert
): Promise<{ success: boolean; data?: CrewMemberAssignment; error?: string }> {
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
        const crew = await db.crews.get(assignmentData.crew_id);
        if (!crew || crew.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid crew or crew does not belong to this business."
            };
        }

        // Validate crew member exists and belongs to business
        const crewMember = await db.crewMembers.get(assignmentData.crew_member_id);
        if (!crewMember || crewMember.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid crew member or crew member does not belong to this business."
            };
        }

        // Check for existing assignment
        const existingAssignment = await db.crewMemberAssignments
            .where('crew_id')
            .equals(assignmentData.crew_id)
            .and(assignment => assignment.crew_member_id === assignmentData.crew_member_id)
            .first();

        if (existingAssignment) {
            return {
                success: false,
                error: "Crew member is already assigned to this crew."
            };
        }

        const now = new Date().toISOString();
        const assignmentId = uuidv4();

        // Create assignment object
        const newAssignment: CrewMemberAssignment = {
            id: assignmentId,
            business_id: businessId,
            crew_id: assignmentData.crew_id,
            crew_member_id: assignmentData.crew_member_id,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.crewMemberAssignments.put(newAssignment);

        // Queue for sync with server
        await addToSyncQueue(
            'crewMemberAssignments',
            'insert',
            newAssignment,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/crew-member-assignments', {
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
                    await db.crewMemberAssignments.put(serverAssignment);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('crewMemberAssignments')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `crewMemberAssignments_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'crewMemberAssignments'
                    });

                    return { success: true, data: serverAssignment };
                }
            } catch (error) {
                console.warn('Failed to sync crew member assignment to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newAssignment };

    } catch (error) {
        console.error('Error creating crew member assignment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create crew member assignment"
        };
    }
}

/**
 * Delete crew member assignment - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param assignmentId - The assignment ID to delete
 */
export async function deleteCrewMemberAssignment(
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
        const currentAssignment = await db.crewMemberAssignments.get(assignmentId);
        if (!currentAssignment) {
            return {
                success: false,
                error: "Crew member assignment not found."
            };
        }

        // Verify the assignment belongs to the business
        if (currentAssignment.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Assignment does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.crewMemberAssignments.delete(assignmentId);

        // Queue for sync with server
        await addToSyncQueue(
            'crewMemberAssignments',
            'delete',
            { id: assignmentId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-member-assignments/${assignmentId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('crewMemberAssignments')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === assignmentId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `crewMemberAssignments_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'crewMemberAssignments'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync crew member assignment deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting crew member assignment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete crew member assignment"
        };
    }
}

/**
 * Get assignments by crew ID - Offline-first implementation
 * @param businessId - The business ID
 * @param crewId - The crew ID to get assignments for
 */
export async function getAssignmentsByCrewId(businessId: string, crewId: string): Promise<CrewMemberAssignment[]> {
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
        const assignments = await db.crewMemberAssignments
            .where('crew_id')
            .equals(crewId)
            .and(assignment => assignment.business_id === businessId)
            .sortBy('created_at');

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-member-assignments/crew/${crewId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverAssignments = await response.json();

                    if (serverAssignments && Array.isArray(serverAssignments)) {
                        // Update local cache
                        await db.crewMemberAssignments.bulkPut(serverAssignments);

                        return serverAssignments.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch assignments by crew from server, using cache:', error);
            }
        }

        return assignments;

    } catch (error) {
        console.error('Error getting assignments by crew ID:', error);
        return [];
    }
}

/**
 * Get assignments by crew member ID - Offline-first implementation
 * @param businessId - The business ID
 * @param crewMemberId - The crew member ID to get assignments for
 */
export async function getAssignmentsByCrewMemberId(businessId: string, crewMemberId: string): Promise<CrewMemberAssignment[]> {
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
        const assignments = await db.crewMemberAssignments
            .where('crew_member_id')
            .equals(crewMemberId)
            .and(assignment => assignment.business_id === businessId)
            .sortBy('created_at');

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-member-assignments/crew-member/${crewMemberId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverAssignments = await response.json();

                    if (serverAssignments && Array.isArray(serverAssignments)) {
                        // Update local cache
                        await db.crewMemberAssignments.bulkPut(serverAssignments);

                        return serverAssignments.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch assignments by crew member from server, using cache:', error);
            }
        }

        return assignments;

    } catch (error) {
        console.error('Error getting assignments by crew member ID:', error);
        return [];
    }
}

/**
 * Bulk assign crew members to a crew - Offline-first implementation
 * @param businessId - The business ID
 * @param crewId - The crew ID to assign members to
 * @param crewMemberIds - Array of crew member IDs to assign
 */
export async function bulkAssignCrewMembers(
    businessId: string,
    crewId: string,
    crewMemberIds: string[]
): Promise<{ success: boolean; data?: CrewMemberAssignment[]; error?: string }> {
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
        const crew = await db.crews.get(crewId);
        if (!crew || crew.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid crew or crew does not belong to this business."
            };
        }

        const now = new Date().toISOString();
        const newAssignments: CrewMemberAssignment[] = [];

        // Create assignments for each crew member
        for (const crewMemberId of crewMemberIds) {
            // Validate crew member exists and belongs to business
            const crewMember = await db.crewMembers.get(crewMemberId);
            if (!crewMember || crewMember.business_id !== businessId) {
                continue; // Skip invalid crew members
            }

            // Check for existing assignment
            const existingAssignment = await db.crewMemberAssignments
                .where('crew_id')
                .equals(crewId)
                .and(assignment => assignment.crew_member_id === crewMemberId)
                .first();

            if (existingAssignment) {
                continue; // Skip if already assigned
            }

            const assignmentId = uuidv4();
            const newAssignment: CrewMemberAssignment = {
                id: assignmentId,
                business_id: businessId,
                crew_id: crewId,
                crew_member_id: crewMemberId,
                created_at: now,
                created_by: currentUserAuthId,
                updated_at: now,
                updated_by: currentUserAuthId,
            };

            newAssignments.push(newAssignment);
        }

        if (newAssignments.length === 0) {
            return {
                success: false,
                error: "No valid crew members to assign (they may already be assigned or invalid)."
            };
        }

        // Store locally immediately (optimistic update)
        await db.crewMemberAssignments.bulkPut(newAssignments);

        // Queue each assignment for sync with server
        for (const assignment of newAssignments) {
            await addToSyncQueue(
                'crewMemberAssignments',
                'insert',
                assignment,
                businessId,
                currentUserAuthId
            );
        }

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/crew-member-assignments/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId,
                        crewId,
                        crewMemberIds,
                        assignments: newAssignments
                    }),
                });

                if (response.ok) {
                    const serverAssignments = await response.json();

                    if (serverAssignments && Array.isArray(serverAssignments)) {
                        // Update local data with server response
                        await db.crewMemberAssignments.bulkPut(serverAssignments);

                        // Mark as synced
                        await db.syncQueue
                            .where('table')
                            .equals('crewMemberAssignments')
                            .and(item =>
                                item.businessId === businessId &&
                                item.operation === 'insert'
                            )
                            .modify({ synced: true });

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `crewMemberAssignments_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'crewMemberAssignments'
                        });

                        return { success: true, data: serverAssignments };
                    }
                }
            } catch (error) {
                console.warn('Failed to sync bulk crew member assignments to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newAssignments };

    } catch (error) {
        console.error('Error bulk assigning crew members:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to bulk assign crew members"
        };
    }
}
