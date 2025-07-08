/**
 * Equipment Extensions Sync Service - Coordinated sync for equipment-related entities
 * Part of the offline-first architecture implementation (Phase 4.6)
 */

import { db } from "./dexie-db";

// Types for sync operations
interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}

/**
 * Sync equipment assignments for a specific business
 */
async function syncEquipmentAssignments(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get pending assignment sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('equipmentAssignments')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending equipment assignment sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/equipment-assignments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/equipment-assignments/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/equipment-assignments/${item.data.id}?businessId=${businessId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                        });
                        break;

                    default:
                        throw new Error(`Unknown operation: ${item.operation}`);
                }

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue.update(item.id, { synced: true });
                    result.synced++;

                    // Update local data with server response for create/update operations
                    if (item.operation !== 'delete') {
                        const serverData = await response.json();
                        await db.equipmentAssignments.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync equipment assignment item ${item.id}:`, error);
                result.failed++;
                result.errors.push(`Assignment ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `equipmentAssignments_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'equipmentAssignments'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during equipment assignments sync:', error);
        result.success = false;
        result.errors.push(`Assignments sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Sync equipment maintenance for a specific business
 */
async function syncEquipmentMaintenance(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get pending maintenance sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('equipmentMaintenance')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending equipment maintenance sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/equipment-maintenance', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/equipment-maintenance/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/equipment-maintenance/${item.data.id}?businessId=${businessId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                        });
                        break;

                    default:
                        throw new Error(`Unknown operation: ${item.operation}`);
                }

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue.update(item.id, { synced: true });
                    result.synced++;

                    // Update local data with server response for create/update operations
                    if (item.operation !== 'delete') {
                        const serverData = await response.json();
                        await db.equipmentMaintenance.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync equipment maintenance item ${item.id}:`, error);
                result.failed++;
                result.errors.push(`Maintenance ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `equipmentMaintenance_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'equipmentMaintenance'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during equipment maintenance sync:', error);
        result.success = false;
        result.errors.push(`Maintenance sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Sync equipment specifications for a specific business
 */
async function syncEquipmentSpecifications(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get pending specification sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('equipmentSpecifications')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending equipment specification sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/equipment-specifications', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/equipment-specifications/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/equipment-specifications/${item.data.id}?businessId=${businessId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                        });
                        break;

                    default:
                        throw new Error(`Unknown operation: ${item.operation}`);
                }

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue.update(item.id, { synced: true });
                    result.synced++;

                    // Update local data with server response for create/update operations
                    if (item.operation !== 'delete') {
                        const serverData = await response.json();
                        await db.equipmentSpecifications.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync equipment specification item ${item.id}:`, error);
                result.failed++;
                result.errors.push(`Specification ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `equipmentSpecifications_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'equipmentSpecifications'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during equipment specifications sync:', error);
        result.success = false;
        result.errors.push(`Specifications sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Sync equipment usage for a specific business
 */
async function syncEquipmentUsage(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get pending usage sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('equipmentUsage')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending equipment usage sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/equipment-usage', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/equipment-usage/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/equipment-usage/${item.data.id}?businessId=${businessId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                        });
                        break;

                    default:
                        throw new Error(`Unknown operation: ${item.operation}`);
                }

                if (response.ok) {
                    // Mark as synced
                    await db.syncQueue.update(item.id, { synced: true });
                    result.synced++;

                    // Update local data with server response for create/update operations
                    if (item.operation !== 'delete') {
                        const serverData = await response.json();
                        await db.equipmentUsage.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync equipment usage item ${item.id}:`, error);
                result.failed++;
                result.errors.push(`Usage ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `equipmentUsage_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'equipmentUsage'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during equipment usage sync:', error);
        result.success = false;
        result.errors.push(`Usage sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Full sync for all equipment extension entities
 */
export async function syncEquipmentExtensions(businessId: string): Promise<{
    success: boolean;
    assignments: SyncResult;
    maintenance: SyncResult;
    specifications: SyncResult;
    usage: SyncResult;
}> {
    console.log(`Starting equipment extensions sync for business ${businessId}`);

    const [assignments, maintenance, specifications, usage] = await Promise.all([
        syncEquipmentAssignments(businessId),
        syncEquipmentMaintenance(businessId),
        syncEquipmentSpecifications(businessId),
        syncEquipmentUsage(businessId)
    ]);

    const overallSuccess = assignments.success && maintenance.success && specifications.success && usage.success;

    console.log(`Equipment extensions sync completed for business ${businessId}. Success: ${overallSuccess}`);

    return {
        success: overallSuccess,
        assignments,
        maintenance,
        specifications,
        usage
    };
}

/**
 * Sync specific equipment extension entity
 */
export async function syncEquipmentExtensionEntity(
    businessId: string,
    entity: 'assignments' | 'maintenance' | 'specifications' | 'usage'
): Promise<SyncResult> {
    switch (entity) {
        case 'assignments':
            return syncEquipmentAssignments(businessId);
        case 'maintenance':
            return syncEquipmentMaintenance(businessId);
        case 'specifications':
            return syncEquipmentSpecifications(businessId);
        case 'usage':
            return syncEquipmentUsage(businessId);
        default:
            throw new Error(`Unknown equipment extension entity: ${entity}`);
    }
}

/**
 * Check if equipment extensions need syncing
 */
export async function hasEquipmentExtensionsPendingSync(businessId: string): Promise<boolean> {
    const tables = ['equipmentAssignments', 'equipmentMaintenance', 'equipmentSpecifications', 'equipmentUsage'];

    for (const table of tables) {
        const pendingCount = await db.syncQueue
            .where('table')
            .equals(table)
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        if (pendingCount > 0) {
            return true;
        }
    }

    return false;
}
