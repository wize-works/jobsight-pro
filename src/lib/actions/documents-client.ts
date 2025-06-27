/**
 * Client-Side Documents Actions
 * 
 * Replaces src/app/actions/documents.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from '@/types/supabase';
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from './client-action-factory';
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for documents
type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

// Create client-side document actions
const insertDocument = createInsertAction('documents', 'medium');
const updateDocument = createUpdateAction('documents', 'medium');
const deleteDocument = createDeleteAction('documents', 'medium');
const selectDocuments = createSelectAction('documents');

/**
 * Get all documents for a business - works offline
 */
export const getDocuments = async (businessId: string, projectId?: string): Promise<Document[]> => {
    try {
        const result = await selectDocuments({}, businessId);

        if (result.error) {
            console.error("Error fetching documents:", result.error);
            return [];
        }

        let documents = (result.data || []) as Document[];

        // Filter by project_id if provided
        if (projectId) {
            documents = documents.filter(doc => doc.project_id === projectId);
        }

        return documents;
    } catch (err) {
        console.error("Error in getDocuments:", err);
        return [];
    }
};

/**
 * Create a new document - works offline
 */
export const createDocument = async (data: DocumentInsert): Promise<Document | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for document');
        }

        const documentData = {
            ...data,
            id: data.id || uuidv4(),
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertDocument(documentData, data.business_id);

        if (result.error) {
            console.error("Error creating document:", result.error);
            return null;
        }

        return result.data as Document;
    } catch (err) {
        console.error("Error in createDocument:", err);
        return null;
    }
};

/**
 * Update a document - works offline
 */
export const updateDocumentById = async (id: string, data: Partial<DocumentUpdate>, businessId: string): Promise<Document | null> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateDocument(updateData, businessId);

        if (result.error) {
            console.error("Error updating document:", result.error);
            return null;
        }

        return result.data as Document;
    } catch (err) {
        console.error("Error in updateDocumentById:", err);
        return null;
    }
};

/**
 * Delete a document - works offline
 */
export const removeDocument = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteDocument({ id }, businessId);

        if (result.error) {
            console.error("Error deleting document:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeDocument:", err);
        return false;
    }
};

/**
 * Get a document by ID - works offline
 */
export const getDocumentById = async (id: string, businessId: string): Promise<Document | null> => {
    try {
        const documents = await getDocuments(businessId);
        return documents.find(doc => doc.id === id) || null;
    } catch (err) {
        console.error("Error in getDocumentById:", err);
        return null;
    }
};

/**
 * Get documents by project ID - works offline
 */
export const getDocumentsByProjectId = async (businessId: string, projectId: string): Promise<Document[]> => {
    return await getDocuments(businessId, projectId);
};

/**
 * Get documents by type - works offline
 */
export const getDocumentsByType = async (businessId: string, type: string): Promise<Document[]> => {
    try {
        const documents = await getDocuments(businessId);
        return documents.filter(doc => doc.type === type);
    } catch (err) {
        console.error("Error in getDocumentsByType:", err);
        return [];
    }
};

/**
 * Search documents by name - works offline
 */
export const searchDocumentsByName = async (businessId: string, searchTerm: string): Promise<Document[]> => {
    try {
        const documents = await getDocuments(businessId);
        const term = searchTerm.toLowerCase();
        return documents.filter(doc =>
            doc.name.toLowerCase().includes(term)
        );
    } catch (err) {
        console.error("Error in searchDocumentsByName:", err);
        return [];
    }
};

// Bulk operations for documents
export const createMultipleDocuments = async (documents: DocumentInsert[]): Promise<Document[]> => {
    const results: Document[] = [];
    for (const doc of documents) {
        try {
            const result = await createDocument(doc);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            console.error('Error creating document:', error);
        }
    }
    return results;
};

export const deleteDocumentsByProjectId = async (businessId: string, projectId: string): Promise<boolean[]> => {
    const documents = await getDocumentsByProjectId(businessId, projectId);
    const deletePromises = documents.map(doc => removeDocument(doc.id, businessId));
    return await Promise.all(deletePromises);
};

// Get document statistics for a business
export const getDocumentStats = async (businessId: string): Promise<{
    totalDocuments: number;
    totalSizeBytes: number;
    documentsByType: Record<string, number>;
    documentsByProject: Record<string, number>;
}> => {
    try {
        const documents = await getDocuments(businessId);

        const stats = {
            totalDocuments: documents.length,
            totalSizeBytes: documents.reduce((sum, doc) => sum + (doc.size || 0), 0),
            documentsByType: {} as Record<string, number>,
            documentsByProject: {} as Record<string, number>,
        };

        documents.forEach(doc => {
            // Count by type
            const type = doc.type || 'Unknown';
            stats.documentsByType[type] = (stats.documentsByType[type] || 0) + 1;

            // Count by project
            const projectId = doc.project_id || 'No Project';
            stats.documentsByProject[projectId] = (stats.documentsByProject[projectId] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error('Failed to get document stats:', error);
        return {
            totalDocuments: 0,
            totalSizeBytes: 0,
            documentsByType: {},
            documentsByProject: {},
        };
    }
};

// Get recent documents
export const getRecentDocuments = async (businessId: string, limit: number = 10): Promise<Document[]> => {
    try {
        const documents = await getDocuments(businessId);
        return documents
            .sort((a, b) => {
                const aDate = new Date(a.created_at || 0).getTime();
                const bDate = new Date(b.created_at || 0).getTime();
                return bDate - aDate;
            })
            .slice(0, limit);
    } catch (err) {
        console.error("Error in getRecentDocuments:", err);
        return [];
    }
};

// Get largest documents
export const getLargestDocuments = async (businessId: string, limit: number = 10): Promise<Document[]> => {
    try {
        const documents = await getDocuments(businessId);
        return documents
            .filter(doc => doc.size && doc.size > 0)
            .sort((a, b) => (b.size || 0) - (a.size || 0))
            .slice(0, limit);
    } catch (err) {
        console.error("Error in getLargestDocuments:", err);
        return [];
    }
};

// Export compatibility functions for existing code
export {
    getDocuments as getAllDocuments,
    createDocument as addDocument,
    removeDocument as deleteDocument,
    getDocumentById as fetchDocument,
};
