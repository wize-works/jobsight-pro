import { db } from './dexie-db';
import { createServerClient } from '@/lib/supabase';
import { Document, DocumentInsert, DocumentUpdate } from '@/types/documents';

/**
 * Document Sync Service
 * 
 * Handles bidirectional synchronization between local IndexedDB (Dexie) 
 * and remote Supabase database for document entities.
 * 
 * Features:
 * - Conflict resolution with last-write-wins strategy
 * - Retry logic for failed sync operations
 * - Efficient incremental sync
 * - Business-scoped operations for multi-tenancy
 */

interface SyncResult {
    success: boolean;
    itemsProcessed: number;
    errors: string[];
}

interface SyncStats {
    documentsUploaded: number;
    documentsDownloaded: number;
    conflictsResolved: number;
    errors: string[];
}

export class DocumentSyncService {
    private supabase = createServerClient();

    /**
     * Sync all document-related data for a business
     */
    async syncDocuments(businessId: string, userId: string): Promise<SyncStats> {
        const stats: SyncStats = {
            documentsUploaded: 0,
            documentsDownloaded: 0,
            conflictsResolved: 0,
            errors: []
        };

        if (!this.supabase) {
            stats.errors.push('Supabase client not available');
            return stats;
        }

        try {
            // Upload local changes first
            const uploadResult = await this.uploadPendingDocuments(businessId, userId);
            stats.documentsUploaded = uploadResult.itemsProcessed;
            stats.errors.push(...uploadResult.errors);

            // Download remote changes
            const downloadResult = await this.downloadDocuments(businessId);
            stats.documentsDownloaded = downloadResult.itemsProcessed;
            stats.errors.push(...downloadResult.errors);

            // Update sync metadata
            await this.updateSyncMetadata(businessId, 'documents');

        } catch (error) {
            console.error('Document sync error:', error);
            stats.errors.push(error instanceof Error ? error.message : 'Document sync failed');
        }

        return stats;
    }

    /**
     * Upload pending document changes to server
     */
    private async uploadPendingDocuments(businessId: string, userId: string): Promise<SyncResult> {
        const result: SyncResult = { success: true, itemsProcessed: 0, errors: [] };

        try {
            const pendingItems = await db.syncQueue
                .where('table').equals('documents')
                .and(item => item.businessId === businessId && !item.synced)
                .toArray();

            for (const item of pendingItems) {
                try {
                    let success = false;

                    switch (item.operation) {
                        case 'insert':
                            success = await this.uploadNewDocument(item.data as Document);
                            break;
                        case 'update':
                            success = await this.uploadDocumentUpdate(item.data as Document);
                            break;
                        case 'delete':
                            success = await this.uploadDocumentDeletion(item.data.id, businessId);
                            break;
                    }

                    if (success) {
                        // Mark as synced
                        await db.syncQueue.update(item.id, { synced: true });
                        result.itemsProcessed++;
                    } else {
                        // Increment retry count
                        await db.syncQueue.update(item.id, {
                            retryCount: item.retryCount + 1
                        });

                        // Remove if too many retries
                        if (item.retryCount >= 3) {
                            await db.syncQueue.delete(item.id);
                            result.errors.push(`Failed to sync document after 3 retries: ${item.data.id}`);
                        }
                    }
                } catch (error) {
                    console.error('Upload error for document item:', item, error);
                    result.errors.push(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        } catch (error) {
            result.success = false;
            result.errors.push(`Upload process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Download documents from server and merge with local data
     */
    private async downloadDocuments(businessId: string): Promise<SyncResult> {
        const result: SyncResult = { success: true, itemsProcessed: 0, errors: [] };

        try {
            if (!this.supabase) {
                throw new Error('Supabase client not available');
            }

            const { data: documents, error } = await this.supabase
                .from('documents')
                .select('*')
                .eq('business_id', businessId)
                .order('updated_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (!documents || documents.length === 0) {
                return result;
            }

            for (const serverDocument of documents) {
                try {
                    const localDocument = await db.documents
                        .where({ id: serverDocument.id, business_id: businessId })
                        .first();

                    if (!localDocument) {
                        // New document from server
                        await db.documents.add(serverDocument as Document);
                        result.itemsProcessed++;
                    } else {
                        // Check for conflicts and resolve
                        const conflict = await this.resolveDocumentConflict(localDocument, serverDocument as Document);
                        if (conflict.hasConflict) {
                            await db.documents.put(conflict.resolvedDocument);
                            result.itemsProcessed++;
                        }
                    }
                } catch (error) {
                    console.error('Download error for document:', serverDocument, error);
                    result.errors.push(`Download failed for document ${serverDocument.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        } catch (error) {
            result.success = false;
            result.errors.push(`Download process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return result;
    }

    /**
     * Upload new document to server
     */
    private async uploadNewDocument(document: Document): Promise<boolean> {
        try {
            if (!this.supabase) {
                throw new Error('Supabase client not available');
            }

            const { error } = await this.supabase
                .from('documents')
                .insert([document]);

            return !error;
        } catch (error) {
            console.error('Upload new document error:', error);
            return false;
        }
    }

    /**
     * Upload document update to server
     */
    private async uploadDocumentUpdate(document: Document): Promise<boolean> {
        try {
            if (!this.supabase) {
                throw new Error('Supabase client not available');
            }

            const { error } = await this.supabase
                .from('documents')
                .update(document)
                .eq('id', document.id)
                .eq('business_id', document.business_id);

            return !error;
        } catch (error) {
            console.error('Upload document update error:', error);
            return false;
        }
    }

    /**
     * Upload document deletion to server
     */
    private async uploadDocumentDeletion(documentId: string, businessId: string): Promise<boolean> {
        try {
            if (!this.supabase) {
                throw new Error('Supabase client not available');
            }

            const { error } = await this.supabase
                .from('documents')
                .delete()
                .eq('id', documentId)
                .eq('business_id', businessId);

            return !error;
        } catch (error) {
            console.error('Upload document deletion error:', error);
            return false;
        }
    }

    /**
     * Resolve conflicts between local and server documents
     */
    private async resolveDocumentConflict(
        localDocument: Document,
        serverDocument: Document
    ): Promise<{ hasConflict: boolean; resolvedDocument: Document }> {
        // Compare updated_at timestamps (last-write-wins strategy)
        const localUpdated = new Date(localDocument.updated_at || '').getTime();
        const serverUpdated = new Date(serverDocument.updated_at || '').getTime();

        if (serverUpdated > localUpdated) {
            // Server version is newer
            return {
                hasConflict: true,
                resolvedDocument: serverDocument
            };
        } else if (localUpdated > serverUpdated) {
            // Local version is newer - upload it
            await this.uploadDocumentUpdate(localDocument);
            return {
                hasConflict: false,
                resolvedDocument: localDocument
            };
        }

        // Same timestamp or no timestamp - no conflict
        return {
            hasConflict: false,
            resolvedDocument: localDocument
        };
    }

    /**
     * Update sync metadata to track last sync time
     */
    private async updateSyncMetadata(businessId: string, table: string): Promise<void> {
        try {
            const syncRecord = {
                id: `${businessId}-${table}`,
                businessId,
                table,
                lastSync: Date.now(),
                checksum: undefined
            };

            await db.syncMetadata.put(syncRecord);
        } catch (error) {
            console.error('Failed to update sync metadata:', error);
        }
    }

    /**
     * Get last sync time for documents
     */
    async getLastSyncTime(businessId: string): Promise<number | null> {
        try {
            const metadata = await db.syncMetadata
                .where(['businessId', 'table'])
                .equals([businessId, 'documents'])
                .first();

            return metadata?.lastSync || null;
        } catch (error) {
            console.error('Failed to get last sync time:', error);
            return null;
        }
    }

    /**
     * Check if there are pending document sync operations
     */
    async hasPendingOperations(businessId: string): Promise<boolean> {
        try {
            const pendingCount = await db.syncQueue
                .where('table').equals('documents')
                .and(item => item.businessId === businessId && !item.synced)
                .count();

            return pendingCount > 0;
        } catch (error) {
            console.error('Failed to check pending operations:', error);
            return false;
        }
    }

    /**
     * Force full sync (clear local cache and re-download)
     */
    async forceFullSync(businessId: string, userId: string): Promise<SyncStats> {
        try {
            // Clear local documents
            await db.documents.where({ business_id: businessId }).delete();

            // Clear sync metadata
            await db.syncMetadata
                .where(['businessId', 'table'])
                .equals([businessId, 'documents'])
                .delete();

            // Perform fresh sync
            return await this.syncDocuments(businessId, userId);
        } catch (error) {
            console.error('Force full sync error:', error);
            return {
                documentsUploaded: 0,
                documentsDownloaded: 0,
                conflictsResolved: 0,
                errors: [error instanceof Error ? error.message : 'Force sync failed']
            };
        }
    }

    /**
     * Get sync status and statistics
     */
    async getSyncStatus(businessId: string): Promise<{
        lastSyncTime: number | null;
        pendingOperations: number;
        localDocumentCount: number;
        isOnline: boolean;
    }> {
        try {
            const [lastSyncTime, pendingCount, localCount] = await Promise.all([
                this.getLastSyncTime(businessId),
                db.syncQueue
                    .where('table').equals('documents')
                    .and(item => item.businessId === businessId && !item.synced)
                    .count(),
                db.documents.where({ business_id: businessId }).count()
            ]);

            return {
                lastSyncTime,
                pendingOperations: pendingCount,
                localDocumentCount: localCount,
                isOnline: navigator.onLine
            };
        } catch (error) {
            console.error('Failed to get sync status:', error);
            return {
                lastSyncTime: null,
                pendingOperations: 0,
                localDocumentCount: 0,
                isOnline: navigator.onLine
            };
        }
    }
}

// Export singleton instance
export const documentSyncService = new DocumentSyncService();
