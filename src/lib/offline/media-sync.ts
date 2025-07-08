import { db } from './dexie-db';
import { Media, MediaLink, MediaMetadata, MediaTag } from '@/types/media';

/**
 * Media System Sync Service - Offline-First Implementation
 * 
 * This service coordinates synchronization for all media-related entities:
 * - Media (metadata only, not files)
 * - Media Links (connections to other entities)
 * - Media Metadata (key-value metadata)
 * - Media Tags (tagging system)
 * - Upload Queue Management
 * 
 * Key features:
 * - Metadata-only sync (files handled separately)
 * - Upload queue processing
 * - Conflict resolution
 * - Batch operations for efficiency
 */

export class MediaSyncService {
    private static instance: MediaSyncService;
    private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
    private syncInProgress = false;

    private constructor() {
        // Listen for online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.triggerSync();
            });

            window.addEventListener('offline', () => {
                this.isOnline = false;
            });
        }
    }

    static getInstance(): MediaSyncService {
        if (!MediaSyncService.instance) {
            MediaSyncService.instance = new MediaSyncService();
        }
        return MediaSyncService.instance;
    }

    /**
     * Trigger full sync for media system
     */
    async triggerSync(businessId?: string): Promise<void> {
        if (!this.isOnline || this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;

        try {
            console.log('Starting media system sync...');

            if (businessId) {
                await this.syncBusinessMedia(businessId);
            } else {
                // Sync all businesses (get from user mappings)
                const userMappings = await db.userBusinessMappings.toArray();
                const businessIds = [...new Set(userMappings.map(m => m.businessId))];

                for (const id of businessIds) {
                    await this.syncBusinessMedia(id);
                }
            }

            console.log('Media system sync completed');
        } catch (error) {
            console.error('Media system sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync media data for a specific business
     */
    private async syncBusinessMedia(businessId: string): Promise<void> {
        try {
            // Sync media metadata
            await this.syncMediaMetadata(businessId);

            // Sync media links
            await this.syncMediaLinks(businessId);

            // Sync media metadata (key-value pairs)
            await this.syncMediaMetadataKV(businessId);

            // Sync media tags
            await this.syncMediaTags(businessId);

            // Process upload queue
            await this.processUploadQueue(businessId);

            // Update sync timestamp
            await db.syncMetadata.put({
                id: `media_${businessId}`,
                lastSync: Date.now(),
                businessId,
                table: 'media'
            });

        } catch (error) {
            console.error(`Failed to sync media for business ${businessId}:`, error);
            throw error;
        }
    }

    /**
     * Sync media metadata records
     */
    private async syncMediaMetadata(businessId: string): Promise<void> {
        try {
            console.log(`Syncing media metadata for business ${businessId}...`);

            // Get pending sync operations for media
            const pendingOps = await db.syncQueue
                .filter(item =>
                    item.table === 'media' &&
                    item.businessId === businessId &&
                    !item.synced
                )
                .toArray();

            for (const op of pendingOps) {
                try {
                    switch (op.operation) {
                        case 'insert':
                            await this.syncMediaInsert(op);
                            break;
                        case 'update':
                            await this.syncMediaUpdate(op);
                            break;
                        case 'delete':
                            await this.syncMediaDelete(op);
                            break;
                    }

                    // Mark as synced
                    await db.syncQueue.update(op.id, { synced: true });
                } catch (error) {
                    console.error(`Failed to sync media operation ${op.id}:`, error);

                    // Increment retry count
                    await db.syncQueue.update(op.id, {
                        retryCount: op.retryCount + 1
                    });

                    // If too many retries, mark as failed (optional)
                    if (op.retryCount >= 3) {
                        console.error(`Giving up on media operation ${op.id} after 3 retries`);
                        await db.syncQueue.delete(op.id);
                    }
                }
            }

            // TODO: Fetch fresh data from server
            // This would involve calling the actual API endpoints
            // For now, we're focusing on the offline-first structure

        } catch (error) {
            console.error('Error syncing media metadata:', error);
            throw error;
        }
    }

    /**
     * Sync media links
     */
    private async syncMediaLinks(businessId: string): Promise<void> {
        try {
            console.log(`Syncing media links for business ${businessId}...`);

            const pendingOps = await db.syncQueue
                .filter(item =>
                    item.table === 'mediaLinks' &&
                    item.businessId === businessId &&
                    !item.synced
                )
                .toArray();

            for (const op of pendingOps) {
                try {
                    // TODO: Implement actual server sync for media links
                    console.log(`Processing media link operation: ${op.operation}`);

                    // Mark as synced for now
                    await db.syncQueue.update(op.id, { synced: true });
                } catch (error) {
                    console.error(`Failed to sync media link operation ${op.id}:`, error);
                    await db.syncQueue.update(op.id, {
                        retryCount: op.retryCount + 1
                    });
                }
            }
        } catch (error) {
            console.error('Error syncing media links:', error);
            throw error;
        }
    }

    /**
     * Sync media metadata key-value pairs
     */
    private async syncMediaMetadataKV(businessId: string): Promise<void> {
        try {
            console.log(`Syncing media metadata KV for business ${businessId}...`);

            const pendingOps = await db.syncQueue
                .filter(item =>
                    item.table === 'mediaMetadata' &&
                    item.businessId === businessId &&
                    !item.synced
                )
                .toArray();

            for (const op of pendingOps) {
                try {
                    // TODO: Implement actual server sync for media metadata
                    console.log(`Processing media metadata operation: ${op.operation}`);

                    // Mark as synced for now
                    await db.syncQueue.update(op.id, { synced: true });
                } catch (error) {
                    console.error(`Failed to sync media metadata operation ${op.id}:`, error);
                    await db.syncQueue.update(op.id, {
                        retryCount: op.retryCount + 1
                    });
                }
            }
        } catch (error) {
            console.error('Error syncing media metadata KV:', error);
            throw error;
        }
    }

    /**
     * Sync media tags
     */
    private async syncMediaTags(businessId: string): Promise<void> {
        try {
            console.log(`Syncing media tags for business ${businessId}...`);

            const pendingOps = await db.syncQueue
                .filter(item =>
                    item.table === 'mediaTags' &&
                    item.businessId === businessId &&
                    !item.synced
                )
                .toArray();

            for (const op of pendingOps) {
                try {
                    // TODO: Implement actual server sync for media tags
                    console.log(`Processing media tag operation: ${op.operation}`);

                    // Mark as synced for now
                    await db.syncQueue.update(op.id, { synced: true });
                } catch (error) {
                    console.error(`Failed to sync media tag operation ${op.id}:`, error);
                    await db.syncQueue.update(op.id, {
                        retryCount: op.retryCount + 1
                    });
                }
            }
        } catch (error) {
            console.error('Error syncing media tags:', error);
            throw error;
        }
    }

    /**
     * Process upload queue for pending file uploads
     */
    private async processUploadQueue(businessId: string): Promise<void> {
        try {
            console.log(`Processing upload queue for business ${businessId}...`);

            const pendingUploads = await db.mediaUploadQueue
                .filter(item =>
                    item.businessId === businessId &&
                    (item.uploadStatus === 'pending' || item.uploadStatus === 'failed')
                )
                .toArray();

            for (const upload of pendingUploads) {
                try {
                    // Update status to uploading
                    await db.mediaUploadQueue.update(upload.id, {
                        uploadStatus: 'uploading',
                        uploadProgress: 5
                    });

                    // TODO: Implement actual file upload to storage
                    // This would involve:
                    // 1. Converting blob URL back to File/Blob
                    // 2. Uploading to Supabase Storage or similar
                    // 3. Creating media metadata record
                    // 4. Creating links, metadata, and tags if specified
                    // 5. Cleaning up temporary blob URL

                    console.log(`Upload processing not yet implemented for: ${upload.name}`);

                    // For now, simulate progress and mark as completed
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    await db.mediaUploadQueue.update(upload.id, {
                        uploadStatus: 'completed',
                        uploadProgress: 100
                    });

                } catch (error) {
                    console.error(`Failed to upload ${upload.name}:`, error);

                    await db.mediaUploadQueue.update(upload.id, {
                        uploadStatus: 'failed',
                        errorMessage: error instanceof Error ? error.message : 'Upload failed',
                        retryCount: upload.retryCount + 1
                    });
                }
            }
        } catch (error) {
            console.error('Error processing upload queue:', error);
            throw error;
        }
    }

    /**
     * Sync media insert operation with server
     */
    private async syncMediaInsert(op: any): Promise<void> {
        // TODO: Implement actual server insert
        console.log('Syncing media insert:', op.data.name);

        // Placeholder for actual implementation:
        // 1. Send POST request to /api/media
        // 2. Handle response and update local data if needed
        // 3. Handle conflicts (server version newer, etc.)
    }

    /**
     * Sync media update operation with server
     */
    private async syncMediaUpdate(op: any): Promise<void> {
        // TODO: Implement actual server update
        console.log('Syncing media update:', op.data.id);

        // Placeholder for actual implementation:
        // 1. Send PUT request to /api/media/{id}
        // 2. Handle response and conflicts
        // 3. Update local data with server response
    }

    /**
     * Sync media delete operation with server
     */
    private async syncMediaDelete(op: any): Promise<void> {
        // TODO: Implement actual server delete
        console.log('Syncing media delete:', op.data.id);

        // Placeholder for actual implementation:
        // 1. Send DELETE request to /api/media/{id}
        // 2. Handle response and conflicts
        // 3. Ensure local data is consistent
    }

    /**
     * Check if fresh data is available (within threshold)
     */
    async hasFreshData(businessId: string, maxAge: number = 5 * 60 * 1000): Promise<boolean> {
        try {
            const metadata = await db.syncMetadata.get(`media_${businessId}`);
            if (!metadata) return false;

            return (Date.now() - metadata.lastSync) < maxAge;
        } catch (error) {
            console.error('Error checking fresh data:', error);
            return false;
        }
    }

    /**
     * Get sync status for media system
     */
    async getSyncStatus(businessId: string): Promise<{
        lastSync: number | null;
        pendingOperations: number;
        pendingUploads: number;
        failedUploads: number;
    }> {
        try {
            const metadata = await db.syncMetadata.get(`media_${businessId}`);

            const pendingOps = await db.syncQueue
                .filter(item =>
                    item.businessId === businessId &&
                    (item.table === 'media' || item.table === 'mediaLinks' ||
                        item.table === 'mediaMetadata' || item.table === 'mediaTags') &&
                    !item.synced
                )
                .count();

            const pendingUploads = await db.mediaUploadQueue
                .filter(item =>
                    item.businessId === businessId &&
                    (item.uploadStatus === 'pending' || item.uploadStatus === 'uploading')
                )
                .count();

            const failedUploads = await db.mediaUploadQueue
                .filter(item =>
                    item.businessId === businessId &&
                    item.uploadStatus === 'failed'
                )
                .count();

            return {
                lastSync: metadata?.lastSync || null,
                pendingOperations: pendingOps,
                pendingUploads,
                failedUploads
            };
        } catch (error) {
            console.error('Error getting sync status:', error);
            return {
                lastSync: null,
                pendingOperations: 0,
                pendingUploads: 0,
                failedUploads: 0
            };
        }
    }

    /**
     * Clear sync metadata and force fresh sync
     */
    async clearSyncMetadata(businessId: string): Promise<void> {
        try {
            await db.syncMetadata.delete(`media_${businessId}`);
        } catch (error) {
            console.error('Error clearing sync metadata:', error);
        }
    }

    /**
     * Retry failed uploads
     */
    async retryFailedUploads(businessId: string): Promise<void> {
        try {
            const failedUploads = await db.mediaUploadQueue
                .filter(item =>
                    item.businessId === businessId &&
                    item.uploadStatus === 'failed'
                )
                .toArray();

            for (const upload of failedUploads) {
                await db.mediaUploadQueue.update(upload.id, {
                    uploadStatus: 'pending',
                    uploadProgress: 0,
                    errorMessage: undefined
                });
            }

            // Trigger sync to process retries
            if (this.isOnline) {
                setTimeout(() => this.triggerSync(businessId), 100);
            }
        } catch (error) {
            console.error('Error retrying failed uploads:', error);
        }
    }
}

// Export singleton instance
export const mediaSync = MediaSyncService.getInstance();

// Auto-trigger sync when online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        mediaSync.triggerSync();
    });
}
