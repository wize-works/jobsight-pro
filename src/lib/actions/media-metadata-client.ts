/**
 * Client-Side Media Metadata Actions
 * 
 * Replaces src/app/actions/media-metadata.ts with offline-first implementation.
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

// Extract Supabase types for media metadata
type MediaMetadata = Database['public']['Tables']['media_metadata']['Row'];
type MediaMetadataInsert = Database['public']['Tables']['media_metadata']['Insert'];
type MediaMetadataUpdate = Database['public']['Tables']['media_metadata']['Update'];

// Create client-side media metadata actions
const insertMediaMetadata = createInsertAction('media_metadata', 'medium');
const updateMediaMetadata = createUpdateAction('media_metadata', 'medium');
const deleteMediaMetadata = createDeleteAction('media_metadata', 'medium');
const selectMediaMetadata = createSelectAction('media_metadata');

/**
 * Get all media metadata for a business - works offline
 */
export const getMediaMetadata = async (businessId: string, mediaId?: string): Promise<MediaMetadata[]> => {
    try {
        const result = await selectMediaMetadata({}, businessId);

        if (result.error) {
            console.error("Error fetching media metadata:", result.error);
            return [];
        }

        let metadata = (result.data || []) as MediaMetadata[];

        // Filter by media_id if provided
        if (mediaId) {
            metadata = metadata.filter(meta => meta.media_id === mediaId);
        }

        return metadata;
    } catch (err) {
        console.error("Error in getMediaMetadata:", err);
        return [];
    }
};

/**
 * Create new media metadata - works offline
 */
export const createMediaMetadata = async (data: MediaMetadataInsert): Promise<MediaMetadata | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for media metadata');
        }

        const metadataData = {
            ...data,
            id: data.id || uuidv4(),
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertMediaMetadata(metadataData, data.business_id);

        if (result.error) {
            console.error("Error creating media metadata:", result.error);
            return null;
        }

        return result.data as MediaMetadata;
    } catch (err) {
        console.error("Error in createMediaMetadata:", err);
        return null;
    }
};

/**
 * Update media metadata - works offline
 */
export const updateMediaMetadataById = async (id: string, data: MediaMetadataUpdate, businessId: string): Promise<MediaMetadata | null> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateMediaMetadata(updateData, businessId);

        if (result.error) {
            console.error("Error updating media metadata:", result.error);
            return null;
        }

        return result.data as MediaMetadata;
    } catch (err) {
        console.error("Error in updateMediaMetadataById:", err);
        return null;
    }
};

/**
 * Delete media metadata - works offline
 */
export const removeMediaMetadata = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteMediaMetadata({ id }, businessId);

        if (result.error) {
            console.error("Error deleting media metadata:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeMediaMetadata:", err);
        return false;
    }
};

/**
 * Get media metadata by ID - works offline
 */
export const getMediaMetadataById = async (id: string, businessId: string): Promise<MediaMetadata | null> => {
    try {
        const metadata = await getMediaMetadata(businessId);
        return metadata.find(meta => meta.id === id) || null;
    } catch (err) {
        console.error("Error in getMediaMetadataById:", err);
        return null;
    }
};

/**
 * Get metadata by key for specific media - works offline
 */
export const getMediaMetadataByKey = async (businessId: string, mediaId: string, key: string): Promise<MediaMetadata | null> => {
    try {
        const metadata = await getMediaMetadata(businessId, mediaId);
        return metadata.find(meta => meta.key === key) || null;
    } catch (err) {
        console.error("Error in getMediaMetadataByKey:", err);
        return null;
    }
};

/**
 * Set or update metadata value for specific media and key - works offline
 */
export const setMediaMetadata = async (businessId: string, mediaId: string, key: string, value: string | null): Promise<MediaMetadata | null> => {
    try {
        // Check if metadata already exists
        const existing = await getMediaMetadataByKey(businessId, mediaId, key);

        if (existing) {
            // Update existing metadata
            return await updateMediaMetadataById(existing.id, { value }, businessId);
        } else {
            // Create new metadata
            return await createMediaMetadata({
                id: uuidv4(),
                business_id: businessId,
                media_id: mediaId,
                key,
                value,
            });
        }
    } catch (err) {
        console.error("Error in setMediaMetadata:", err);
        return null;
    }
};

// Bulk operations for media metadata
export const createMultipleMediaMetadata = async (metadataList: MediaMetadataInsert[]): Promise<MediaMetadata[]> => {
    const results: MediaMetadata[] = [];
    for (const metadata of metadataList) {
        try {
            const result = await createMediaMetadata(metadata);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            console.error('Error creating media metadata:', error);
        }
    }
    return results;
};

export const deleteMediaMetadataByMediaId = async (businessId: string, mediaId: string): Promise<boolean[]> => {
    const metadata = await getMediaMetadata(businessId, mediaId);
    const deletePromises = metadata.map(meta => removeMediaMetadata(meta.id, businessId));
    return await Promise.all(deletePromises);
};

// Get all metadata as key-value pairs for a specific media
export const getMediaMetadataAsObject = async (businessId: string, mediaId: string): Promise<Record<string, string | null>> => {
    try {
        const metadata = await getMediaMetadata(businessId, mediaId);
        const result: Record<string, string | null> = {};
        metadata.forEach(meta => {
            result[meta.key] = meta.value;
        });
        return result;
    } catch (error) {
        console.error('Failed to get metadata as object:', error);
        return {};
    }
};

// Get unique metadata keys for a business
export const getUniqueMetadataKeys = async (businessId: string): Promise<string[]> => {
    try {
        const metadata = await getMediaMetadata(businessId);
        const uniqueKeys = [...new Set(metadata.map(meta => meta.key))];
        return uniqueKeys;
    } catch (error) {
        console.error('Failed to get unique metadata keys:', error);
        return [];
    }
};

// Search media by metadata key-value pairs
export const searchMediaByMetadata = async (businessId: string, searchCriteria: Record<string, string>): Promise<string[]> => {
    try {
        const metadata = await getMediaMetadata(businessId);
        const matchingMediaIds = new Set<string>();

        Object.entries(searchCriteria).forEach(([key, value]) => {
            metadata
                .filter(meta => meta.key === key && meta.value === value)
                .forEach(meta => matchingMediaIds.add(meta.media_id));
        });

        return Array.from(matchingMediaIds);
    } catch (error) {
        console.error('Failed to search media by metadata:', error);
        return [];
    }
};

// Export compatibility functions for existing code
export {
    getMediaMetadata as getAllMediaMetadata,
    createMediaMetadata as addMediaMetadata,
    removeMediaMetadata as deleteMediaMetadata,
    getMediaMetadataById as fetchMediaMetadata,
};
