'use client';

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/offline/dexie-db';
import { useAuth } from '@clerk/nextjs';
import {
    Document,
    DocumentInsert,
    DocumentUpdate,
    DocumentWithDetails,
    DocumentSearchFilters,
    DocumentOperationResult,
    DocumentListResult
} from '@/types/documents';

/**
 * Offline-first Document Management Client Actions
 * 
 * This module provides offline-first document management functionality with:
 * - Local storage using IndexedDB (Dexie)
 * - Automatic sync queue for offline operations
 * - User-scoped access with Clerk authentication
 * - Rich document search and filtering
 * - File association with media entities
 * - Document versioning and conflict resolution
 */

// Hook to get current business context
function useBusinessContext() {
    const { userId } = useAuth();

    if (!userId) {
        throw new Error('User must be authenticated');
    }

    return { userId };
}

/**
 * Create a new document
 */
export async function createDocument(
    businessId: string,
    documentData: Omit<DocumentInsert, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
): Promise<DocumentOperationResult> {
    try {
        const { userId } = useBusinessContext();
        const now = new Date().toISOString();

        const document: Document = {
            id: uuidv4(),
            business_id: businessId,
            project_id: documentData.project_id,
            name: documentData.name,
            type: documentData.type,
            url: documentData.url,
            media_id: documentData.media_id,
            size: documentData.size,
            created_at: now,
            created_by: userId,
            updated_at: now,
            updated_by: userId
        };

        // Store locally
        await db.documents.add(document);

        // Add to sync queue
        await db.syncQueue.add({
            id: uuidv4(),
            table: 'documents',
            operation: 'insert',
            data: document,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, document };
    } catch (error) {
        console.error('Error creating document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create document'
        };
    }
}

/**
 * Update an existing document
 */
export async function updateDocument(
    businessId: string,
    documentId: string,
    updates: Partial<DocumentUpdate>
): Promise<DocumentOperationResult> {
    try {
        const { userId } = useBusinessContext();
        const now = new Date().toISOString();

        // Get existing document
        const existingDocument = await db.documents
            .where({ id: documentId, business_id: businessId })
            .first();

        if (!existingDocument) {
            return { success: false, error: 'Document not found' };
        }

        const updatedDocument: Document = {
            ...existingDocument,
            ...updates,
            updated_at: now,
            updated_by: userId
        };

        // Update locally
        await db.documents.put(updatedDocument);

        // Add to sync queue
        await db.syncQueue.add({
            id: uuidv4(),
            table: 'documents',
            operation: 'update',
            data: updatedDocument,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, document: updatedDocument };
    } catch (error) {
        console.error('Error updating document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update document'
        };
    }
}

/**
 * Delete a document
 */
export async function deleteDocument(
    businessId: string,
    documentId: string
): Promise<DocumentOperationResult> {
    try {
        const { userId } = useBusinessContext();

        // Check if document exists
        const document = await db.documents
            .where({ id: documentId, business_id: businessId })
            .first();

        if (!document) {
            return { success: false, error: 'Document not found' };
        }

        // Delete locally
        await db.documents.where({ id: documentId, business_id: businessId }).delete();

        // Add to sync queue
        await db.syncQueue.add({
            id: uuidv4(),
            table: 'documents',
            operation: 'delete',
            data: { id: documentId, business_id: businessId },
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete document'
        };
    }
}

/**
 * Get a document by ID
 */
export async function getDocumentById(
    businessId: string,
    documentId: string
): Promise<DocumentOperationResult> {
    try {
        const document = await db.documents
            .where({ id: documentId, business_id: businessId })
            .first();

        if (!document) {
            return { success: false, error: 'Document not found' };
        }

        return { success: true, document };
    } catch (error) {
        console.error('Error getting document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get document'
        };
    }
}

/**
 * Get all documents for a business with optional filtering
 */
export async function getDocuments(
    businessId: string,
    filters?: DocumentSearchFilters
): Promise<DocumentListResult> {
    try {
        let query = db.documents.where({ business_id: businessId });

        // Apply filters
        if (filters?.projectId) {
            query = query.and(doc => doc.project_id === filters.projectId);
        }

        if (filters?.type) {
            query = query.and(doc => doc.type === filters.type);
        }

        if (filters?.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            query = query.and(doc =>
                (doc.name ? doc.name.toLowerCase().includes(searchTerm) : false) ||
                (doc.type ? doc.type.toLowerCase().includes(searchTerm) : false)
            );
        }

        if (filters?.dateFrom) {
            query = query.and(doc => !!(doc.created_at && doc.created_at >= filters.dateFrom!));
        }

        if (filters?.dateTo) {
            query = query.and(doc => !!(doc.created_at && doc.created_at <= filters.dateTo!));
        }

        let documents = await query.toArray();

        // Apply sorting
        if (filters?.sortBy) {
            const sortOrder = filters.sortOrder || 'desc';
            documents.sort((a, b) => {
                const aVal = a[filters.sortBy!];
                const bVal = b[filters.sortBy!];

                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return sortOrder === 'asc' ? comparison : -comparison;
            });
        } else {
            // Default sort by created_at desc
            documents.sort((a, b) => {
                const aDate = a.created_at || '';
                const bDate = b.created_at || '';
                return bDate.localeCompare(aDate);
            });
        }

        // Get enriched data
        const documentsWithDetails: DocumentWithDetails[] = await Promise.all(
            documents.map(async (doc) => {
                const enriched: DocumentWithDetails = { ...doc };

                // Get project name if project_id exists
                if (doc.project_id) {
                    const project = await db.projects.get(doc.project_id);
                    if (project) {
                        enriched.projectName = project.name;
                    }
                }

                // Get media file name if media_id exists
                if (doc.media_id) {
                    const media = await db.media.get(doc.media_id);
                    if (media && media.name) {
                        enriched.mediaFileName = media.name;
                    }
                }

                // Extract file extension from URL or name
                if (doc.url) {
                    const urlParts = doc.url.split('.');
                    if (urlParts.length > 1) {
                        enriched.fileExtension = urlParts.pop()?.toLowerCase();
                    }
                } else if (doc.name) {
                    const nameParts = doc.name.split('.');
                    if (nameParts.length > 1) {
                        enriched.fileExtension = nameParts.pop()?.toLowerCase();
                    }
                }

                // Format file size
                if (doc.size) {
                    enriched.sizeFormatted = formatFileSize(doc.size);
                }

                return enriched;
            })
        );

        return {
            success: true,
            documents: documentsWithDetails,
            total: documentsWithDetails.length
        };
    } catch (error) {
        console.error('Error getting documents:', error);
        return {
            success: false,
            documents: [],
            total: 0,
            error: error instanceof Error ? error.message : 'Failed to get documents'
        };
    }
}

/**
 * Get documents by project ID
 */
export async function getDocumentsByProject(
    businessId: string,
    projectId: string
): Promise<DocumentListResult> {
    return getDocuments(businessId, { projectId });
}

/**
 * Search documents with full-text search capabilities
 */
export async function searchDocuments(
    businessId: string,
    searchTerm: string,
    additionalFilters?: Omit<DocumentSearchFilters, 'searchTerm'>
): Promise<DocumentListResult> {
    if (!searchTerm.trim()) {
        return getDocuments(businessId, additionalFilters);
    }

    try {
        const filters: DocumentSearchFilters = {
            ...additionalFilters,
            searchTerm: searchTerm.trim()
        };

        return getDocuments(businessId, filters);
    } catch (error) {
        console.error('Error searching documents:', error);
        return {
            success: false,
            documents: [],
            total: 0,
            error: error instanceof Error ? error.message : 'Failed to search documents'
        };
    }
}

/**
 * Get document statistics for a business
 */
export async function getDocumentStats(businessId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byProject: Record<string, number>;
    totalSize: number;
    recentCount: number; // Last 7 days
}> {
    try {
        const documents = await db.documents
            .where({ business_id: businessId })
            .toArray();

        const stats = {
            total: documents.length,
            byType: {} as Record<string, number>,
            byProject: {} as Record<string, number>,
            totalSize: 0,
            recentCount: 0
        };

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        for (const doc of documents) {
            // Count by type
            if (doc.type) {
                stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
            }

            // Count by project
            if (doc.project_id) {
                stats.byProject[doc.project_id] = (stats.byProject[doc.project_id] || 0) + 1;
            }

            // Sum total size
            if (doc.size) {
                stats.totalSize += doc.size;
            }

            // Count recent documents
            if (doc.created_at && new Date(doc.created_at) > sevenDaysAgo) {
                stats.recentCount++;
            }
        }

        return stats;
    } catch (error) {
        console.error('Error getting document stats:', error);
        return {
            total: 0,
            byType: {},
            byProject: {},
            totalSize: 0,
            recentCount: 0
        };
    }
}

/**
 * Check if a document exists by name and project
 */
export async function documentExists(
    businessId: string,
    name: string,
    projectId?: string
): Promise<boolean> {
    try {
        let query = db.documents.where({ business_id: businessId, name });

        if (projectId) {
            query = query.and(doc => doc.project_id === projectId);
        }

        const existing = await query.first();
        return !!existing;
    } catch (error) {
        console.error('Error checking document existence:', error);
        return false;
    }
}

/**
 * Bulk import documents (for data migration or import scenarios)
 */
export async function bulkCreateDocuments(
    businessId: string,
    documents: Array<Omit<DocumentInsert, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
): Promise<DocumentOperationResult> {
    try {
        const { userId } = useBusinessContext();
        const now = new Date().toISOString();

        const documentsToCreate: Document[] = documents.map(doc => ({
            id: uuidv4(),
            business_id: businessId,
            project_id: doc.project_id,
            name: doc.name,
            type: doc.type,
            url: doc.url,
            media_id: doc.media_id,
            size: doc.size,
            created_at: now,
            created_by: userId,
            updated_at: now,
            updated_by: userId
        }));

        // Store locally
        await db.documents.bulkAdd(documentsToCreate);

        // Add to sync queue
        for (const document of documentsToCreate) {
            await db.syncQueue.add({
                id: uuidv4(),
                table: 'documents',
                operation: 'insert',
                data: document,
                businessId,
                userId,
                timestamp: Date.now(),
                retryCount: 0,
                synced: false
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error bulk creating documents:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to bulk create documents'
        };
    }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
