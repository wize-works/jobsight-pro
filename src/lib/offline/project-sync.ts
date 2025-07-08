/**
 * Project Sync Service - Background sync for projects
 * Part of Phase 3: Core Business Operations Migration
 */

import { db } from "@/lib/offline/dexie-db";
import { Project } from "@/types/projects";

export interface ProjectSyncResult {
    success: boolean;
    syncedCount: number;
    errors: string[];
    lastSyncTime: number;
}

export class ProjectSyncService {
    private static readonly MAX_RETRY_ATTEMPTS = 3;
    private static readonly RETRY_DELAY_MS = 1000;

    /**
     * Full bidirectional sync for projects
     * @param businessId - The business ID to sync projects for
     */
    static async fullSync(businessId: string): Promise<ProjectSyncResult> {
        const result: ProjectSyncResult = {
            success: true,
            syncedCount: 0,
            errors: [],
            lastSyncTime: Date.now()
        };

        try {
            // First, push local changes to server
            const pushResult = await this.syncToServer({ businessId });
            result.syncedCount += pushResult.syncedCount;
            result.errors.push(...pushResult.errors);

            // Then, pull server changes to local
            await this.syncFromServer(businessId);

            result.success = result.errors.length === 0;

        } catch (error) {
            result.success = false;
            result.errors.push(`Full sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Sync local project changes to server
     * @param options - Sync options including businessId
     */
    static async syncToServer(options: { businessId?: string } = {}): Promise<ProjectSyncResult> {
        const result: ProjectSyncResult = {
            success: true,
            syncedCount: 0,
            errors: [],
            lastSyncTime: Date.now()
        };

        try {
            // Get all unsynced project operations
            let query = db.syncQueue.where('table').equals('projects').and(item => !item.synced);

            if (options.businessId) {
                query = query.and(item => item.businessId === options.businessId);
            }

            const unsyncedItems = await query.toArray();

            for (const item of unsyncedItems) {
                try {
                    let success = false;

                    switch (item.operation) {
                        case 'insert':
                            success = await this.syncInsertToServer(item);
                            break;
                        case 'update':
                            success = await this.syncUpdateToServer(item);
                            break;
                        case 'delete':
                            success = await this.syncDeleteToServer(item);
                            break;
                    }

                    if (success) {
                        // Mark as synced
                        await db.syncQueue.update(item.id, { synced: true });
                        result.syncedCount++;
                    } else {
                        // Increment retry count
                        const newRetryCount = item.retryCount + 1;
                        if (newRetryCount >= this.MAX_RETRY_ATTEMPTS) {
                            result.errors.push(`Max retries exceeded for project ${item.operation}: ${item.data?.id}`);
                            // Remove from queue after max retries
                            await db.syncQueue.delete(item.id);
                        } else {
                            await db.syncQueue.update(item.id, { retryCount: newRetryCount });
                        }
                    }

                    // Add delay between requests to avoid overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));

                } catch (error) {
                    console.error(`Error syncing project item ${item.id}:`, error);
                    result.errors.push(`Sync error for ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            result.success = result.errors.length === 0;

        } catch (error) {
            result.success = false;
            result.errors.push(`Sync to server failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Sync server project changes to local storage
     * @param businessId - The business ID to sync projects for
     */
    static async syncFromServer(businessId: string): Promise<void> {
        try {
            // Get the last sync time for this business
            const syncMetadata = await db.syncMetadata.get(`projects_${businessId}`);
            const lastSync = syncMetadata?.lastSync || 0;

            // Fetch projects from server (modified since last sync)
            const response = await fetch(`/api/projects/business/${businessId}/sync?since=${lastSync}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Server sync failed: ${response.status} ${response.statusText}`);
            }

            const serverProjects: Project[] = await response.json();

            if (serverProjects && serverProjects.length > 0) {
                // Update local storage with server data
                await db.projects.bulkPut(serverProjects);

                console.log(`Synced ${serverProjects.length} projects from server for business ${businessId}`);
            }

            // Update sync metadata
            await db.syncMetadata.put({
                id: `projects_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'projects'
            });

        } catch (error) {
            console.error('Error syncing projects from server:', error);
            throw error;
        }
    }

    /**
     * Sync a project insert operation to server
     */
    private static async syncInsertToServer(item: any): Promise<boolean> {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data),
            });

            if (response.ok) {
                const serverProject = await response.json();
                // Update local data with server response (e.g., server-generated IDs)
                await db.projects.put(serverProject);
                return true;
            }

            console.error('Failed to sync project insert:', response.status, response.statusText);
            return false;

        } catch (error) {
            console.error('Error syncing project insert to server:', error);
            return false;
        }
    }

    /**
     * Sync a project update operation to server
     */
    private static async syncUpdateToServer(item: any): Promise<boolean> {
        try {
            const response = await fetch(`/api/projects/${item.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data),
            });

            if (response.ok) {
                const serverProject = await response.json();
                // Update local data with server response
                await db.projects.put(serverProject);
                return true;
            }

            console.error('Failed to sync project update:', response.status, response.statusText);
            return false;

        } catch (error) {
            console.error('Error syncing project update to server:', error);
            return false;
        }
    }

    /**
     * Sync a project delete operation to server
     */
    private static async syncDeleteToServer(item: any): Promise<boolean> {
        try {
            const response = await fetch(`/api/projects/${item.data.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                // Remove from local storage
                await db.projects.delete(item.data.id);
                return true;
            }

            console.error('Failed to sync project delete:', response.status, response.statusText);
            return false;

        } catch (error) {
            console.error('Error syncing project delete to server:', error);
            return false;
        }
    }

    /**
     * Get sync status for projects
     * @param businessId - The business ID to check sync status for
     */
    static async getSyncStatus(businessId: string): Promise<{
        lastSync: number | null;
        pendingOperations: number;
        hasConflicts: boolean;
    }> {
        try {
            // Get last sync time
            const syncMetadata = await db.syncMetadata.get(`projects_${businessId}`);
            const lastSync = syncMetadata?.lastSync || null;

            // Count pending operations
            const pendingOperations = await db.syncQueue
                .where('table').equals('projects')
                .and(item => item.businessId === businessId && !item.synced)
                .count();

            // For now, we'll assume no conflicts (future enhancement could add conflict detection)
            const hasConflicts = false;

            return {
                lastSync,
                pendingOperations,
                hasConflicts
            };

        } catch (error) {
            console.error('Error getting project sync status:', error);
            return {
                lastSync: null,
                pendingOperations: 0,
                hasConflicts: false
            };
        }
    }

    /**
     * Clear all local project data and sync metadata for a business
     * @param businessId - The business ID to clear data for
     */
    static async clearLocalData(businessId: string): Promise<void> {
        try {
            // Remove all projects for this business
            await db.projects.where('business_id').equals(businessId).delete();

            // Remove sync queue items for projects
            await db.syncQueue
                .where('table').equals('projects')
                .and(item => item.businessId === businessId)
                .delete();

            // Remove sync metadata
            await db.syncMetadata.delete(`projects_${businessId}`);

            console.log(`Cleared all local project data for business ${businessId}`);

        } catch (error) {
            console.error('Error clearing local project data:', error);
            throw error;
        }
    }

    /**
     * Force a complete resync for a business (clears local data and syncs from server)
     * @param businessId - The business ID to force resync for
     */
    static async forceResync(businessId: string): Promise<ProjectSyncResult> {
        try {
            // Clear local data first
            await this.clearLocalData(businessId);

            // Sync fresh data from server
            await this.syncFromServer(businessId);

            return {
                success: true,
                syncedCount: 0, // We don't track count for full resyncs
                errors: [],
                lastSyncTime: Date.now()
            };

        } catch (error) {
            return {
                success: false,
                syncedCount: 0,
                errors: [`Force resync failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
                lastSyncTime: Date.now()
            };
        }
    }

    /**
     * Sync projects by status for offline filtering
     * @param businessId - The business ID
     * @param status - The project status to sync
     */
    static async syncProjectsByStatus(businessId: string, status: string): Promise<void> {
        try {
            const response = await fetch(`/api/projects/business/${businessId}/status/${status}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const statusProjects: Project[] = await response.json();

                if (statusProjects && statusProjects.length > 0) {
                    // Update local storage with status-specific projects
                    await db.projects.bulkPut(statusProjects);
                }
            }

        } catch (error) {
            console.error(`Error syncing projects by status (${status}):`, error);
        }
    }

    /**
     * Sync projects by client for offline filtering
     * @param businessId - The business ID
     * @param clientId - The client ID to sync projects for
     */
    static async syncProjectsByClient(businessId: string, clientId: string): Promise<void> {
        try {
            const response = await fetch(`/api/projects/client/${clientId}?businessId=${businessId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const clientProjects: Project[] = await response.json();

                if (clientProjects && clientProjects.length > 0) {
                    // Update local storage with client-specific projects
                    await db.projects.bulkPut(clientProjects);
                }
            }

        } catch (error) {
            console.error(`Error syncing projects by client (${clientId}):`, error);
        }
    }
}
