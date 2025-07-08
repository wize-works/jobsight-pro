/**
 * Project Extensions Sync Service - Coordinated sync for project milestones and issues
 * Part of the offline-first architecture implementation (Phase 4.5)
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
 * Sync project milestones for a specific business
 */
async function syncProjectMilestones(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get pending milestone sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('projectMilestones')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending project milestone sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/project-milestones', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/project-milestones/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/project-milestones/${item.data.id}?businessId=${businessId}`, {
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
                        await db.projectMilestones.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync project milestone item ${item.id}:`, error);
                result.failed++;
                result.errors.push(`Milestone ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `projectMilestones_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'projectMilestones'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during project milestones sync:', error);
        result.success = false;
        result.errors.push(`Milestones sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Sync project issues for a specific business
 */
async function syncProjectIssues(businessId: string): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
    };

    try {
        // Get pending issue sync items
        const pendingItems = await db.syncQueue
            .where('table')
            .equals('projectIssues')
            .and(item => item.businessId === businessId && !item.synced)
            .toArray();

        console.log(`Found ${pendingItems.length} pending project issue sync items for business ${businessId}`);

        for (const item of pendingItems) {
            try {
                let response: Response;

                switch (item.operation) {
                    case 'insert':
                        response = await fetch('/api/project-issues', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'update':
                        response = await fetch(`/api/project-issues/${item.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...item.data,
                                businessId
                            }),
                        });
                        break;

                    case 'delete':
                        response = await fetch(`/api/project-issues/${item.data.id}?businessId=${businessId}`, {
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
                        await db.projectIssues.put(serverData);
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error(`Server responded with ${response.status}: ${errorText}`);
                }

            } catch (error) {
                console.error(`Failed to sync project issue item ${item.id}:`, error);
                result.failed++;
                result.errors.push(`Issue ${item.operation}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Increment retry count
                await db.syncQueue.update(item.id, {
                    retryCount: (item.retryCount || 0) + 1
                });
            }
        }

        // Update sync metadata
        if (result.synced > 0) {
            await db.syncMetadata.put({
                id: `projectIssues_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'projectIssues'
            });
        }

        if (result.failed > 0) {
            result.success = false;
        }

    } catch (error) {
        console.error('Error during project issues sync:', error);
        result.success = false;
        result.errors.push(`Issues sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Main project extensions sync function - coordinates sync for milestones and issues
 */
export async function syncProjectExtensions(businessId: string): Promise<{
    success: boolean;
    results: {
        milestones: SyncResult;
        issues: SyncResult;
    };
    summary: {
        totalSynced: number;
        totalFailed: number;
        allErrors: string[];
    };
}> {
    console.log(`Starting project extensions sync for business ${businessId}`);

    const startTime = Date.now();

    // Sync all project extension entities
    const [milestonesResult, issuesResult] = await Promise.all([
        syncProjectMilestones(businessId),
        syncProjectIssues(businessId)
    ]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calculate summary
    const totalSynced = milestonesResult.synced + issuesResult.synced;
    const totalFailed = milestonesResult.failed + issuesResult.failed;
    const allErrors = [...milestonesResult.errors, ...issuesResult.errors];

    const overallSuccess = milestonesResult.success && issuesResult.success;

    console.log(`Project extensions sync completed in ${duration}ms - Synced: ${totalSynced}, Failed: ${totalFailed}`);

    if (allErrors.length > 0) {
        console.warn('Project extensions sync errors:', allErrors);
    }

    return {
        success: overallSuccess,
        results: {
            milestones: milestonesResult,
            issues: issuesResult
        },
        summary: {
            totalSynced,
            totalFailed,
            allErrors
        }
    };
}

/**
 * Sync fresh data from server for project extensions
 */
export async function pullProjectExtensionsFromServer(businessId: string): Promise<{
    success: boolean;
    milestonesCount: number;
    issuesCount: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let milestonesCount = 0;
    let issuesCount = 0;

    try {
        // Fetch project milestones
        try {
            const milestonesResponse = await fetch(`/api/project-milestones/business/${businessId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (milestonesResponse.ok) {
                const milestones = await milestonesResponse.json();
                if (milestones && Array.isArray(milestones)) {
                    await db.projectMilestones.bulkPut(milestones);
                    milestonesCount = milestones.length;

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projectMilestones_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projectMilestones'
                    });
                }
            } else {
                errors.push(`Failed to fetch milestones: ${milestonesResponse.status}`);
            }
        } catch (error) {
            errors.push(`Milestones fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Fetch project issues
        try {
            const issuesResponse = await fetch(`/api/project-issues/business/${businessId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (issuesResponse.ok) {
                const issues = await issuesResponse.json();
                if (issues && Array.isArray(issues)) {
                    await db.projectIssues.bulkPut(issues);
                    issuesCount = issues.length;

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `projectIssues_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'projectIssues'
                    });
                }
            } else {
                errors.push(`Failed to fetch issues: ${issuesResponse.status}`);
            }
        } catch (error) {
            errors.push(`Issues fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

    } catch (error) {
        errors.push(`General pull error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
        success: errors.length === 0,
        milestonesCount,
        issuesCount,
        errors
    };
}

/**
 * Get sync status for all project extension entities
 */
export async function getProjectExtensionsSyncStatus(businessId: string): Promise<{
    milestones: {
        lastSync: number | null;
        pendingChanges: number;
        hasUnsyncedData: boolean;
    };
    issues: {
        lastSync: number | null;
        pendingChanges: number;
        hasUnsyncedData: boolean;
    };
}> {
    try {
        // Get milestones sync status
        const milestonesMetadata = await db.syncMetadata.get(`projectMilestones_${businessId}`);
        const milestonesPending = await db.syncQueue
            .where('table')
            .equals('projectMilestones')
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        // Get issues sync status
        const issuesMetadata = await db.syncMetadata.get(`projectIssues_${businessId}`);
        const issuesPending = await db.syncQueue
            .where('table')
            .equals('projectIssues')
            .and(item => item.businessId === businessId && !item.synced)
            .count();

        return {
            milestones: {
                lastSync: milestonesMetadata?.lastSync || null,
                pendingChanges: milestonesPending,
                hasUnsyncedData: milestonesPending > 0
            },
            issues: {
                lastSync: issuesMetadata?.lastSync || null,
                pendingChanges: issuesPending,
                hasUnsyncedData: issuesPending > 0
            }
        };
    } catch (error) {
        console.error('Error getting project extensions sync status:', error);
        return {
            milestones: {
                lastSync: null,
                pendingChanges: 0,
                hasUnsyncedData: false
            },
            issues: {
                lastSync: null,
                pendingChanges: 0,
                hasUnsyncedData: false
            }
        };
    }
}
