/**
 * Crew Sync Service - Coordinated Sync for Crew Management System (Phase 4.3)
 * 
 * This service handles synchronized syncing of all crew-related entities:
 * - crews
 * - crewMembers
 * - crewMemberAssignments
 * - projectCrews
 * 
 * Includes dependency management and conflict resolution for crew data.
 */

import { db } from "./dexie-db";

interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}

interface CrewSyncStats {
    crews: SyncResult;
    crewMembers: SyncResult;
    crewMemberAssignments: SyncResult;
    projectCrews: SyncResult;
}

export class CrewSyncService {
    private static instance: CrewSyncService;
    private isSyncing = false;
    private abortController: AbortController | null = null;

    static getInstance(): CrewSyncService {
        if (!this.instance) {
            this.instance = new CrewSyncService();
        }
        return this.instance;
    }

    /**
     * Check if currently syncing
     */
    public isSyncInProgress(): boolean {
        return this.isSyncing;
    }

    /**
     * Abort current sync operation
     */
    public abortSync(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.isSyncing = false;
    }

    /**
     * Sync all crew-related entities for a business in dependency order
     * @param businessId - The business ID to sync crew data for
     * @param maxRetries - Maximum number of retry attempts per item
     */
    public async syncCrewData(businessId: string, maxRetries: number = 3): Promise<CrewSyncStats> {
        if (this.isSyncing) {
            throw new Error('Sync already in progress');
        }

        this.isSyncing = true;
        this.abortController = new AbortController();

        const stats: CrewSyncStats = {
            crews: { success: true, synced: 0, failed: 0, errors: [] },
            crewMembers: { success: true, synced: 0, failed: 0, errors: [] },
            crewMemberAssignments: { success: true, synced: 0, failed: 0, errors: [] },
            projectCrews: { success: true, synced: 0, failed: 0, errors: [] }
        };

        try {
            console.log(`Starting crew data sync for business: ${businessId}`);

            // Step 1: Sync crews first (other entities depend on crews)
            console.log('Syncing crews...');
            stats.crews = await this.syncTable('crews', businessId, maxRetries);

            if (this.abortController?.signal.aborted) {
                throw new Error('Sync aborted');
            }

            // Step 2: Sync crew members (independent of crews but needed for assignments)
            console.log('Syncing crew members...');
            stats.crewMembers = await this.syncTable('crewMembers', businessId, maxRetries);

            if (this.abortController?.signal.aborted) {
                throw new Error('Sync aborted');
            }

            // Step 3: Sync crew member assignments (depends on crews and crew members)
            console.log('Syncing crew member assignments...');
            stats.crewMemberAssignments = await this.syncTable('crewMemberAssignments', businessId, maxRetries);

            if (this.abortController?.signal.aborted) {
                throw new Error('Sync aborted');
            }

            // Step 4: Sync project crews (depends on crews and projects)
            console.log('Syncing project crews...');
            stats.projectCrews = await this.syncTable('projectCrews', businessId, maxRetries);

            console.log('Crew data sync completed', stats);

            // Update sync metadata for the entire crew system
            await db.syncMetadata.put({
                id: `crewSystem_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'crewSystem'
            });

            return stats;

        } catch (error) {
            console.error('Error during crew data sync:', error);
            throw error;
        } finally {
            this.isSyncing = false;
            this.abortController = null;
        }
    }

    /**
     * Sync a specific crew-related table
     * @param tableName - The table to sync
     * @param businessId - The business ID
     * @param maxRetries - Maximum retry attempts
     */
    private async syncTable(tableName: string, businessId: string, maxRetries: number): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            synced: 0,
            failed: 0,
            errors: []
        };

        try {
            // Get all unsynced items for this table and business
            const unsyncedItems = await db.syncQueue
                .where('table')
                .equals(tableName)
                .and(item => item.businessId === businessId && !item.synced)
                .toArray();

            console.log(`Found ${unsyncedItems.length} unsynced ${tableName} items`);

            for (const item of unsyncedItems) {
                if (this.abortController?.signal.aborted) {
                    throw new Error('Sync aborted');
                }

                try {
                    await this.syncSingleItem(item, maxRetries);
                    result.synced++;
                } catch (error) {
                    result.failed++;
                    result.errors.push(`${tableName} item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    console.error(`Failed to sync ${tableName} item:`, error);
                }
            }

            if (result.failed > 0) {
                result.success = false;
            }

            return result;

        } catch (error) {
            result.success = false;
            result.errors.push(`Table sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }

    /**
     * Sync a single item from the sync queue
     * @param item - The sync queue item
     * @param maxRetries - Maximum retry attempts
     */
    private async syncSingleItem(item: any, maxRetries: number): Promise<void> {
        if (item.retryCount >= maxRetries) {
            throw new Error(`Max retries (${maxRetries}) exceeded for item ${item.id}`);
        }

        try {
            let response: Response;
            const apiPath = this.getApiPath(item.table);

            switch (item.operation) {
                case 'insert':
                    response = await fetch(`/api/${apiPath}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...item.data, businessId: item.businessId }),
                        signal: this.abortController?.signal
                    });
                    break;

                case 'update':
                    response = await fetch(`/api/${apiPath}/${item.data.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...item.data, businessId: item.businessId }),
                        signal: this.abortController?.signal
                    });
                    break;

                case 'delete':
                    response = await fetch(`/api/${apiPath}/${item.data.id}?businessId=${item.businessId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        signal: this.abortController?.signal
                    });
                    break;

                default:
                    throw new Error(`Unknown operation: ${item.operation}`);
            }

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            // If insert or update, get the response data and update local cache
            if (item.operation === 'insert' || item.operation === 'update') {
                const serverData = await response.json();
                if (serverData) {
                    // Update local cache with server response
                    await this.updateLocalCache(item.table, serverData);
                }
            }

            // Mark as synced
            await db.syncQueue.update(item.id, { synced: true });

        } catch (error) {
            // Increment retry count
            await db.syncQueue.update(item.id, { retryCount: item.retryCount + 1 });
            throw error;
        }
    }

    /**
     * Update local cache with server data
     * @param tableName - The table name
     * @param data - The data to update
     */
    private async updateLocalCache(tableName: string, data: any): Promise<void> {
        switch (tableName) {
            case 'crews':
                await db.crews.put(data);
                break;
            case 'crewMembers':
                await db.crewMembers.put(data);
                break;
            case 'crewMemberAssignments':
                await db.crewMemberAssignments.put(data);
                break;
            case 'projectCrews':
                await db.projectCrews.put(data);
                break;
            default:
                console.warn(`Unknown table for cache update: ${tableName}`);
        }
    }

    /**
     * Get API path for table name
     * @param tableName - The table name
     */
    private getApiPath(tableName: string): string {
        switch (tableName) {
            case 'crews':
                return 'crews';
            case 'crewMembers':
                return 'crew-members';
            case 'crewMemberAssignments':
                return 'crew-member-assignments';
            case 'projectCrews':
                return 'project-crews';
            default:
                throw new Error(`Unknown table: ${tableName}`);
        }
    }

    /**
     * Get sync statistics for crew data
     * @param businessId - The business ID
     */
    public async getSyncStats(businessId: string): Promise<{
        totalPending: number;
        byTable: Record<string, number>;
        lastSync: number | null;
    }> {
        const crewTables = ['crews', 'crewMembers', 'crewMemberAssignments', 'projectCrews'];

        const stats = {
            totalPending: 0,
            byTable: {} as Record<string, number>,
            lastSync: null as number | null
        };

        // Count pending sync items by table
        for (const table of crewTables) {
            const count = await db.syncQueue
                .where('table')
                .equals(table)
                .and(item => item.businessId === businessId && !item.synced)
                .count();

            stats.byTable[table] = count;
            stats.totalPending += count;
        }

        // Get last sync time
        const metadata = await db.syncMetadata.get(`crewSystem_${businessId}`);
        if (metadata) {
            stats.lastSync = metadata.lastSync;
        }

        return stats;
    }

    /**
     * Clear all synced items from the queue for crew tables
     * @param businessId - The business ID
     */
    public async clearSyncedItems(businessId: string): Promise<number> {
        const crewTables = ['crews', 'crewMembers', 'crewMemberAssignments', 'projectCrews'];
        let deletedCount = 0;

        for (const table of crewTables) {
            const deleted = await db.syncQueue
                .where('table')
                .equals(table)
                .and(item => item.businessId === businessId && item.synced)
                .delete();

            deletedCount += deleted;
        }

        return deletedCount;
    }

    /**
     * Force refresh crew data from server
     * @param businessId - The business ID
     */
    public async forceRefresh(businessId: string): Promise<void> {
        try {
            console.log(`Force refreshing crew data for business: ${businessId}`);

            // Fetch crews
            const crewsResponse = await fetch(`/api/crews/business/${businessId}`);
            if (crewsResponse.ok) {
                const crews = await crewsResponse.json();
                if (crews && Array.isArray(crews)) {
                    await db.crews.bulkPut(crews);
                }
            }

            // Fetch crew members
            const crewMembersResponse = await fetch(`/api/crew-members/business/${businessId}`);
            if (crewMembersResponse.ok) {
                const crewMembers = await crewMembersResponse.json();
                if (crewMembers && Array.isArray(crewMembers)) {
                    await db.crewMembers.bulkPut(crewMembers);
                }
            }

            // Fetch crew member assignments
            const assignmentsResponse = await fetch(`/api/crew-member-assignments/business/${businessId}`);
            if (assignmentsResponse.ok) {
                const assignments = await assignmentsResponse.json();
                if (assignments && Array.isArray(assignments)) {
                    await db.crewMemberAssignments.bulkPut(assignments);
                }
            }

            // Fetch project crews
            const projectCrewsResponse = await fetch(`/api/project-crews/business/${businessId}`);
            if (projectCrewsResponse.ok) {
                const projectCrews = await projectCrewsResponse.json();
                if (projectCrews && Array.isArray(projectCrews)) {
                    await db.projectCrews.bulkPut(projectCrews);
                }
            }

            // Update sync metadata
            await db.syncMetadata.put({
                id: `crewSystem_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'crewSystem'
            });

            console.log('Force refresh of crew data completed');

        } catch (error) {
            console.error('Error during force refresh of crew data:', error);
            throw error;
        }
    }

    /**
     * Validate crew data integrity
     * @param businessId - The business ID
     */
    public async validateDataIntegrity(businessId: string): Promise<{
        valid: boolean;
        issues: string[];
    }> {
        const issues: string[] = [];

        try {
            // Check crew member assignments reference valid crews and crew members
            const assignments = await db.crewMemberAssignments
                .where('business_id')
                .equals(businessId)
                .toArray();

            for (const assignment of assignments) {
                // Check if crew exists
                const crew = await db.crews.get(assignment.crew_id);
                if (!crew) {
                    issues.push(`Crew member assignment ${assignment.id} references non-existent crew ${assignment.crew_id}`);
                }

                // Check if crew member exists
                const crewMember = await db.crewMembers.get(assignment.crew_member_id);
                if (!crewMember) {
                    issues.push(`Crew member assignment ${assignment.id} references non-existent crew member ${assignment.crew_member_id}`);
                }
            }

            // Check project crews reference valid crews and projects
            const projectCrews = await db.projectCrews
                .where('business_id')
                .equals(businessId)
                .toArray();

            for (const projectCrew of projectCrews) {
                // Check if crew exists
                const crew = await db.crews.get(projectCrew.crew_id);
                if (!crew) {
                    issues.push(`Project crew ${projectCrew.id} references non-existent crew ${projectCrew.crew_id}`);
                }

                // Check if project exists
                const project = await db.projects.get(projectCrew.project_id);
                if (!project) {
                    issues.push(`Project crew ${projectCrew.id} references non-existent project ${projectCrew.project_id}`);
                }
            }

            return {
                valid: issues.length === 0,
                issues
            };

        } catch (error) {
            issues.push(`Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                valid: false,
                issues
            };
        }
    }
}
