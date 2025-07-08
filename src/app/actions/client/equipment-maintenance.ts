"use client";

/**
 * Equipment Maintenance Client Actions - Offline-First Implementation (Phase 4.6 - Equipment Extensions)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { EquipmentMaintenance, EquipmentMaintenanceInsert, EquipmentMaintenanceUpdate } from "@/types/equipment-maintenance";
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
 * Get all equipment maintenance records for a business - Offline-first implementation
 * @param businessId - The business ID to get equipment maintenance for
 */
export async function getEquipmentMaintenance(businessId: string): Promise<EquipmentMaintenance[]> {
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
        const cachedMaintenance = await db.equipmentMaintenance
            .where('business_id')
            .equals(businessId)
            .sortBy('created_at');

        if (cachedMaintenance.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`equipmentMaintenance_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedMaintenance;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-maintenance/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverMaintenance = await response.json();

                    if (serverMaintenance && Array.isArray(serverMaintenance)) {
                        // Update local cache
                        await db.equipmentMaintenance.bulkPut(serverMaintenance);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `equipmentMaintenance_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'equipmentMaintenance'
                        });

                        return serverMaintenance.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment maintenance from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedMaintenance;

    } catch (error) {
        console.error('Error getting equipment maintenance:', error);
        return [];
    }
}

/**
 * Get equipment maintenance by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param maintenanceId - The equipment maintenance ID to get
 */
export async function getEquipmentMaintenanceById(businessId: string, maintenanceId: string): Promise<EquipmentMaintenance | null> {
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
        const cachedMaintenance = await db.equipmentMaintenance.get(maintenanceId);

        if (cachedMaintenance && cachedMaintenance.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`equipmentMaintenance_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedMaintenance;
                }
            } else {
                // If offline, return cached data
                return cachedMaintenance;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-maintenance/${maintenanceId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverMaintenance = await response.json();

                    if (serverMaintenance) {
                        // Update local cache
                        await db.equipmentMaintenance.put(serverMaintenance);

                        return serverMaintenance;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment maintenance from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedMaintenance || null;

    } catch (error) {
        console.error('Error getting equipment maintenance by ID:', error);
        return null;
    }
}

/**
 * Create equipment maintenance - Offline-first implementation with authorization
 * @param businessId - The business ID to create equipment maintenance for
 * @param maintenanceData - The equipment maintenance data to create
 */
export async function createEquipmentMaintenance(
    businessId: string,
    maintenanceData: EquipmentMaintenanceInsert
): Promise<{ success: boolean; data?: EquipmentMaintenance; error?: string }> {
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
        const equipment = await db.equipment.get(maintenanceData.equipment_id);
        if (!equipment || equipment.business_id !== businessId) {
            return {
                success: false,
                error: "Invalid equipment or equipment does not belong to this business."
            };
        }

        const now = new Date().toISOString();
        const maintenanceId = uuidv4();

        // Create equipment maintenance object
        const newMaintenance: EquipmentMaintenance = {
            id: maintenanceId,
            business_id: businessId,
            equipment_id: maintenanceData.equipment_id,
            maintenance_date: maintenanceData.maintenance_date || null,
            maintenance_type: maintenanceData.maintenance_type || null,
            maintenance_status: maintenanceData.maintenance_status || 'scheduled',
            description: maintenanceData.description || null,
            technician: maintenanceData.technician || null,
            cost: maintenanceData.cost || null,
            date: maintenanceData.date || null,
            notes: maintenanceData.notes || null,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.equipmentMaintenance.put(newMaintenance);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentMaintenance',
            'insert',
            newMaintenance,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/equipment-maintenance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...maintenanceData,
                        businessId,
                        id: maintenanceId
                    }),
                });

                if (response.ok) {
                    const serverMaintenance = await response.json();

                    // Update local data with server response
                    await db.equipmentMaintenance.put(serverMaintenance);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentMaintenance')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentMaintenance_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentMaintenance'
                    });

                    return { success: true, data: serverMaintenance };
                }
            } catch (error) {
                console.warn('Failed to sync equipment maintenance to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newMaintenance };

    } catch (error) {
        console.error('Error creating equipment maintenance:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create equipment maintenance"
        };
    }
}

/**
 * Update equipment maintenance - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param maintenanceId - The equipment maintenance ID to update
 * @param maintenanceData - The equipment maintenance data to update
 */
export async function updateEquipmentMaintenance(
    businessId: string,
    maintenanceId: string,
    maintenanceData: EquipmentMaintenanceUpdate
): Promise<{ success: boolean; data?: EquipmentMaintenance; error?: string }> {
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

        // Get current maintenance record
        const currentMaintenance = await db.equipmentMaintenance.get(maintenanceId);
        if (!currentMaintenance) {
            return {
                success: false,
                error: "Equipment maintenance record not found."
            };
        }

        // Verify the maintenance belongs to the business
        if (currentMaintenance.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment maintenance record does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<EquipmentMaintenance> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from maintenanceData
        if (maintenanceData.equipment_id !== undefined) updateData.equipment_id = maintenanceData.equipment_id;
        if (maintenanceData.maintenance_date !== undefined) updateData.maintenance_date = maintenanceData.maintenance_date;
        if (maintenanceData.maintenance_type !== undefined) updateData.maintenance_type = maintenanceData.maintenance_type;
        if (maintenanceData.maintenance_status !== undefined) updateData.maintenance_status = maintenanceData.maintenance_status;
        if (maintenanceData.description !== undefined) updateData.description = maintenanceData.description;
        if (maintenanceData.technician !== undefined) updateData.technician = maintenanceData.technician;
        if (maintenanceData.cost !== undefined) updateData.cost = maintenanceData.cost;
        if (maintenanceData.date !== undefined) updateData.date = maintenanceData.date;
        if (maintenanceData.notes !== undefined) updateData.notes = maintenanceData.notes;

        // Update locally first (optimistic update)
        const updatedMaintenance = { ...currentMaintenance, ...updateData };
        await db.equipmentMaintenance.put(updatedMaintenance);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentMaintenance',
            'update',
            updatedMaintenance,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-maintenance/${maintenanceId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverMaintenance = await response.json();

                    // Update local data with server response
                    await db.equipmentMaintenance.put(serverMaintenance);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentMaintenance')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentMaintenance_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentMaintenance'
                    });

                    return { success: true, data: serverMaintenance };
                }
            } catch (error) {
                console.warn('Failed to sync equipment maintenance update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedMaintenance };

    } catch (error) {
        console.error('Error updating equipment maintenance:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update equipment maintenance"
        };
    }
}

/**
 * Delete equipment maintenance - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param maintenanceId - The equipment maintenance ID to delete
 */
export async function deleteEquipmentMaintenance(
    businessId: string,
    maintenanceId: string
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

        // Get current maintenance to verify it exists and belongs to business
        const currentMaintenance = await db.equipmentMaintenance.get(maintenanceId);
        if (!currentMaintenance) {
            return {
                success: false,
                error: "Equipment maintenance record not found."
            };
        }

        // Verify the maintenance belongs to the business
        if (currentMaintenance.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment maintenance record does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.equipmentMaintenance.delete(maintenanceId);

        // Queue for sync with server
        await addToSyncQueue(
            'equipmentMaintenance',
            'delete',
            { id: maintenanceId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-maintenance/${maintenanceId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipmentMaintenance')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === maintenanceId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipmentMaintenance_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipmentMaintenance'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync equipment maintenance deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting equipment maintenance:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete equipment maintenance"
        };
    }
}

/**
 * Get equipment maintenance by equipment ID - Offline-first implementation
 * @param businessId - The business ID
 * @param equipmentId - The equipment ID to get maintenance records for
 */
export async function getEquipmentMaintenanceByEquipmentId(businessId: string, equipmentId: string): Promise<EquipmentMaintenance[]> {
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

        // Get maintenance records from cache
        const maintenance = await db.equipmentMaintenance
            .where('equipment_id')
            .equals(equipmentId)
            .and(maintenance => maintenance.business_id === businessId)
            .toArray();

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment-maintenance/equipment/${equipmentId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverMaintenance = await response.json();

                    if (serverMaintenance && Array.isArray(serverMaintenance)) {
                        // Update local cache
                        await db.equipmentMaintenance.bulkPut(serverMaintenance);

                        return serverMaintenance;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment maintenance by equipment from server, using cache:', error);
            }
        }

        return maintenance.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error getting equipment maintenance by equipment ID:', error);
        return [];
    }
}

/**
 * Search equipment maintenance - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchEquipmentMaintenance(businessId: string, searchQuery: string): Promise<EquipmentMaintenance[]> {
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

        // Get all maintenance records from cache first
        const allMaintenance = await db.equipmentMaintenance
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allMaintenance.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allMaintenance.filter(maintenance =>
                (maintenance.description && maintenance.description.toLowerCase().includes(query)) ||
                (maintenance.technician && maintenance.technician.toLowerCase().includes(query)) ||
                (maintenance.maintenance_type && maintenance.maintenance_type.toLowerCase().includes(query)) ||
                (maintenance.notes && maintenance.notes.toLowerCase().includes(query))
            ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/equipment-maintenance/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverMaintenance = await response.json();

                if (serverMaintenance && Array.isArray(serverMaintenance)) {
                    // Update local cache
                    await db.equipmentMaintenance.bulkPut(serverMaintenance);

                    return serverMaintenance;
                }
            }
        } catch (error) {
            console.warn('Failed to search equipment maintenance on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allMaintenance.filter(maintenance =>
            (maintenance.description && maintenance.description.toLowerCase().includes(query)) ||
            (maintenance.technician && maintenance.technician.toLowerCase().includes(query)) ||
            (maintenance.maintenance_type && maintenance.maintenance_type.toLowerCase().includes(query)) ||
            (maintenance.notes && maintenance.notes.toLowerCase().includes(query))
        ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());

    } catch (error) {
        console.error('Error searching equipment maintenance:', error);
        return [];
    }
}

/**
 * Get sync status for equipment maintenance
 * @param businessId - The business ID
 */
export async function getEquipmentMaintenanceSyncStatus(businessId: string): Promise<{
    lastSync: number | null;
    pendingChanges: number;
    hasUnsyncedData: boolean;
}> {
    try {
        // Get sync metadata
        const metadata = await db.syncMetadata.get(`equipmentMaintenance_${businessId}`);

        // Count pending sync items
        const pendingChanges = await db.syncQueue
            .where('table')
            .equals('equipmentMaintenance')
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        return {
            lastSync: metadata?.lastSync || null,
            pendingChanges,
            hasUnsyncedData: pendingChanges > 0
        };
    } catch (error) {
        console.error('Error getting equipment maintenance sync status:', error);
        return {
            lastSync: null,
            pendingChanges: 0,
            hasUnsyncedData: false
        };
    }
}
