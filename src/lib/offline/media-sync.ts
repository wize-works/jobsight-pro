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

            // Fetch fresh data from server to update local cache
            try {
                const response = await fetch(`/api/media?limit=1000`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverData = await response.json();

                    if (serverData.success && serverData.data && Array.isArray(serverData.data)) {
                        // Update local cache with fresh server data
                        await db.media.bulkPut(serverData.data);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `media_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'media'
                        });

                        console.log(`Successfully synced ${serverData.data.length} media records from server`);
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch fresh media data from server:', error);
                // Continue with local operations even if server sync fails
            }

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
                    // Implement actual server sync for media links
                    console.log(`Processing media link operation: ${op.operation}`, { id: op.id, businessId: op.businessId });

                    if (op.operation === 'insert') {
                        // Create new media link via API
                        const response = await fetch('/api/media-links', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(op.data)
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to sync media link insert: ${response.statusText}`);
                        }

                        const result = await response.json();
                        if (!result.success) {
                            throw new Error(result.error || 'Failed to sync media link insert');
                        }

                    } else if (op.operation === 'update') {
                        // Update existing media link via API (if needed)
                        const response = await fetch('/api/media-links', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(op.data)
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to sync media link update: ${response.statusText}`);
                        }

                    } else if (op.operation === 'delete') {
                        // Delete media link via API (if API supports it)
                        console.log('Media link delete operation - skipping for now');
                    }

                    // Mark as synced
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
                    // Implement actual server sync for media metadata
                    console.log(`Processing media metadata operation: ${op.operation}`, { id: op.id, businessId: op.businessId });

                    if (op.operation === 'insert') {
                        // Create new media metadata via API
                        const response = await fetch('/api/media-metadata', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(op.data)
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to sync media metadata insert: ${response.statusText}`);
                        }

                        const result = await response.json();
                        if (!result.success) {
                            throw new Error(result.error || 'Failed to sync media metadata insert');
                        }

                    } else if (op.operation === 'update') {
                        // Update existing media metadata via API
                        const response = await fetch('/api/media-metadata', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(op.data)
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to sync media metadata update: ${response.statusText}`);
                        }

                        const result = await response.json();
                        if (!result.success) {
                            throw new Error(result.error || 'Failed to sync media metadata update');
                        }

                    } else if (op.operation === 'delete') {
                        // Delete media metadata via API
                        const response = await fetch(`/api/media-metadata?id=${op.data.id}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to sync media metadata delete: ${response.statusText}`);
                        }
                    }

                    // Mark as synced
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
                    // Implement actual server sync for media tags
                    console.log(`Processing media tag operation: ${op.operation}`, { id: op.id, businessId: op.businessId });

                    if (op.operation === 'insert') {
                        // Create new media tag via API
                        const response = await fetch('/api/media-tags', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(op.data)
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to sync media tag insert: ${response.statusText}`);
                        }

                        const result = await response.json();
                        if (!result.success) {
                            throw new Error(result.error || 'Failed to sync media tag insert');
                        }

                    } else if (op.operation === 'update') {
                        // Update existing media tag via API
                        const response = await fetch('/api/media-tags', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(op.data)
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to sync media tag update: ${response.statusText}`);
                        }

                        const result = await response.json();
                        if (!result.success) {
                            throw new Error(result.error || 'Failed to sync media tag update');
                        }

                    } else if (op.operation === 'delete') {
                        // Delete media tag via API
                        const response = await fetch(`/api/media-tags?id=${op.data.id}`, {
                            method: 'DELETE'
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to sync media tag delete: ${response.statusText}`);
                        }
                    }

                    // Mark as synced
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

                    // Implement actual file upload to storage
                    console.log(`Uploading file: ${upload.name} for business ${businessId}`);

                    // Convert blob URL back to File/Blob for upload
                    const response = await fetch(upload.tempBlobUrl);
                    const blob = await response.blob();
                    const file = new File([blob], upload.name, { type: upload.type });

                    // Update progress
                    await db.mediaUploadQueue.update(upload.id, { uploadProgress: 20 });

                    // 1. Get upload URL from Azure storage
                    const uploadUrlResponse = await fetch('/api/media/upload-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: upload.type.startsWith('image/') ? 'images' :
                                upload.type.startsWith('video/') ? 'videos' :
                                    upload.type.startsWith('audio/') ? 'audios' : 'documents',
                            filename: upload.name
                        })
                    });

                    if (!uploadUrlResponse.ok) {
                        throw new Error('Failed to get upload URL');
                    }

                    const { data: uploadData } = await uploadUrlResponse.json();
                    await db.mediaUploadQueue.update(upload.id, { uploadProgress: 40 });

                    // 2. Upload file to Azure Blob Storage
                    const uploadResponse = await fetch(uploadData.uploadUrl, {
                        method: 'PUT',
                        body: file,
                        headers: {
                            'x-ms-blob-type': 'BlockBlob',
                            'Content-Type': upload.type,
                        },
                    });

                    if (!uploadResponse.ok) {
                        throw new Error(`File upload failed: ${uploadResponse.statusText}`);
                    }

                    await db.mediaUploadQueue.update(upload.id, { uploadProgress: 70 });

                    // 3. Create media metadata record
                    const mediaResponse = await fetch('/api/media', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: uploadData.fileUrl,
                            name: upload.name,
                            description: upload.description || `Uploaded via sync: ${upload.name}`,
                            type: upload.type.startsWith('image/') ? 'image' :
                                upload.type.startsWith('video/') ? 'video' :
                                    upload.type.startsWith('audio/') ? 'audio' : 'document',
                            size: upload.size,
                            project_id: upload.projectId || null,
                            uploaded_at: new Date().toISOString(),
                        })
                    });

                    if (!mediaResponse.ok) {
                        throw new Error('Failed to create media record');
                    }

                    const { data: media } = await mediaResponse.json();
                    await db.mediaUploadQueue.update(upload.id, { uploadProgress: 85 });

                    // 4. Create links if specified
                    if (upload.linkedId && upload.linkedType) {
                        await fetch('/api/media-links', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                media_id: media.id,
                                linked_id: upload.linkedId,
                                linked_type: upload.linkedType
                            })
                        });
                    }

                    // 5. Create metadata if specified
                    if (upload.metadata) {
                        for (const [key, value] of Object.entries(upload.metadata)) {
                            await fetch('/api/media-metadata', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    media_id: media.id,
                                    key,
                                    value: typeof value === 'string' ? value : JSON.stringify(value)
                                })
                            });
                        }
                    }

                    // 6. Create tags if specified
                    if (upload.tags && upload.tags.length > 0) {
                        for (const tag of upload.tags) {
                            await fetch('/api/media-tags', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    media_id: media.id,
                                    tag,
                                    category: 'user_defined'
                                })
                            });
                        }
                    }

                    // 7. Clean up temporary blob URL
                    URL.revokeObjectURL(upload.tempBlobUrl);

                    // Mark as completed
                    await db.mediaUploadQueue.update(upload.id, {
                        uploadStatus: 'completed',
                        uploadProgress: 100
                    });

                    console.log(`Successfully uploaded: ${upload.name}`);

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
        // Implement actual server insert
        console.log('Syncing media insert:', op.data.name || op.data.id);

        try {
            // Send POST request to /api/media
            const response = await fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(op.data)
            });

            if (!response.ok) {
                throw new Error(`Failed to sync media insert: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to sync media insert');
            }

            // Update local data with server response if needed
            if (result.data && result.data.id !== op.data.id) {
                // Server assigned new ID, update local record
                await db.media.update(op.data.id, { id: result.data.id });
            }

            console.log('Successfully synced media insert:', result.data?.name || op.data.name);

        } catch (error) {
            console.error('Error syncing media insert:', error);
            throw error;
        }
    }

    /**
     * Sync media update operation with server
     */
    private async syncMediaUpdate(op: any): Promise<void> {
        // Implement actual server update
        console.log('Syncing media update:', op.data.id);

        try {
            // Send PUT request to /api/media
            const response = await fetch('/api/media', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(op.data)
            });

            if (!response.ok) {
                throw new Error(`Failed to sync media update: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to sync media update');
            }

            // Update local data with server response
            if (result.data) {
                await db.media.put(result.data);
            }

            console.log('Successfully synced media update:', result.data?.name || op.data.id);

        } catch (error) {
            console.error('Error syncing media update:', error);
            throw error;
        }
    }

    /**
     * Sync media delete operation with server
     */
    private async syncMediaDelete(op: any): Promise<void> {
        // Implement actual server delete
        console.log('Syncing media delete:', op.data.id);

        try {
            // Send DELETE request to /api/media
            const response = await fetch(`/api/media?id=${op.data.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                // If resource already deleted on server (404), consider it successful
                if (response.status === 404) {
                    console.log('Media already deleted on server:', op.data.id);
                    return;
                }
                throw new Error(`Failed to sync media delete: ${response.statusText}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to sync media delete');
            }

            // Ensure local data is consistent - remove from local database
            await db.media.delete(op.data.id);

            console.log('Successfully synced media delete:', op.data.id);

        } catch (error) {
            console.error('Error syncing media delete:', error);
            throw error;
        }
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
