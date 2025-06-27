/**
 * Data Synchronization Utilities
 * 
 * Handles initial population of IndexedDB from server data
 * and ongoing sync operations for offline-first architecture.
 */

// Import server actions for data fetching
import { getProjects as getServerProjects } from '@/app/actions/projects';
import { getTasks as getServerTasks } from '@/app/actions/tasks';
import { getClients as getServerClients } from '@/app/actions/clients';
import { getCrews as getServerCrews } from '@/app/actions/crews';
import { getEquipments as getServerEquipments } from '@/app/actions/equipments';
import { getInvoices as getServerInvoices } from '@/app/actions/invoices';
import { getDailyLogs as getServerDailyLogs } from '@/app/actions/daily-logs';

// Use the existing client actions to store data (they handle IndexedDB automatically)
import { createProject } from './projects-client';
import { createTask } from './tasks-client';
import { createClient } from './clients-client';
import { createCrew } from './crews-client';
import { createEquipment } from './equipment-client';
import { createInvoice } from './invoices-client';
import { createDailyLog } from './daily-logs-client';

interface SyncStatus {
    entity: string;
    success: boolean;
    error?: string;
    count?: number;
}

/**
 * Check if initial sync has been completed for a business
 */
export function hasInitialSyncCompleted(businessId: string): boolean {
    const syncKey = `initial_sync_${businessId}`;
    return localStorage.getItem(syncKey) === 'completed';
}

/**
 * Mark initial sync as completed for a business
 */
export function markInitialSyncCompleted(businessId: string): void {
    const syncKey = `initial_sync_${businessId}`;
    localStorage.setItem(syncKey, 'completed');
}

/**
 * Perform initial data synchronization from server to IndexedDB
 */
export async function performInitialDataSync(businessId: string): Promise<SyncStatus[]> {
    if (!businessId) {
        throw new Error('Business ID is required for data sync');
    }

    console.log('🔄 Starting initial data sync for business:', businessId);

    const syncResults: SyncStatus[] = [];

    try {
        // Sync core entities in parallel for better performance
        const syncPromises = [
            syncEntity('projects', () => getServerProjects(businessId), (data) => syncProjectsFromServer(businessId, data)),
            syncEntity('clients', () => getServerClients(businessId), (data) => syncClientsFromServer(businessId, data)),
            syncEntity('tasks', () => getServerTasks(businessId), (data) => syncTasksFromServer(businessId, data)),
            syncEntity('crews', () => getServerCrews(businessId), (data) => syncCrewsFromServer(businessId, data)),
            syncEntity('equipment', () => getServerEquipments(businessId), (data) => syncEquipmentsFromServer(businessId, data)),
            syncEntity('invoices', () => getServerInvoices(businessId), (data) => syncInvoicesFromServer(businessId, data)),
            syncEntity('daily-logs', () => getServerDailyLogs(businessId), (data) => syncDailyLogsFromServer(businessId, data)),
        ];

        const results = await Promise.allSettled(syncPromises);

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                syncResults.push(result.value);
            } else {
                const entityNames = ['projects', 'clients', 'tasks', 'crews', 'equipment', 'invoices', 'daily-logs'];
                syncResults.push({
                    entity: entityNames[index],
                    success: false,
                    error: result.reason?.message || 'Unknown error'
                });
            }
        });

        // Mark sync as completed if at least some entities synced successfully
        const successfulSyncs = syncResults.filter(r => r.success).length;
        if (successfulSyncs > 0) {
            markInitialSyncCompleted(businessId);
            console.log(`✅ Initial data sync completed: ${successfulSyncs}/${syncResults.length} entities synced`);
        } else {
            console.error('❌ Initial data sync failed: No entities synced successfully');
        }

        return syncResults;
    } catch (error) {
        console.error('❌ Initial data sync failed:', error);
        throw error;
    }
}

/**
 * Helper function to sync a single entity type
 */
async function syncEntity<T>(
    entityName: string,
    fetchFromServer: () => Promise<T[]>,
    syncToClient: (data: T[]) => Promise<any>
): Promise<SyncStatus> {
    try {
        console.log(`🔄 Syncing ${entityName}...`);

        const serverData = await fetchFromServer();

        if (Array.isArray(serverData)) {
            await syncToClient(serverData);

            console.log(`✅ ${entityName} synced: ${serverData.length} items`);
            return {
                entity: entityName,
                success: true,
                count: serverData.length
            };
        } else {
            throw new Error(`Invalid data format received for ${entityName}`);
        }
    } catch (error) {
        console.error(`❌ Failed to sync ${entityName}:`, error);
        return {
            entity: entityName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Force refresh all data from server (useful for development/debugging)
 */
export async function forceRefreshAllData(businessId: string): Promise<SyncStatus[]> {
    // Clear the sync flag to force re-sync
    const syncKey = `initial_sync_${businessId}`;
    localStorage.removeItem(syncKey);

    // Perform fresh sync
    return performInitialDataSync(businessId);
}

/**
 * Check if we're online and can perform sync
 */
export function canPerformSync(): boolean {
    return navigator.onLine;
}
