"use client";

/**
 * Project Milestones Client Actions - Offline-First Implementation (Phase 4.5)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { db } from "@/lib/offline/dexie-db";
import { createServerClient } from "@/lib/supabase";
import type {
    ProjectMilestone,
    ProjectMilestoneInsert,
    ProjectMilestoneUpdate
} from "@/types/project_milestones";

/**
 * Project Milestones - Offline-First Client Actions
 * 
 * This module provides offline-first CRUD operations for project milestones.
 * All operations work offline and sync with Supabase when online.
 * 
 * Features:
 * - Full offline CRUD operations
 * - Automatic sync with server when online
 * - User-scoped access control via business_id
 * - Type-safe operations
 * - Error handling and validation
 */

// ============================================================================
// READ OPERATIONS
// ============================================================================

export async function getProjectMilestones(
    userId: string,
    businessId: string,
    filters?: {
        projectId?: string;
        status?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }
): Promise<{
    data: ProjectMilestone[];
    error: string | null;
    total: number;
}> {
    try {
        let query = db.projectMilestones
            .where('business_id')
            .equals(businessId);

        // Apply filters
        if (filters?.projectId) {
            query = query.and((milestone: ProjectMilestone) => milestone.project_id === filters.projectId);
        }

        if (filters?.status) {
            query = query.and((milestone: ProjectMilestone) => milestone.status === filters.status);
        }

        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            query = query.and((milestone: ProjectMilestone) => {
                const name = milestone.name?.toLowerCase() || '';
                const description = milestone.description?.toLowerCase() || '';

                return name.includes(searchLower) || description.includes(searchLower);
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

        const milestones = await query
            .reverse()
            .sortBy('created_at');

        return {
            data: milestones,
            error: null,
            total
        };
    } catch (error) {
        console.error("Error getting project milestones:", error);
        return {
            data: [],
            error: error instanceof Error ? error.message : "Failed to get project milestones",
            total: 0
        };
    }
}

export async function getProjectMilestone(
    userId: string,
    businessId: string,
    id: string
): Promise<{
    data: ProjectMilestone | null;
    error: string | null;
}> {
    try {
        const milestone = await db.projectMilestones
            .where('id')
            .equals(id)
            .and((milestone: ProjectMilestone) => milestone.business_id === businessId)
            .first();

        if (!milestone) {
            return { data: null, error: "Project milestone not found" };
        }

        return { data: milestone, error: null };
    } catch (error) {
        console.error("Error getting project milestone:", error);
        return {
            data: null,
            error: error instanceof Error ? error.message : "Failed to get project milestone"
        };
    }
}

export async function getProjectMilestonesByProject(
    userId: string,
    businessId: string,
    projectId: string
): Promise<{
    data: ProjectMilestone[];
    error: string | null;
}> {
    try {
        const milestones = await db.projectMilestones
            .where('project_id')
            .equals(projectId)
            .and((milestone: ProjectMilestone) => milestone.business_id === businessId)
            .reverse()
            .sortBy('due_date');

        return { data: milestones, error: null };
    } catch (error) {
        console.error("Error getting project milestones by project:", error);
        return {
            data: [],
            error: error instanceof Error ? error.message : "Failed to get project milestones"
        };
    }
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

export async function createProjectMilestone(
    userId: string,
    businessId: string,
    data: Omit<ProjectMilestoneInsert, 'id' | 'business_id' | 'created_at' | 'updated_at'>
): Promise<{
    data: ProjectMilestone | null;
    error: string | null;
}> {
    try {
        // Validate required fields
        if (!data.project_id) {
            return { data: null, error: "Project ID is required" };
        }

        if (!data.name) {
            return { data: null, error: "Milestone name is required" };
        }

        // Validate project exists and belongs to business
        const project = await db.projects.get(data.project_id);
        if (!project || project.business_id !== businessId) {
            return { data: null, error: "Invalid project or project does not belong to this business" };
        }

        const now = new Date().toISOString();
        const milestone: ProjectMilestone = {
            id: crypto.randomUUID(),
            business_id: businessId,
            project_id: data.project_id,
            name: data.name,
            description: data.description || null,
            due_date: data.due_date || null,
            status: data.status || null,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
        };

        // Store in IndexedDB
        await db.projectMilestones.add(milestone);

        // Attempt to sync with server if online
        try {
            const supabase = createServerClient();
            if (supabase) {
                const { error: serverError } = await supabase
                    .from('project_milestones')
                    .insert(milestone);

                if (serverError) {
                    console.warn("Failed to sync project milestone to server:", serverError);
                    // Mark for sync later
                    await db.syncQueue.add({
                        id: crypto.randomUUID(),
                        table: 'project_milestones',
                        operation: 'insert',
                        data: milestone,
                        businessId: businessId,
                        userId: userId,
                        timestamp: Date.now(),
                        retryCount: 0,
                        synced: false
                    });
                }
            }
        } catch (syncError) {
            console.warn("Offline mode - will sync project milestone later:", syncError);
            // Mark for sync when online
            await db.syncQueue.add({
                id: crypto.randomUUID(),
                table: 'project_milestones',
                operation: 'insert',
                data: milestone,
                businessId: businessId,
                userId: userId,
                timestamp: Date.now(),
                retryCount: 0,
                synced: false
            });
        }

        return { data: milestone, error: null };
    } catch (error) {
        console.error("Error creating project milestone:", error);
        return {
            data: null,
            error: error instanceof Error ? error.message : "Failed to create project milestone"
        };
    }
}

export async function updateProjectMilestone(
    userId: string,
    businessId: string,
    id: string,
    updates: Partial<ProjectMilestoneUpdate>
): Promise<{
    data: ProjectMilestone | null;
    error: string | null;
}> {
    try {
        // Get existing milestone
        const existing = await db.projectMilestones
            .where('id')
            .equals(id)
            .and((milestone: ProjectMilestone) => milestone.business_id === businessId)
            .first();

        if (!existing) {
            return { data: null, error: "Project milestone not found" };
        }

        const now = new Date().toISOString();
        const updatedMilestone = {
            ...existing,
            ...updates,
            updated_at: now,
            updated_by: userId,
        };

        // Update in IndexedDB
        await db.projectMilestones.put(updatedMilestone);

        // Attempt to sync with server if online
        try {
            const supabase = createServerClient();
            if (supabase) {
                const { error: serverError } = await supabase
                    .from('project_milestones')
                    .update({ ...updates, updated_at: now, updated_by: userId })
                    .eq('id', id)
                    .eq('business_id', businessId);

                if (serverError) {
                    console.warn("Failed to sync project milestone update to server:", serverError);
                    // Mark for sync later
                    await db.syncQueue.add({
                        id: crypto.randomUUID(),
                        table: 'project_milestones',
                        operation: 'update',
                        data: { id, updates: { ...updates, updated_at: now, updated_by: userId } },
                        businessId: businessId,
                        userId: userId,
                        timestamp: Date.now(),
                        retryCount: 0,
                        synced: false
                    });
                }
            }
        } catch (syncError) {
            console.warn("Offline mode - will sync project milestone update later:", syncError);
            // Mark for sync when online
            await db.syncQueue.add({
                id: crypto.randomUUID(),
                table: 'project_milestones',
                operation: 'update',
                data: { id, updates: { ...updates, updated_at: now, updated_by: userId } },
                businessId: businessId,
                userId: userId,
                timestamp: Date.now(),
                retryCount: 0,
                synced: false
            });
        }

        return { data: updatedMilestone, error: null };
    } catch (error) {
        console.error("Error updating project milestone:", error);
        return {
            data: null,
            error: error instanceof Error ? error.message : "Failed to update project milestone"
        };
    }
}

export async function deleteProjectMilestone(
    userId: string,
    businessId: string,
    id: string
): Promise<{
    success: boolean;
    error: string | null;
}> {
    try {
        // Check if milestone exists and belongs to business
        const existing = await db.projectMilestones
            .where('id')
            .equals(id)
            .and((milestone: ProjectMilestone) => milestone.business_id === businessId)
            .first();

        if (!existing) {
            return { success: false, error: "Project milestone not found" };
        }

        // Delete from IndexedDB
        await db.projectMilestones.delete(id);

        // Attempt to sync with server if online
        try {
            const supabase = createServerClient();
            if (supabase) {
                const { error: serverError } = await supabase
                    .from('project_milestones')
                    .delete()
                    .eq('id', id)
                    .eq('business_id', businessId);

                if (serverError) {
                    console.warn("Failed to sync project milestone deletion to server:", serverError);
                    // Mark for sync later
                    await db.syncQueue.add({
                        id: crypto.randomUUID(),
                        table: 'project_milestones',
                        operation: 'delete',
                        data: { id },
                        businessId: businessId,
                        userId: userId,
                        timestamp: Date.now(),
                        retryCount: 0,
                        synced: false
                    });
                }
            }
        } catch (syncError) {
            console.warn("Offline mode - will sync project milestone deletion later:", syncError);
            // Mark for sync when online
            await db.syncQueue.add({
                id: crypto.randomUUID(),
                table: 'project_milestones',
                operation: 'delete',
                data: { id },
                businessId: businessId,
                userId: userId,
                timestamp: Date.now(),
                retryCount: 0,
                synced: false
            });
        }

        return { success: true, error: null };
    } catch (error) {
        console.error("Error deleting project milestone:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete project milestone"
        };
    }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function createProjectMilestonesBulk(
    userId: string,
    businessId: string,
    milestonesData: Omit<ProjectMilestoneInsert, 'id' | 'business_id' | 'created_at' | 'updated_at'>[]
): Promise<{
    data: ProjectMilestone[];
    error: string | null;
}> {
    try {
        const now = new Date().toISOString();
        const milestones: ProjectMilestone[] = milestonesData.map(data => ({
            id: crypto.randomUUID(),
            business_id: businessId,
            project_id: data.project_id,
            name: data.name,
            description: data.description || null,
            due_date: data.due_date || null,
            status: data.status || null,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
        }));

        // Store in IndexedDB
        await db.projectMilestones.bulkAdd(milestones);

        // Attempt to sync with server if online
        try {
            const supabase = createServerClient();
            if (supabase) {
                const { error: serverError } = await supabase
                    .from('project_milestones')
                    .insert(milestones);

                if (serverError) {
                    console.warn("Failed to sync project milestones to server:", serverError);
                    // Mark for sync later
                    for (const milestone of milestones) {
                        await db.syncQueue.add({
                            id: crypto.randomUUID(),
                            table: 'project_milestones',
                            operation: 'insert',
                            data: milestone,
                            businessId: businessId,
                            userId: userId,
                            timestamp: Date.now(),
                            retryCount: 0,
                            synced: false
                        });
                    }
                }
            }
        } catch (syncError) {
            console.warn("Offline mode - will sync project milestones later:", syncError);
            // Mark for sync when online
            for (const milestone of milestones) {
                await db.syncQueue.add({
                    id: crypto.randomUUID(),
                    table: 'project_milestones',
                    operation: 'insert',
                    data: milestone,
                    businessId: businessId,
                    userId: userId,
                    timestamp: Date.now(),
                    retryCount: 0,
                    synced: false
                });
            }
        }

        return { data: milestones, error: null };
    } catch (error) {
        console.error("Error creating project milestones bulk:", error);
        return {
            data: [],
            error: error instanceof Error ? error.message : "Failed to create project milestones"
        };
    }
}

// ============================================================================
// SEARCH OPERATIONS
// ============================================================================

export async function searchProjectMilestones(
    userId: string,
    businessId: string,
    query: string,
    filters?: {
        projectId?: string;
        status?: string;
        limit?: number;
    }
): Promise<{
    data: ProjectMilestone[];
    error: string | null;
}> {
    try {
        if (!query.trim()) {
            return { data: [], error: null };
        }

        const searchLower = query.toLowerCase();
        let dbQuery = db.projectMilestones
            .where('business_id')
            .equals(businessId)
            .and((milestone: ProjectMilestone) => {
                const name = milestone.name?.toLowerCase() || '';
                const description = milestone.description?.toLowerCase() || '';

                return name.includes(searchLower) || description.includes(searchLower);
            });

        // Apply filters
        if (filters?.projectId) {
            dbQuery = dbQuery.and((milestone: ProjectMilestone) => milestone.project_id === filters.projectId);
        }

        if (filters?.status) {
            dbQuery = dbQuery.and((milestone: ProjectMilestone) => milestone.status === filters.status);
        }

        let results = await dbQuery.toArray();

        // Apply limit
        if (filters?.limit) {
            results = results.slice(0, filters.limit);
        }

        // Sort by relevance (exact matches first, then partial matches)
        results.sort((a, b) => {
            const aName = a.name?.toLowerCase() || '';
            const bName = b.name?.toLowerCase() || '';

            if (aName.includes(searchLower) && !bName.includes(searchLower)) return -1;
            if (!aName.includes(searchLower) && bName.includes(searchLower)) return 1;

            return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        });

        return { data: results, error: null };
    } catch (error) {
        console.error("Error searching project milestones:", error);
        return {
            data: [],
            error: error instanceof Error ? error.message : "Failed to search project milestones"
        };
    }
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

export async function syncProjectMilestones(
    userId: string,
    businessId: string
): Promise<{
    success: boolean;
    error: string | null;
    synced: number;
}> {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            return { success: false, error: "Supabase client not available", synced: 0 };
        }

        // Get all local milestones for this business
        const localMilestones = await db.projectMilestones
            .where('business_id')
            .equals(businessId)
            .toArray();

        // Get server milestones
        const { data: serverMilestones, error: fetchError } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('business_id', businessId);

        if (fetchError) {
            throw fetchError;
        }

        // Create maps for comparison
        const localMap = new Map(localMilestones.map((milestone: ProjectMilestone) => [milestone.id, milestone]));
        const serverMap = new Map((serverMilestones || []).map((milestone: ProjectMilestone) => [milestone.id, milestone]));

        let syncedCount = 0;

        // Sync server milestones to local (download)
        for (const serverMilestone of serverMilestones || []) {
            const localMilestone = localMap.get(serverMilestone.id);

            if (!localMilestone ||
                new Date(serverMilestone.updated_at || '').getTime() > new Date(localMilestone.updated_at || '').getTime()) {
                await db.projectMilestones.put(serverMilestone);
                syncedCount++;
            }
        }

        // Sync local milestones to server (upload)
        for (const localMilestone of localMilestones) {
            const serverMilestone = serverMap.get(localMilestone.id);

            if (!serverMilestone ||
                new Date(localMilestone.updated_at || '').getTime() > new Date(serverMilestone.updated_at || '').getTime()) {
                const { error: upsertError } = await supabase
                    .from('project_milestones')
                    .upsert(localMilestone);

                if (upsertError) {
                    console.warn(`Failed to sync milestone ${localMilestone.id}:`, upsertError);
                } else {
                    syncedCount++;
                }
            }
        }

        return { success: true, error: null, synced: syncedCount };
    } catch (error) {
        console.error("Error syncing project milestones:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to sync project milestones",
            synced: 0
        };
    }
}

export async function getProjectMilestonesCount(
    userId: string,
    businessId: string,
    filters?: {
        projectId?: string;
        status?: string;
    }
): Promise<{
    count: number;
    error: string | null;
}> {
    try {
        let query = db.projectMilestones
            .where('business_id')
            .equals(businessId);

        // Apply filters
        if (filters?.projectId) {
            query = query.and((milestone: ProjectMilestone) => milestone.project_id === filters.projectId);
        }

        if (filters?.status) {
            query = query.and((milestone: ProjectMilestone) => milestone.status === filters.status);
        }

        const count = await query.count();

        return { count, error: null };
    } catch (error) {
        console.error("Error getting project milestones count:", error);
        return {
            count: 0,
            error: error instanceof Error ? error.message : "Failed to get project milestones count"
        };
    }
}
