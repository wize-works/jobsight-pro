"use client";

/**
 * Crew Members Client Actions - Offline-First Implementation (Phase 4.3)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { CrewMember, CrewMemberInsert, CrewMemberUpdate } from "@/types/crew-members";
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
 * Get all crew members for a business - Offline-first implementation
 * @param businessId - The business ID to get crew members for
 */
export async function getCrewMembers(businessId: string): Promise<CrewMember[]> {
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
        const cachedCrewMembers = await db.crewMembers
            .where('business_id')
            .equals(businessId)
            .sortBy('name');

        if (cachedCrewMembers.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`crewMembers_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedCrewMembers;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-members/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverCrewMembers = await response.json();

                    if (serverCrewMembers && Array.isArray(serverCrewMembers)) {
                        // Update local cache
                        await db.crewMembers.bulkPut(serverCrewMembers);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `crewMembers_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'crewMembers'
                        });

                        return serverCrewMembers.sort((a, b) => a.name.localeCompare(b.name));
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch crew members from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedCrewMembers;

    } catch (error) {
        console.error('Error getting crew members:', error);
        return [];
    }
}

/**
 * Get crew member by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param crewMemberId - The crew member ID to get
 */
export async function getCrewMemberById(businessId: string, crewMemberId: string): Promise<CrewMember | null> {
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
        const cachedCrewMember = await db.crewMembers.get(crewMemberId);

        if (cachedCrewMember && cachedCrewMember.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`crewMembers_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedCrewMember;
                }
            } else {
                // If offline, return cached data
                return cachedCrewMember;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-members/${crewMemberId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverCrewMember = await response.json();

                    if (serverCrewMember) {
                        // Update local cache
                        await db.crewMembers.put(serverCrewMember);

                        return serverCrewMember;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch crew member from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedCrewMember || null;

    } catch (error) {
        console.error('Error getting crew member by ID:', error);
        return null;
    }
}

/**
 * Create crew member - Offline-first implementation with authorization
 * @param businessId - The business ID to create crew member for
 * @param crewMemberData - The crew member data to create
 */
export async function createCrewMember(
    businessId: string,
    crewMemberData: CrewMemberInsert
): Promise<{ success: boolean; data?: CrewMember; error?: string }> {
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
        const crewMemberId = uuidv4();

        // Create crew member object
        const newCrewMember: CrewMember = {
            id: crewMemberId,
            business_id: businessId,
            name: crewMemberData.name,
            phone: crewMemberData.phone || null,
            email: crewMemberData.email || null,
            avatar_url: crewMemberData.avatar_url || null,
            role: crewMemberData.role || 'laborer',
            experience: crewMemberData.experience || null,
            status: crewMemberData.status || 'active',
            notes: crewMemberData.notes || null,
            hourly_rate: crewMemberData.hourly_rate || null,
            overtime_rate: crewMemberData.overtime_rate || null,
            is_billable: crewMemberData.is_billable !== undefined ? crewMemberData.is_billable : true,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.crewMembers.put(newCrewMember);

        // Queue for sync with server
        await addToSyncQueue(
            'crewMembers',
            'insert',
            newCrewMember,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/crew-members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...crewMemberData,
                        businessId,
                        id: crewMemberId
                    }),
                });

                if (response.ok) {
                    const serverCrewMember = await response.json();

                    // Update local data with server response
                    await db.crewMembers.put(serverCrewMember);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('crewMembers')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `crewMembers_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'crewMembers'
                    });

                    return { success: true, data: serverCrewMember };
                }
            } catch (error) {
                console.warn('Failed to sync crew member to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newCrewMember };

    } catch (error) {
        console.error('Error creating crew member:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create crew member"
        };
    }
}

/**
 * Update crew member - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param crewMemberId - The crew member ID to update
 * @param crewMemberData - The crew member data to update
 */
export async function updateCrewMember(
    businessId: string,
    crewMemberId: string,
    crewMemberData: CrewMemberUpdate
): Promise<{ success: boolean; data?: CrewMember; error?: string }> {
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

        // Get current crew member
        const currentCrewMember = await db.crewMembers.get(crewMemberId);
        if (!currentCrewMember) {
            return {
                success: false,
                error: "Crew member not found."
            };
        }

        // Verify the crew member belongs to the business
        if (currentCrewMember.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Crew member does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<CrewMember> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from crewMemberData
        if (crewMemberData.name !== undefined) updateData.name = crewMemberData.name;
        if (crewMemberData.phone !== undefined) updateData.phone = crewMemberData.phone;
        if (crewMemberData.email !== undefined) updateData.email = crewMemberData.email;
        if (crewMemberData.avatar_url !== undefined) updateData.avatar_url = crewMemberData.avatar_url;
        if (crewMemberData.role !== undefined) updateData.role = crewMemberData.role;
        if (crewMemberData.experience !== undefined) updateData.experience = crewMemberData.experience;
        if (crewMemberData.status !== undefined) updateData.status = crewMemberData.status;
        if (crewMemberData.notes !== undefined) updateData.notes = crewMemberData.notes;
        if (crewMemberData.hourly_rate !== undefined) updateData.hourly_rate = crewMemberData.hourly_rate;
        if (crewMemberData.overtime_rate !== undefined) updateData.overtime_rate = crewMemberData.overtime_rate;
        if (crewMemberData.is_billable !== undefined) updateData.is_billable = crewMemberData.is_billable;

        // Update locally first (optimistic update)
        const updatedCrewMember = { ...currentCrewMember, ...updateData };
        await db.crewMembers.put(updatedCrewMember);

        // Queue for sync with server
        await addToSyncQueue(
            'crewMembers',
            'update',
            updatedCrewMember,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-members/${crewMemberId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverCrewMember = await response.json();

                    // Update local data with server response
                    await db.crewMembers.put(serverCrewMember);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('crewMembers')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `crewMembers_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'crewMembers'
                    });

                    return { success: true, data: serverCrewMember };
                }
            } catch (error) {
                console.warn('Failed to sync crew member update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedCrewMember };

    } catch (error) {
        console.error('Error updating crew member:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update crew member"
        };
    }
}

/**
 * Delete crew member - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param crewMemberId - The crew member ID to delete
 */
export async function deleteCrewMember(
    businessId: string,
    crewMemberId: string
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

        // Get current crew member to verify it exists and belongs to business
        const currentCrewMember = await db.crewMembers.get(crewMemberId);
        if (!currentCrewMember) {
            return {
                success: false,
                error: "Crew member not found."
            };
        }

        // Verify the crew member belongs to the business
        if (currentCrewMember.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Crew member does not belong to this business."
            };
        }

        // Check if crew member has active assignments
        const activeAssignments = await db.crewMemberAssignments
            .where('crew_member_id')
            .equals(crewMemberId)
            .toArray();

        if (activeAssignments.length > 0) {
            return {
                success: false,
                error: "Cannot delete crew member with active assignments. Please remove assignments first."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.crewMembers.delete(crewMemberId);

        // Queue for sync with server
        await addToSyncQueue(
            'crewMembers',
            'delete',
            { id: crewMemberId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-members/${crewMemberId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('crewMembers')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === crewMemberId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `crewMembers_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'crewMembers'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync crew member deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting crew member:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete crew member"
        };
    }
}

/**
 * Search crew members - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchCrewMembers(businessId: string, searchQuery: string): Promise<CrewMember[]> {
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

        // Get all crew members from cache first
        const allCrewMembers = await db.crewMembers
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allCrewMembers.sort((a, b) => a.name.localeCompare(b.name));
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allCrewMembers.filter(crewMember =>
                crewMember.name.toLowerCase().includes(query) ||
                (crewMember.email && crewMember.email.toLowerCase().includes(query)) ||
                (crewMember.phone && crewMember.phone.includes(query)) ||
                (crewMember.role && crewMember.role.toLowerCase().includes(query))
            ).sort((a, b) => a.name.localeCompare(b.name));
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/crew-members/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverCrewMembers = await response.json();

                if (serverCrewMembers && Array.isArray(serverCrewMembers)) {
                    // Update local cache
                    await db.crewMembers.bulkPut(serverCrewMembers);

                    return serverCrewMembers;
                }
            }
        } catch (error) {
            console.warn('Failed to search crew members on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allCrewMembers.filter(crewMember =>
            crewMember.name.toLowerCase().includes(query) ||
            (crewMember.email && crewMember.email.toLowerCase().includes(query)) ||
            (crewMember.phone && crewMember.phone.includes(query)) ||
            (crewMember.role && crewMember.role.toLowerCase().includes(query))
        ).sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
        console.error('Error searching crew members:', error);
        return [];
    }
}

/**
 * Get crew members by status - Offline-first implementation
 * @param businessId - The business ID
 * @param status - The status to filter by
 */
export async function getCrewMembersByStatus(businessId: string, status: string): Promise<CrewMember[]> {
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

        // Get crew members from cache
        const crewMembers = await db.crewMembers
            .where('business_id')
            .equals(businessId)
            .and(crewMember => crewMember.status === status)
            .sortBy('name');

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/crew-members/business/${businessId}/status/${status}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverCrewMembers = await response.json();

                    if (serverCrewMembers && Array.isArray(serverCrewMembers)) {
                        // Update local cache
                        await db.crewMembers.bulkPut(serverCrewMembers);

                        return serverCrewMembers.sort((a, b) => a.name.localeCompare(b.name));
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch crew members by status from server, using cache:', error);
            }
        }

        return crewMembers;

    } catch (error) {
        console.error('Error getting crew members by status:', error);
        return [];
    }
}

/**
 * Get crew member statistics - Offline-first implementation
 * @param businessId - The business ID
 */
export async function getCrewMemberStats(businessId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byRole: Record<string, number>;
    averageExperience: number;
}> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return { total: 0, byStatus: {}, byRole: {}, averageExperience: 0 };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return { total: 0, byStatus: {}, byRole: {}, averageExperience: 0 };
        }

        // Get all crew members for this business
        const crewMembers = await db.crewMembers
            .where('business_id')
            .equals(businessId)
            .toArray();

        // Calculate statistics
        const stats = {
            total: crewMembers.length,
            byStatus: {} as Record<string, number>,
            byRole: {} as Record<string, number>,
            averageExperience: 0
        };

        // Count by status
        crewMembers.forEach(member => {
            const status = member.status || 'unknown';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        });

        // Count by role
        crewMembers.forEach(member => {
            const role = member.role || 'unknown';
            stats.byRole[role] = (stats.byRole[role] || 0) + 1;
        });

        // Calculate average experience
        const membersWithExperience = crewMembers.filter(member => typeof member.experience === 'number');
        if (membersWithExperience.length > 0) {
            const totalExperience = membersWithExperience.reduce((sum, member) => sum + (member.experience || 0), 0);
            stats.averageExperience = totalExperience / membersWithExperience.length;
        }

        return stats;

    } catch (error) {
        console.error('Error getting crew member statistics:', error);
        return { total: 0, byStatus: {}, byRole: {}, averageExperience: 0 };
    }
}
