import { BusinessOfflineManager } from './dexie-db';

// Global type declarations for Clerk auth state
declare global {
    var authStateInitialized: boolean | undefined;
    var currentClerkUser: { id: string } | null | undefined;
}

/**
 * Business Sync Service for handling offline-first synchronization
 * 
 * Note: Throughout this service, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), not the internal user.id.
 * This ensures consistent user identification and avoids unnecessary database queries.
 */

export interface SyncOptions {
    force?: boolean;
    businessId?: string;
    batchSize?: number;
}

export interface SyncResult {
    success: boolean;
    syncedCount: number;
    failedCount: number;
    errors: string[];
}

/**
 * Business Sync Service for handling offline-first synchronization
 */
export class BusinessSyncService {
    private static issyncing = false;
    private static readonly DEFAULT_BATCH_SIZE = 10;

    /**
     * Sync pending business operations to server
     */
    static async syncToServer(options: SyncOptions = {}): Promise<SyncResult> {
        if (this.issyncing) {
            console.log('Sync already in progress, skipping...');
            return {
                success: false,
                syncedCount: 0,
                failedCount: 0,
                errors: ['Sync already in progress']
            };
        }

        this.issyncing = true;
        const result: SyncResult = {
            success: true,
            syncedCount: 0,
            failedCount: 0,
            errors: []
        };

        try {
            // Check if we're online
            if (!navigator.onLine) {
                throw new Error('Device is offline');
            }

            // Get pending sync operations
            const pendingOps = await BusinessOfflineManager.getPendingSyncOperations(options.businessId);

            if (pendingOps.length === 0) {
                console.log('No pending sync operations');
                return result;
            }

            console.log(`Syncing ${pendingOps.length} operations...`);

            // Process operations in batches
            const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;

            for (let i = 0; i < pendingOps.length; i += batchSize) {
                const batch = pendingOps.slice(i, i + batchSize);

                for (const operation of batch) {
                    try {
                        await this.syncOperation(operation);
                        await BusinessOfflineManager.markSyncCompleted(operation.id);
                        result.syncedCount++;
                    } catch (error) {
                        console.error('Failed to sync operation:', operation, error);
                        result.failedCount++;
                        result.errors.push(`Failed to sync ${operation.table} ${operation.operation}: ${error}`);

                        // Update retry count (you might want to add this to the operation object)
                        // For now, we'll just log the error and continue
                    }
                }
            }

            // Clean up old completed sync operations
            await BusinessOfflineManager.cleanupSyncQueue();

            console.log(`Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);

        } catch (error) {
            console.error('Sync failed:', error);
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
        } finally {
            this.issyncing = false;
        }

        return result;
    }

    /**
     * Sync a single operation to the server
     */
    private static async syncOperation(operation: any): Promise<void> {
        const { table, operation: op, data, businessId } = operation;

        // Construct the API endpoint based on table and operation
        let url = '';
        let method = '';
        let body: any = null;

        switch (table) {
            case 'businesses':
                switch (op) {
                    case 'insert':
                        url = '/api/businesses';
                        method = 'POST';
                        body = data;
                        break;
                    case 'update':
                        url = `/api/businesses/${data.id}`;
                        method = 'PUT';
                        body = data;
                        break;
                    case 'delete':
                        url = `/api/businesses/${data.id}`;
                        method = 'DELETE';
                        break;
                    default:
                        throw new Error(`Unsupported operation: ${op}`);
                }
                break;

            case 'business_subscriptions':
                switch (op) {
                    case 'insert':
                        url = '/api/business-subscriptions';
                        method = 'POST';
                        body = data;
                        break;
                    case 'update':
                        url = `/api/business-subscriptions/${data.id}`;
                        method = 'PUT';
                        body = data;
                        break;
                    default:
                        throw new Error(`Unsupported operation: ${op} for ${table}`);
                }
                break;

            default:
                throw new Error(`Unsupported table: ${table}`);
        }

        // Make the API call
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                // Add authentication headers as needed
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }

        // Handle response if needed
        if (method !== 'DELETE') {
            const responseData = await response.json();

            // Update local data with server response (for conflict resolution)
            if (table === 'businesses' && op === 'insert') {
                await BusinessOfflineManager.addBusiness(responseData);
            } else if (table === 'businesses' && op === 'update') {
                await BusinessOfflineManager.updateBusiness(data.id, responseData);
            }
        }
    }    /**
     * Sync data from server to local storage (pull sync) - User-scoped
     */
    static async syncFromServer(userId: string, force = false): Promise<void> {
        try {
            if (!navigator.onLine) {
                console.log('Device is offline, skipping server sync');
                return;
            }

            // Get the user's authorized business ID - this ensures we only sync their business
            const userBusinessId = await this.getUserAuthorizedBusinessId(userId);
            if (!userBusinessId) {
                console.log('No authorized business found for user, skipping sync');
                return;
            }

            // Check if we need to sync (based on last sync time)
            if (!force) {
                const hasFreshData = await BusinessOfflineManager.hasFreshData(userBusinessId, 'businesses');
                if (hasFreshData) {
                    console.log('Data is fresh, skipping sync');
                    return;
                }
            }

            console.log('Syncing business data from server for user business:', userBusinessId);

            // Fetch business data from server using user endpoint to ensure proper authorization
            const response = await fetch(`/api/business/user/${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    // Add authentication headers as needed
                }
            });

            if (response.ok) {
                const business = await response.json();

                if (business && business.id === userBusinessId) {
                    // Update local storage only with the user's business
                    await BusinessOfflineManager.addBusiness(business);

                    // Update sync metadata
                    await BusinessOfflineManager.updateSyncMetadata(userBusinessId, 'businesses');

                    console.log('Business data synced from server');
                } else {
                    console.error('Server returned business data that doesn\'t match user authorization');
                }
            } else {
                console.error('Failed to fetch business from server:', response.statusText);
            }

        } catch (error) {
            console.error('Failed to sync from server:', error);
        }
    }

    /**
     * Get the user's authorized business ID
     */
    private static async getUserAuthorizedBusinessId(userId: string): Promise<string | null> {
        try {
            // First try to get from user-business mapping
            const businessId = await BusinessOfflineManager.getBusinessIdForUser(userId);
            if (businessId) {
                return businessId;
            }

            // Fallback: try to find business where user is owner
            const business = await BusinessOfflineManager.getBusinessByOwnerId(userId);
            if (business) {
                // Create the mapping for future use
                await BusinessOfflineManager.setUserBusinessMapping(userId, business.id, 'owner');
                return business.id;
            }

            return null;
        } catch (error) {
            console.error("Error getting user authorized business ID:", error);
            return null;
        }
    }

    /**
     * Perform a full sync (both directions) - User-scoped
     */
    static async fullSync(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
        try {
            // Get the user's authorized business ID
            const userBusinessId = await this.getUserAuthorizedBusinessId(userId);
            if (!userBusinessId) {
                return {
                    success: false,
                    syncedCount: 0,
                    failedCount: 0,
                    errors: ['No authorized business found for user']
                };
            }

            // First, sync to server (push local changes) - only for user's business
            const syncResult = await this.syncToServer({
                ...options,
                businessId: userBusinessId
            });

            // Then, sync from server (pull remote changes) - only for user's business
            await this.syncFromServer(userId, options.force);

            return syncResult;
        } catch (error) {
            console.error('Full sync failed:', error);
            return {
                success: false,
                syncedCount: 0,
                failedCount: 0,
                errors: [error instanceof Error ? error.message : 'Full sync failed']
            };
        }
    }

    /**
     * Register background sync (called from service worker)
     */
    static async registerBackgroundSync(): Promise<void> {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await (registration as any).sync.register('business-sync');
                console.log('Background sync registered');
            } catch (error) {
                console.error('Failed to register background sync:', error);
            }
        }
    }
}

// Auto-sync when online - User-scoped
if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
        console.log('Device came online, triggering sync...');

        // Get the current authenticated user ID from Clerk auth system
        let currentUserId: string | null = null;

        try {
            // First priority: Use initialized Clerk user state (when online and available)
            if (typeof global !== 'undefined' &&
                global.authStateInitialized &&
                global.currentClerkUser?.id) {
                currentUserId = global.currentClerkUser.id;
            }
            // Second priority: Get from cached auth_id (for offline scenarios)
            else if (typeof window !== 'undefined') {
                currentUserId = window.localStorage.getItem('cached_auth_id');
            }
        } catch (error) {
            console.error('Error getting current user ID:', error);
        }

        if (currentUserId) {
            try {
                await BusinessSyncService.fullSync(currentUserId);
            } catch (error) {
                console.error('Auto-sync failed:', error);
            }
        } else {
            console.log('No authenticated user found, skipping auto-sync');
        }
    });
}
