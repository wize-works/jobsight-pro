"use client";

/**
 * Crews Client Actions - Offline-First Implementation (Phase 4.3 - Crew Management System)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { Crew, CrewInsert, CrewUpdate, CrewWithDetails } from "@/types/crews";
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

        // Fallback: Check if user is the business owner
        const business = await db.businesses.get(businessId);
        if (business && business.owner_id === userAuthId) {
            // Cache the mapping for future use
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
        console.error('Error validating user business access:', error);
        return false;
    }
}

/**
 * Create a new crew - Offline-First
 */
export async function createCrew(
    businessId: string,
    crewData: Omit<CrewInsert, 'id' | 'business_id' | 'created_at' | 'created_by'>
): Promise<{ success: boolean; data?: Crew; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        const crewId = uuidv4();
        const now = new Date().toISOString();

        const newCrew: Crew = {
            id: crewId,
            business_id: businessId,
            ...crewData,
            created_at: now,
            created_by: userId,
            updated_at: now,
            updated_by: userId
        };

        // Store locally first (offline-first approach)
        await db.crews.put(newCrew);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `crews_insert_${crewId}_${Date.now()}`,
            table: 'crews',
            operation: 'insert',
            data: newCrew,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: newCrew };
    } catch (error) {
        console.error('Error creating crew:', error);
        return { success: false, error: 'Failed to create crew' };
    }
}

/**
 * Get crew by ID - Cache-First with Server Fallback
 */
export async function getCrewById(
    businessId: string,
    crewId: string
): Promise<{ success: boolean; data?: Crew; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Try to get from local database first
        const localCrew = await db.crews.get(crewId);
        if (localCrew && localCrew.business_id === businessId) {
            return { success: true, data: localCrew };
        }

        // If not found locally and we're online, we could fetch from server
        // For now, return not found since we're focusing on offline-first
        return { success: false, error: 'Crew not found' };
    } catch (error) {
        console.error('Error getting crew:', error);
        return { success: false, error: 'Failed to get crew' };
    }
}

/**
 * Get all crews for a business - Cache-First
 */
export async function getBusinessCrews(
    businessId: string,
    filters?: {
        status?: string;
        specialty?: string;
        leaderId?: string;
        limit?: number;
        offset?: number;
    }
): Promise<{ success: boolean; data?: Crew[]; error?: string; total?: number }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get from local database with filtering
        let query = db.crews.where('business_id').equals(businessId);

        // Apply filters
        if (filters?.status || filters?.specialty || filters?.leaderId) {
            query = query.and(crew => {
                if (filters.status && crew.status !== filters.status) return false;
                if (filters.specialty && crew.specialty !== filters.specialty) return false;
                if (filters.leaderId && crew.leader_id !== filters.leaderId) return false;
                return true;
            });
        }

        // Get total count for pagination
        const total = await query.count();

        // Apply pagination
        if (filters?.offset) {
            query = query.offset(filters.offset);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        // Order by name
        const crews = await query.sortBy('name');

        return { success: true, data: crews, total };
    } catch (error) {
        console.error('Error getting business crews:', error);
        return { success: false, error: 'Failed to get business crews' };
    }
}

/**
 * Update crew - Offline-First
 */
export async function updateCrew(
    businessId: string,
    crewId: string,
    updates: Partial<CrewUpdate>
): Promise<{ success: boolean; data?: Crew; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get existing crew to validate
        const existingCrew = await db.crews.get(crewId);
        if (!existingCrew || existingCrew.business_id !== businessId) {
            return { success: false, error: 'Crew not found or access denied' };
        }

        // Prepare updated data
        const now = new Date().toISOString();
        const updatedCrew: Crew = {
            ...existingCrew,
            ...updates,
            updated_at: now,
            updated_by: userId
        };

        // Update locally first (offline-first approach)
        await db.crews.put(updatedCrew);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `crews_update_${crewId}_${Date.now()}`,
            table: 'crews',
            operation: 'update',
            data: updatedCrew,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: updatedCrew };
    } catch (error) {
        console.error('Error updating crew:', error);
        return { success: false, error: 'Failed to update crew' };
    }
}

/**
 * Delete crew - Offline-First
 */
export async function deleteCrew(
    businessId: string,
    crewId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get existing crew to validate
        const existingCrew = await db.crews.get(crewId);
        if (!existingCrew || existingCrew.business_id !== businessId) {
            return { success: false, error: 'Crew not found or access denied' };
        }

        // Delete locally first (offline-first approach)
        await db.crews.delete(crewId);

        // Also delete related entities (crew member assignments, project crews)
        await db.crewMemberAssignments.where('crew_id').equals(crewId).delete();
        await db.projectCrews.where('crew_id').equals(crewId).delete();

        // Queue for sync to server
        await db.syncQueue.add({
            id: `crews_delete_${crewId}_${Date.now()}`,
            table: 'crews',
            operation: 'delete',
            data: { id: crewId },
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting crew:', error);
        return { success: false, error: 'Failed to delete crew' };
    }
}

/**
 * Get crews with detailed information including member counts and current projects
 */
export async function getCrewsWithDetails(
    businessId: string,
    filters?: {
        status?: string;
        specialty?: string;
        hasActiveProject?: boolean;
        limit?: number;
    }
): Promise<{ success: boolean; data?: CrewWithDetails[]; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get crews from local database
        let crewsQuery = db.crews.where('business_id').equals(businessId);

        if (filters?.status || filters?.specialty) {
            crewsQuery = crewsQuery.and(crew => {
                if (filters.status && crew.status !== filters.status) return false;
                if (filters.specialty && crew.specialty !== filters.specialty) return false;
                return true;
            });
        }

        if (filters?.limit) {
            crewsQuery = crewsQuery.limit(filters.limit);
        }

        const crews = await crewsQuery.sortBy('name');

        // Get crew member assignments to count members
        const assignments = await db.crewMemberAssignments
            .where('business_id')
            .equals(businessId)
            .toArray();

        // Get project crews to find current projects
        const projectCrews = await db.projectCrews
            .where('business_id')
            .equals(businessId)
            .and(pc => !pc.end_date || new Date(pc.end_date) >= new Date()) // Active projects
            .toArray();

        // Get projects for additional context
        const projects = await db.projects
            .where('business_id')
            .equals(businessId)
            .toArray();

        const projectMap = new Map(projects.map(p => [p.id, p]));

        // Build crew details
        const crewsWithDetails: CrewWithDetails[] = crews.map(crew => {
            const memberAssignments = assignments.filter(a => a.crew_id === crew.id);
            const currentProjectCrews = projectCrews.filter(pc => pc.crew_id === crew.id);

            // Find current project (most recent active assignment)
            const currentProjectCrew = currentProjectCrews
                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];

            const currentProject = currentProjectCrew ? projectMap.get(currentProjectCrew.project_id) : null;

            return {
                ...crew,
                leader: crew.leader_id || 'No Leader Assigned',
                member_count: memberAssignments.length,
                current_project: currentProject?.name || null,
                current_project_id: currentProject?.id || null,
                active_projects: currentProjectCrews.length,
                total_hours: 0 // TODO: Calculate from daily logs when available
            };
        });

        // Apply hasActiveProject filter if specified
        let filteredCrews = crewsWithDetails;
        if (filters?.hasActiveProject !== undefined) {
            filteredCrews = crewsWithDetails.filter(crew =>
                filters.hasActiveProject ? crew.active_projects > 0 : crew.active_projects === 0
            );
        }

        return { success: true, data: filteredCrews };
    } catch (error) {
        console.error('Error getting crews with details:', error);
        return { success: false, error: 'Failed to get crews with details' };
    }
}

/**
 * Search crews - Cache-First
 */
export async function searchCrews(
    businessId: string,
    searchCriteria: {
        query?: string;
        status?: string;
        specialty?: string;
        leaderId?: string;
        limit?: number;
    }
): Promise<{ success: boolean; data?: Crew[]; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get from local database with search
        let query = db.crews.where('business_id').equals(businessId);

        const searchTerm = searchCriteria.query?.toLowerCase();

        // Apply filters and search
        query = query.and(crew => {
            // Status filter
            if (searchCriteria.status && crew.status !== searchCriteria.status) return false;

            // Specialty filter
            if (searchCriteria.specialty && crew.specialty !== searchCriteria.specialty) return false;

            // Leader filter
            if (searchCriteria.leaderId && crew.leader_id !== searchCriteria.leaderId) return false;

            // Text search in name, specialty, and notes
            if (searchTerm) {
                const searchableText = [
                    crew.name,
                    crew.specialty,
                    crew.notes
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) return false;
            }

            return true;
        });

        // Apply limit
        if (searchCriteria.limit) {
            query = query.limit(searchCriteria.limit);
        }

        // Order by name
        const crews = await query.sortBy('name');

        return { success: true, data: crews };
    } catch (error) {
        console.error('Error searching crews:', error);
        return { success: false, error: 'Failed to search crews' };
    }
}

/**
 * Get crews by status - Cache-First
 */
export async function getCrewsByStatus(
    businessId: string,
    status: string
): Promise<{ success: boolean; data?: Crew[]; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get from local database with status filter
        const crews = await db.crews
            .where('business_id')
            .equals(businessId)
            .and(crew => crew.status === status)
            .sortBy('name');

        return { success: true, data: crews };
    } catch (error) {
        console.error('Error getting crews by status:', error);
        return { success: false, error: 'Failed to get crews by status' };
    }
}

/**
 * Update crew status - Offline-First
 */
export async function updateCrewStatus(
    businessId: string,
    crewId: string,
    status: string
): Promise<{ success: boolean; data?: Crew; error?: string }> {
    try {
        return await updateCrew(businessId, crewId, { status });
    } catch (error) {
        console.error('Error updating crew status:', error);
        return { success: false, error: 'Failed to update crew status' };
    }
}

/**
 * Get crew statistics summary - Cache-First
 */
export async function getCrewStatistics(
    businessId: string
): Promise<{
    success: boolean; data?: {
        total_crews: number;
        active_crews: number;
        inactive_crews: number;
        crews_with_projects: number;
        total_members: number;
        crews_by_specialty: { [specialty: string]: number };
    }; error?: string
}> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get all crews
        const crews = await db.crews.where('business_id').equals(businessId).toArray();

        // Get all crew member assignments
        const assignments = await db.crewMemberAssignments
            .where('business_id')
            .equals(businessId)
            .toArray();

        // Get active project crews
        const projectCrews = await db.projectCrews
            .where('business_id')
            .equals(businessId)
            .and(pc => !pc.end_date || new Date(pc.end_date) >= new Date())
            .toArray();

        // Calculate statistics
        const totalCrews = crews.length;
        const activeCrews = crews.filter(c => c.status === 'active').length;
        const inactiveCrews = crews.filter(c => c.status === 'inactive').length;

        const crewsWithProjects = new Set(projectCrews.map(pc => pc.crew_id)).size;
        const totalMembers = assignments.length;

        // Group by specialty
        const crewsBySpecialty: { [specialty: string]: number } = {};
        crews.forEach(crew => {
            const specialty = crew.specialty || 'Unspecified';
            crewsBySpecialty[specialty] = (crewsBySpecialty[specialty] || 0) + 1;
        });

        const result = {
            total_crews: totalCrews,
            active_crews: activeCrews,
            inactive_crews: inactiveCrews,
            crews_with_projects: crewsWithProjects,
            total_members: totalMembers,
            crews_by_specialty: crewsBySpecialty
        };

        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting crew statistics:', error);
        return { success: false, error: 'Failed to get crew statistics' };
    }
}
