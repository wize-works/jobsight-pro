"use client";

/**
 * Equipment Client Actions - Offline-First Implementation (Phase 3)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { Equipment, EquipmentInsert, EquipmentUpdate, EquipmentStatus } from "@/types/equipment";
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
 * Get all equipment for a business - Offline-first implementation
 * @param businessId - The business ID to get equipment for
 */
export async function getBusinessEquipment(businessId: string): Promise<Equipment[]> {
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
        const cachedEquipment = await db.equipment
            .where('business_id')
            .equals(businessId)
            .sortBy('name');

        if (cachedEquipment.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`equipment_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedEquipment;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverEquipment = await response.json();

                    if (serverEquipment && Array.isArray(serverEquipment)) {
                        // Update local cache
                        await db.equipment.bulkPut(serverEquipment);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `equipment_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'equipment'
                        });

                        return serverEquipment.sort((a, b) => a.name.localeCompare(b.name));
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedEquipment;

    } catch (error) {
        console.error('Error getting equipment:', error);
        return [];
    }
}

/**
 * Get equipment by ID - Offline-first implementation
 * @param businessId - The business ID
 * @param equipmentId - The equipment ID to get
 */
export async function getEquipmentById(businessId: string, equipmentId: string): Promise<Equipment | null> {
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
        const cachedEquipment = await db.equipment.get(equipmentId);

        if (cachedEquipment && cachedEquipment.business_id === businessId) {
            if (isOnline()) {
                // If we have cached data and are online, check if it's fresh (within 5 minutes)
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                const metadata = await db.syncMetadata.get(`equipment_${businessId}`);

                if (metadata && metadata.lastSync > fiveMinutesAgo) {
                    return cachedEquipment;
                }
            } else {
                // If offline, return cached data
                return cachedEquipment;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment/${equipmentId}?businessId=${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverEquipment = await response.json();

                    if (serverEquipment) {
                        // Update local cache
                        await db.equipment.put(serverEquipment);

                        return serverEquipment;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedEquipment || null;

    } catch (error) {
        console.error('Error getting equipment by ID:', error);
        return null;
    }
}

/**
 * Create equipment - Offline-first implementation with authorization
 * @param businessId - The business ID to create equipment for
 * @param equipmentData - The equipment data to create
 */
export async function createEquipment(
    businessId: string,
    equipmentData: EquipmentInsert
): Promise<{ success: boolean; data?: Equipment; error?: string }> {
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
        const equipmentId = uuidv4();

        // Create equipment object
        const newEquipment: Equipment = {
            id: equipmentId,
            business_id: businessId,
            name: equipmentData.name,
            type: equipmentData.type || null,
            make: equipmentData.make || null,
            model: equipmentData.model || null,
            year: equipmentData.year || null,
            serial_number: equipmentData.serial_number || null,
            status: equipmentData.status || 'available',
            purchase_price: equipmentData.purchase_price || null,
            purchase_date: equipmentData.purchase_date || null,
            current_value: equipmentData.current_value || null,
            location: equipmentData.location || null,
            next_maintenance: equipmentData.next_maintenance || null,
            description: equipmentData.description || null,
            image_url: equipmentData.image_url || null,
            created_at: now,
            created_by: currentUserAuthId,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Store locally immediately (optimistic update)
        await db.equipment.put(newEquipment);

        // Queue for sync with server
        await addToSyncQueue(
            'equipment',
            'insert',
            newEquipment,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch('/api/equipment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...equipmentData,
                        businessId,
                        id: equipmentId
                    }),
                });

                if (response.ok) {
                    const serverEquipment = await response.json();

                    // Update local data with server response
                    await db.equipment.put(serverEquipment);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipment')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'insert'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipment_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipment'
                    });

                    return { success: true, data: serverEquipment };
                }
            } catch (error) {
                console.warn('Failed to sync equipment to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: newEquipment };

    } catch (error) {
        console.error('Error creating equipment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create equipment"
        };
    }
}

/**
 * Update equipment - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param equipmentId - The equipment ID to update
 * @param equipmentData - The equipment data to update
 */
export async function updateEquipment(
    businessId: string,
    equipmentId: string,
    equipmentData: EquipmentUpdate
): Promise<{ success: boolean; data?: Equipment; error?: string }> {
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

        // Get current equipment
        const currentEquipment = await db.equipment.get(equipmentId);
        if (!currentEquipment) {
            return {
                success: false,
                error: "Equipment not found."
            };
        }

        // Verify the equipment belongs to the business
        if (currentEquipment.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data
        const updateData: Partial<Equipment> = {
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        // Only include defined values from equipmentData
        if (equipmentData.name !== undefined) updateData.name = equipmentData.name;
        if (equipmentData.type !== undefined) updateData.type = equipmentData.type;
        if (equipmentData.status !== undefined) updateData.status = equipmentData.status;
        if (equipmentData.make !== undefined) updateData.make = equipmentData.make;
        if (equipmentData.model !== undefined) updateData.model = equipmentData.model;
        if (equipmentData.year !== undefined) updateData.year = equipmentData.year;
        if (equipmentData.serial_number !== undefined) updateData.serial_number = equipmentData.serial_number;
        if (equipmentData.purchase_price !== undefined) updateData.purchase_price = equipmentData.purchase_price;
        if (equipmentData.purchase_date !== undefined) updateData.purchase_date = equipmentData.purchase_date;
        if (equipmentData.current_value !== undefined) updateData.current_value = equipmentData.current_value;
        if (equipmentData.location !== undefined) updateData.location = equipmentData.location;
        if (equipmentData.next_maintenance !== undefined) updateData.next_maintenance = equipmentData.next_maintenance;
        if (equipmentData.description !== undefined) updateData.description = equipmentData.description;
        if (equipmentData.image_url !== undefined) updateData.image_url = equipmentData.image_url;

        // Update locally first (optimistic update)
        const updatedEquipment = { ...currentEquipment, ...updateData };
        await db.equipment.put(updatedEquipment);

        // Queue for sync with server
        await addToSyncQueue(
            'equipment',
            'update',
            updatedEquipment,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment/${equipmentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverEquipment = await response.json();

                    // Update local data with server response
                    await db.equipment.put(serverEquipment);

                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipment')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'update'
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipment_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipment'
                    });

                    return { success: true, data: serverEquipment };
                }
            } catch (error) {
                console.warn('Failed to sync equipment update to server immediately, will retry later:', error);
            }
        }

        return { success: true, data: updatedEquipment };

    } catch (error) {
        console.error('Error updating equipment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update equipment"
        };
    }
}

/**
 * Delete equipment - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param equipmentId - The equipment ID to delete
 */
export async function deleteEquipment(
    businessId: string,
    equipmentId: string
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

        // Get current equipment to verify it exists and belongs to business
        const currentEquipment = await db.equipment.get(equipmentId);
        if (!currentEquipment) {
            return {
                success: false,
                error: "Equipment not found."
            };
        }

        // Verify the equipment belongs to the business
        if (currentEquipment.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Equipment does not belong to this business."
            };
        }

        // Remove from local database immediately (optimistic update)
        await db.equipment.delete(equipmentId);

        // Queue for sync with server
        await addToSyncQueue(
            'equipment',
            'delete',
            { id: equipmentId },
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/equipment/${equipmentId}?businessId=${businessId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue
                        .where('table')
                        .equals('equipment')
                        .and(item =>
                            item.businessId === businessId &&
                            item.operation === 'delete' &&
                            item.data.id === equipmentId
                        )
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `equipment_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'equipment'
                    });

                    return { success: true };
                }
            } catch (error) {
                console.warn('Failed to sync equipment deletion to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error deleting equipment:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete equipment"
        };
    }
}

/**
 * Search equipment - Offline-first implementation
 * @param businessId - The business ID
 * @param searchQuery - The search query
 */
export async function searchEquipment(businessId: string, searchQuery: string): Promise<Equipment[]> {
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

        // Get all equipment from cache first
        const allEquipment = await db.equipment
            .where('business_id')
            .equals(businessId)
            .toArray();

        // If offline or no search query, filter locally
        if (!isOnline() || !searchQuery.trim()) {
            if (!searchQuery.trim()) {
                return allEquipment.sort((a, b) => a.name.localeCompare(b.name));
            }

            // Simple local search
            const query = searchQuery.toLowerCase();
            return allEquipment.filter(equipment =>
                equipment.name.toLowerCase().includes(query) ||
                (equipment.model && equipment.model.toLowerCase().includes(query)) ||
                (equipment.make && equipment.make.toLowerCase().includes(query)) ||
                (equipment.serial_number && equipment.serial_number.toLowerCase().includes(query)) ||
                (equipment.location && equipment.location.toLowerCase().includes(query))
            ).sort((a, b) => a.name.localeCompare(b.name));
        }

        // If online, try server search first
        try {
            const response = await fetch(`/api/equipment/search?businessId=${businessId}&q=${encodeURIComponent(searchQuery)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const serverEquipment = await response.json();

                if (serverEquipment && Array.isArray(serverEquipment)) {
                    // Update local cache
                    await db.equipment.bulkPut(serverEquipment);

                    return serverEquipment;
                }
            }
        } catch (error) {
            console.warn('Failed to search equipment on server, using local search:', error);
        }

        // Fallback to local search
        const query = searchQuery.toLowerCase();
        return allEquipment.filter(equipment =>
            equipment.name.toLowerCase().includes(query) ||
            (equipment.model && equipment.model.toLowerCase().includes(query)) ||
            (equipment.make && equipment.make.toLowerCase().includes(query)) ||
            (equipment.serial_number && equipment.serial_number.toLowerCase().includes(query)) ||
            (equipment.location && equipment.location.toLowerCase().includes(query))
        ).sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
        console.error('Error searching equipment:', error);
        return [];
    }
}

/**
 * Get equipment by status - Offline-first implementation
 * @param businessId - The business ID
 * @param status - The status to filter by
 */
export async function getEquipmentByStatus(businessId: string, status: EquipmentStatus): Promise<Equipment[]> {
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

        // Get equipment from cache
        let equipmentQuery = db.equipment.where('business_id').equals(businessId);

        if (status !== 'all') {
            equipmentQuery = equipmentQuery.and(equipment => equipment.status === status);
        }

        const equipment = await equipmentQuery.sortBy('name');

        // If online, try to get fresh data
        if (isOnline()) {
            try {
                const statusParam = status === 'all' ? '' : `&status=${status}`;
                const response = await fetch(`/api/equipment/business/${businessId}?${statusParam}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverEquipment = await response.json();

                    if (serverEquipment && Array.isArray(serverEquipment)) {
                        // Update local cache
                        await db.equipment.bulkPut(serverEquipment);

                        return serverEquipment.sort((a, b) => a.name.localeCompare(b.name));
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch equipment by status from server, using cache:', error);
            }
        }

        return equipment;

    } catch (error) {
        console.error('Error getting equipment by status:', error);
        return [];
    }
}

/**
 * Set equipment status - Offline-first implementation
 * @param businessId - The business ID
 * @param equipmentId - The equipment ID
 * @param status - The new status
 */
export async function setEquipmentStatus(
    businessId: string,
    equipmentId: string,
    status: EquipmentStatus
): Promise<{ success: boolean; data?: Equipment; error?: string }> {
    try {
        return await updateEquipment(businessId, equipmentId, { status } as EquipmentUpdate);
    } catch (error) {
        console.error('Error setting equipment status:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to set equipment status"
        };
    }
}
