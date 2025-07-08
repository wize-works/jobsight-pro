"use client";

/**
 * Equipment Usage Client Actions - Offline-First Implementation (Phase 4.6 - Equipment Extensions)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { EquipmentUsage, EquipmentUsageInsert, EquipmentUsageUpdate, EquipmentUsageWithDetails } from "@/types/equipment_usage";
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
 * Get all equipment usage records for a business - Offline-first implementation
 * @param businessId - The business ID to get equipment usage for
 */
export async function getEquipmentUsage(businessId: string): Promise<EquipmentUsage[]> {
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
        const cachedUsage = await db.equipmentUsage
            .where('business_id')
            .equals(businessId)
            .sortBy('created_at');

        if (cachedUsage.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`equipmentUsage_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedUsage;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-usage/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverUsage = await response.json();

                    if (serverUsage && Array.isArray(serverUsage)) {
                        // Update local cache
                        await db.equipmentUsage.bulkPut(serverUsage);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `equipmentUsage_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'equipmentUsage'
                        });

                        return serverUsage.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment usage from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedUsage;

    } catch (error) {
        console.error('Error getting equipment usage:', error);
        return [];
    }
}

/**
 * Get equipment usage by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param usageId - The equipment usage ID to get
 */
export async function getEquipmentUsageById(businessId: string, usageId: string): Promise<EquipmentUsage | null> {
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
        const cachedUsage = await db.equipmentUsage.get(usageId);

        if (cachedUsage && cachedUsage.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`equipmentUsage_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedUsage;
                }
            } else {
                // If offline, return cached data
                return cachedUsage;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-usage/${usageId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverUsage = await response.json();

                    if (serverUsage) {
                        // Update local cache
                        await db.equipmentUsage.put(serverUsage);

                        return serverUsage;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment usage from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedUsage || null;

    } catch (error) {
        console.error('Error getting equipment usage by ID:', error);
        return null;
    }
}

/**
 * Create equipment usage - Offline-first implementation with authorization
 * @param businessId - The business ID to create equipment usage for
 * @param usageData - The equipment usage data to create
 */
export async function createEquipmentUsage(
    businessId: string,
    usageData: EquipmentUsageInsert
): Promise<{ success: boolean; data?: EquipmentUsage; error?: string }> {
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
        const equipment = await db.equipment.get(usageData.equipment_id);
        if (!equipment || equipment.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid equipment or equipment does not belong to this business."
            };
        }

        // Validate project if provided
        if (usageData.project_id) {
            const project = await db.projects.get(usageData.project_id);
            if (!project || project.business_id !== businessId) {
                return {
                    success: false,
                    error: "Invalid project or project does not belong to this business."
                };
            }
        }

        // Validate crew if provided
        if (usageData.crew_id) {
            const crew = await db.crews.get(usageData.crew_id);
            if (!crew || crew.business_id !== businessId) {
                return {
                    success: false,
                    error: "Invalid crew or crew does not belong to this business."
                };
            }
        }

        const now = new Date().toISOString();
        const usageId = uuidv4();

        // Create equipment usage object
        const newUsage: EquipmentUsage = {
            id: usageId,
            business_id: businessId,
            equipment_id: usageData.equipment_id,
            project_id: usageData.project_id || null,
            crew_id: usageData.crew_id || null,
            start_date: usageData.start_date || null,
            end_date: usageData.end_date || null,
            hours_used: usageData.hours_used || 0.0,
            fuel_consumed: usageData.fuel_consumed || 0.0,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.equipmentUsage.put(newUsage);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentUsage',
            'insert',
            newUsage,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/equipment-usage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...usageData,
                        businessId,
                        id: usageId
                    }),
                });

                if (response.ok) {
                    const serverUsage = await response.json();

                    // Update local data with server response
                    await db.equipmentUsage.put(serverUsage);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentUsage')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentUsage_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentUsage'
                    });

                    return { success: true, data: serverUsage };
                }
            } catch (error) {
                console.warn('Failed to sync equipment usage to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newUsage };

    } catch (error) {
        console.error('Error creating equipment usage:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create equipment usage"
        };
    }
}

/**
 * Update equipment usage - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param usageId - The equipment usage ID to update
 * @param usageData - The equipment usage data to update
 */
export async function updateEquipmentUsage(
    businessId: string,
    usageId: string,
    usageData: EquipmentUsageUpdate
): Promise<{ success: boolean; data?: EquipmentUsage; error?: string }> {
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

        // Get current usage record
        const currentUsage = await db.equipmentUsage.get(usageId);
        if (!currentUsage) {
            return {
                success: false,
                error: "Equipment usage record not found."
            };
        }

        // Verify the usage belongs to the business
        if (currentUsage.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment usage record does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<EquipmentUsage> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from usageData
        if (usageData.equipment_id !== undefined) updateData.equipment_id = usageData.equipment_id;
        if (usageData.project_id !== undefined) updateData.project_id = usageData.project_id;
        if (usageData.crew_id !== undefined) updateData.crew_id = usageData.crew_id;
        if (usageData.start_date !== undefined) updateData.start_date = usageData.start_date;
        if (usageData.end_date !== undefined) updateData.end_date = usageData.end_date;
        if (usageData.hours_used !== undefined) updateData.hours_used = usageData.hours_used;
        if (usageData.fuel_consumed !== undefined) updateData.fuel_consumed = usageData.fuel_consumed;

        // Update locally first (optimistic update)
        const updatedUsage = { ...currentUsage, ...updateData };
        await db.equipmentUsage.put(updatedUsage);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentUsage',
            'update',
            updatedUsage,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-usage/${usageId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverUsage = await response.json();

                    // Update local data with server response
                    await db.equipmentUsage.put(serverUsage);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentUsage')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentUsage_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentUsage'
                    });

                    return { success: true, data: serverUsage };
                }
            } catch (error) {
                console.warn('Failed to sync equipment usage update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedUsage };

    } catch (error) {
        console.error('Error updating equipment usage:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update equipment usage"
        };
    }
}

/**
 * Delete equipment usage - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param usageId - The equipment usage ID to delete
 */
export async function deleteEquipmentUsage(
    businessId: string,
    usageId: string
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

        // Get current usage to verify it exists and belongs to business
        const currentUsage = await db.equipmentUsage.get(usageId);
        if (!currentUsage) {
            return {
                success: false,
                error: "Equipment usage record not found."
            };
        }

        // Verify the usage belongs to the business
        if (currentUsage.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment usage record does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.equipmentUsage.delete(usageId);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentUsage',
            'delete',
            { id: usageId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-usage/${usageId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentUsage')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === usageId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentUsage_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentUsage'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync equipment usage deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting equipment usage:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete equipment usage"
        };
    }
}

/**
 * Get equipment usage by equipment ID - Offline-first implementation
 * @param businessId - The business ID
 * @param equipmentId - The equipment ID to get usage records for
 */
export async function getEquipmentUsageByEquipmentId(businessId: string, equipmentId: string): Promise<EquipmentUsageWithDetails[]> {
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

        // Get usage records from cache
        const usage = await db.equipmentUsage
            .where('equipment_id')
            .equals(equipmentId)
            .and(usage => usage.business_id === businessId)
            .toArray();

        // Get additional details for EquipmentUsageWithDetails
        const usageWithDetails: EquipmentUsageWithDetails[] = [];
        for (const record of usage) {
            // Get project and crew info
            let projectName = undefined;
            let crewName = undefined;

            if (record.project_id) {
                const project = await db.projects.get(record.project_id);
                projectName = project?.name;
            }

            if (record.crew_id) {
                const crew = await db.crews.get(record.crew_id);
                crewName = crew?.name;
            }

            usageWithDetails.push({
                ...record,
                project_name: projectName,
                crew_name: crewName
            });
        }

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-usage/equipment/${equipmentId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverUsage = await response.json();

                    if (serverUsage && Array.isArray(serverUsage)) {
                        // Extract base usage data and update local cache
                        const baseUsage = serverUsage.map(usageWithDetails => {
                            const { project_name, crew_name, ...baseUsage } = usageWithDetails;
                            return baseUsage;
                        });

                        // Update local cache
                        await db.equipmentUsage.bulkPut(baseUsage);

                        return serverUsage;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment usage by equipment from server, using cache:', error);
            }
        }

        return usageWithDetails.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error getting equipment usage by equipment ID:', error);
        return [];
    }
}

/**
 * Search equipment usage - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchEquipmentUsage(businessId: string, searchQuery: string): Promise<EquipmentUsage[]> {
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

        // Get all usage records from cache first
        const allUsage = await db.equipmentUsage
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, return all or filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allUsage.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
            }

            // Simple local search on dates and numeric values
            const query = searchQuery.toLowerCase();
            return allUsage.filter(usage =>
                (usage.start_date && usage.start_date.includes(query)) ||
                (usage.end_date && usage.end_date.includes(query)) ||
                (usage.hours_used && usage.hours_used.toString().includes(query)) ||
                (usage.fuel_consumed && usage.fuel_consumed.toString().includes(query))
            ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/equipment-usage/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverUsage = await response.json();

                if (serverUsage && Array.isArray(serverUsage)) {
                    // Update local cache
                    await db.equipmentUsage.bulkPut(serverUsage);

                    return serverUsage;
                }
            }
        } catch (error) {
            console.warn('Failed to search equipment usage on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allUsage.filter(usage =>
            (usage.start_date && usage.start_date.includes(query)) ||
            (usage.end_date && usage.end_date.includes(query)) ||
            (usage.hours_used && usage.hours_used.toString().includes(query)) ||
            (usage.fuel_consumed && usage.fuel_consumed.toString().includes(query))
        ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error searching equipment usage:', error);
        return [];
    }
}

/**
 * Get sync status for equipment usage
 * @param businessId - The business ID
 */
export async function getEquipmentUsageSyncStatus(businessId: string): Promise<{
    lastSync: number | null;
    pendingChanges: number;
    hasUnsyncedData: boolean;
}> {
    try {
        // Get sync metadata
        const metadata = await db.syncMetadata.get(`equipmentUsage_${businessId}`);

        // Count pending sync items
        const pendingChanges = await db.syncQueue
            .where('table')
            .equals('equipmentUsage')
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        return {
            lastSync: metadata?.lastSync || null,
            pendingChanges,
            hasUnsyncedData: pendingChanges > 0
        };
    } catch (error) {
        console.error('Error getting equipment usage sync status:', error);
        return {
            lastSync: null,
            pendingChanges: 0,
            hasUnsyncedData: false
        };
    }
}
