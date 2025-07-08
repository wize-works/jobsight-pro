"use client";

/**
 * Equipment Specifications Client Actions - Offline-First Implementation (Phase 4.6 - Equipment Extensions)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { EquipmentSpecification, EquipmentSpecificationInsert, EquipmentSpecificationUpdate } from "@/types/equipment-specifications";
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
 * Get all equipment specifications for a business - Offline-first implementation
 * @param businessId - The business ID to get equipment specifications for
 */
export async function getEquipmentSpecifications(businessId: string): Promise<EquipmentSpecification[]> {
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
        const cachedSpecs = await db.equipmentSpecifications
            .where('business_id')
            .equals(businessId)
            .sortBy('created_at');

        if (cachedSpecs.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`equipmentSpecifications_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedSpecs;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-specifications/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverSpecs = await response.json();

                    if (serverSpecs && Array.isArray(serverSpecs)) {
                        // Update local cache
                        await db.equipmentSpecifications.bulkPut(serverSpecs);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `equipmentSpecifications_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'equipmentSpecifications'
                        });

                        return serverSpecs.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment specifications from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedSpecs;

    } catch (error) {
        console.error('Error getting equipment specifications:', error);
        return [];
    }
}

/**
 * Get equipment specification by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param specId - The equipment specification ID to get
 */
export async function getEquipmentSpecificationById(businessId: string, specId: string): Promise<EquipmentSpecification | null> {
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
        const cachedSpec = await db.equipmentSpecifications.get(specId);

        if (cachedSpec && cachedSpec.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`equipmentSpecifications_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedSpec;
                }
            } else {
                // If offline, return cached data
                return cachedSpec;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-specifications/${specId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverSpec = await response.json();

                    if (serverSpec) {
                        // Update local cache
                        await db.equipmentSpecifications.put(serverSpec);

                        return serverSpec;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment specification from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedSpec || null;

    } catch (error) {
        console.error('Error getting equipment specification by ID:', error);
        return null;
    }
}

/**
 * Create equipment specification - Offline-first implementation with authorization
 * @param businessId - The business ID to create equipment specification for
 * @param specData - The equipment specification data to create
 */
export async function createEquipmentSpecification(
    businessId: string,
    specData: EquipmentSpecificationInsert
): Promise<{ success: boolean; data?: EquipmentSpecification; error?: string }> {
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
        const equipment = await db.equipment.get(specData.equipment_id);
        if (!equipment || equipment.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid equipment or equipment does not belong to this business."
            };
        }

        const now = new Date().toISOString();
        const specId = uuidv4();

        // Create equipment specification object
        const newSpec: EquipmentSpecification = {
            id: specId,
            business_id: businessId,
            equipment_id: specData.equipment_id,
            name: specData.name,
            value: specData.value || null,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.equipmentSpecifications.put(newSpec);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentSpecifications',
            'insert',
            newSpec,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/equipment-specifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...specData,
                        businessId,
                        id: specId
                    }),
                });

                if (response.ok) {
                    const serverSpec = await response.json();

                    // Update local data with server response
                    await db.equipmentSpecifications.put(serverSpec);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentSpecifications')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentSpecifications_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentSpecifications'
                    });

                    return { success: true, data: serverSpec };
                }
            } catch (error) {
                console.warn('Failed to sync equipment specification to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newSpec };

    } catch (error) {
        console.error('Error creating equipment specification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create equipment specification"
        };
    }
}

/**
 * Update equipment specification - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param specId - The equipment specification ID to update
 * @param specData - The equipment specification data to update
 */
export async function updateEquipmentSpecification(
    businessId: string,
    specId: string,
    specData: EquipmentSpecificationUpdate
): Promise<{ success: boolean; data?: EquipmentSpecification; error?: string }> {
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

        // Get current specification
        const currentSpec = await db.equipmentSpecifications.get(specId);
        if (!currentSpec) {
            return {
                success: false,
                error: "Equipment specification not found."
            };
        }

        // Verify the specification belongs to the business
        if (currentSpec.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment specification does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<EquipmentSpecification> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from specData
        if (specData.equipment_id !== undefined) updateData.equipment_id = specData.equipment_id;
        if (specData.name !== undefined) updateData.name = specData.name;
        if (specData.value !== undefined) updateData.value = specData.value;

        // Update locally first (optimistic update)
        const updatedSpec = { ...currentSpec, ...updateData };
        await db.equipmentSpecifications.put(updatedSpec);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentSpecifications',
            'update',
            updatedSpec,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-specifications/${specId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverSpec = await response.json();

                    // Update local data with server response
                    await db.equipmentSpecifications.put(serverSpec);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentSpecifications')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentSpecifications_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentSpecifications'
                    });

                    return { success: true, data: serverSpec };
                }
            } catch (error) {
                console.warn('Failed to sync equipment specification update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedSpec };

    } catch (error) {
        console.error('Error updating equipment specification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update equipment specification"
        };
    }
}

/**
 * Delete equipment specification - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param specId - The equipment specification ID to delete
 */
export async function deleteEquipmentSpecification(
    businessId: string,
    specId: string
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

        // Get current specification to verify it exists and belongs to business
        const currentSpec = await db.equipmentSpecifications.get(specId);
        if (!currentSpec) {
            return {
                success: false,
                error: "Equipment specification not found."
            };
        }

        // Verify the specification belongs to the business
        if (currentSpec.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment specification does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.equipmentSpecifications.delete(specId);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentSpecifications',
            'delete',
            { id: specId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-specifications/${specId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentSpecifications')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === specId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentSpecifications_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentSpecifications'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync equipment specification deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting equipment specification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete equipment specification"
        };
    }
}

/**
 * Get equipment specifications by equipment ID - Offline-first implementation
 * @param businessId - The business ID
 * @param equipmentId - The equipment ID to get specifications for
 */
export async function getEquipmentSpecificationsByEquipmentId(businessId: string, equipmentId: string): Promise<EquipmentSpecification[]> {
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

        // Get specifications from cache
        const specs = await db.equipmentSpecifications
            .where('equipment_id')
            .equals(equipmentId)
            .and(spec => spec.business_id === businessId)
            .toArray();

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-specifications/equipment/${equipmentId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverSpecs = await response.json();

                    if (serverSpecs && Array.isArray(serverSpecs)) {
                        // Update local cache
                        await db.equipmentSpecifications.bulkPut(serverSpecs);

                        return serverSpecs;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment specifications by equipment from server, using cache:', error);
            }
        }

        return specs.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error getting equipment specifications by equipment ID:', error);
        return [];
    }
}

/**
 * Search equipment specifications - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchEquipmentSpecifications(businessId: string, searchQuery: string): Promise<EquipmentSpecification[]> {
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

        // Get all specifications from cache first
        const allSpecs = await db.equipmentSpecifications
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allSpecs.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allSpecs.filter(spec =>
                spec.name.toLowerCase().includes(query) ||
                (spec.value && spec.value.toLowerCase().includes(query))
            ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/equipment-specifications/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverSpecs = await response.json();

                if (serverSpecs && Array.isArray(serverSpecs)) {
                    // Update local cache
                    await db.equipmentSpecifications.bulkPut(serverSpecs);

                    return serverSpecs;
                }
            }
        } catch (error) {
            console.warn('Failed to search equipment specifications on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allSpecs.filter(spec =>
            spec.name.toLowerCase().includes(query) ||
            (spec.value && spec.value.toLowerCase().includes(query))
        ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error searching equipment specifications:', error);
        return [];
    }
}

/**
 * Bulk create equipment specifications - Offline-first implementation
 * @param businessId - The business ID
 * @param specsData - Array of equipment specification data to create
 */
export async function bulkCreateEquipmentSpecifications(
    businessId: string,
    specsData: EquipmentSpecificationInsert[]
): Promise<{ success: boolean; data?: EquipmentSpecification[]; error?: string }> {
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
        const specs: EquipmentSpecification[] = specsData.map(data => ({
            id: uuidv4(),
            business_id: businessId,
            equipment_id: data.equipment_id,
            name: data.name,
            value: data.value || null,
            created_at: now,
            updated_at: now,
            created_by: currentUserAuthId,
            updated_by: currentUserAuthId,
        }));

        // Store in local database immediately (optimistic update)
        await db.equipmentSpecifications.bulkPut(specs);

        // Queue for sync with server
        for (const spec of specs) {
            await addToSyncQueue(
                'equipmentSpecifications',
                'insert',
                spec,
                businessId,
                currentUserAuthId
            );
        }

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/equipment-specifications/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId,
                        specifications: specsData.map((data, index) => ({
                            ...data,
                            id: specs[index].id
                        }))
                    }),
                });

                if (response.ok) {
                    const serverSpecs = await response.json();

                    if (serverSpecs && Array.isArray(serverSpecs)) {
                        // Update local data with server response
                        await db.equipmentSpecifications.bulkPut(serverSpecs);

                        // Mark as synced
                        await db.syncQueue
                            .where('table')
                            .equals('equipmentSpecifications')
                            .and(item =>
                                item.businessId === businessId &&
                                item.operation === 'insert'
                            )
                            .modify({ synced: true });

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `equipmentSpecifications_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'equipmentSpecifications'
                        });

                        return { success: true, data: serverSpecs };
                    }
                }
            } catch (error) {
                console.warn('Failed to sync bulk equipment specifications to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: specs };

    } catch (error) {
        console.error('Error bulk creating equipment specifications:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create equipment specifications"
        };
    }
}

/**
 * Get sync status for equipment specifications
 * @param businessId - The business ID
 */
export async function getEquipmentSpecificationsSyncStatus(businessId: string): Promise<{
    lastSync: number | null;
    pendingChanges: number;
    hasUnsyncedData: boolean;
}> {
    try {
        // Get sync metadata
        const metadata = await db.syncMetadata.get(`equipmentSpecifications_${businessId}`);

        // Count pending sync items
        const pendingChanges = await db.syncQueue
            .where('table')
            .equals('equipmentSpecifications')
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        return {
            lastSync: metadata?.lastSync || null,
            pendingChanges,
            hasUnsyncedData: pendingChanges > 0
        };
    } catch (error) {
        console.error('Error getting equipment specifications sync status:', error);
        return {
            lastSync: null,
            pendingChanges: 0,
            hasUnsyncedData: false
        };
    }
}
