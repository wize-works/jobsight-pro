/**
 * Client-Side Media Tags Actions
 * 
 * Replaces src/app/actions/media-tags.ts with offline-first implementation.
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

// Extract Supabase types for media tags
type MediaTag = Database['public']['Tables']['media_tags']['Row'];
type MediaTagInsert = Database['public']['Tables']['media_tags']['Insert'];
type MediaTagUpdate = Database['public']['Tables']['media_tags']['Update'];

// Create client-side media tag actions
const insertMediaTag = createInsertAction('media_tags', 'medium');
const updateMediaTag = createUpdateAction('media_tags', 'medium');
const deleteMediaTag = createDeleteAction('media_tags', 'medium');
const selectMediaTags = createSelectAction('media_tags');

/**
 * Get all media tags for a business - works offline
 */
export const getMediaTags = async (businessId: string, mediaId?: string): Promise<MediaTag[]> => {
    try {
        const result = await selectMediaTags({}, businessId);

        if (result.error) {
            console.error("Error fetching media tags:", result.error);
            return [];
        }

        let tags = (result.data || []) as MediaTag[];

        // Filter by media_id if provided
        if (mediaId) {
            tags = tags.filter(tag => tag.media_id === mediaId);
        }

        return tags;
    } catch (err) {
        console.error("Error in getMediaTags:", err);
        return [];
    }
};

/**
 * Create a new media tag - works offline
 */
export const createMediaTag = async (data: MediaTagInsert): Promise<MediaTag | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for media tag');
        }

        const mediaTagData = {
            ...data,
            id: data.id || uuidv4(),
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertMediaTag(mediaTagData, data.business_id);

        if (result.error) {
            console.error("Error creating media tag:", result.error);
            return null;
        }

        return result.data as MediaTag;
    } catch (err) {
        console.error("Error in createMediaTag:", err);
        return null;
    }
};

/**
 * Update a media tag - works offline
 */
export const updateMediaTagById = async (id: string, data: MediaTagUpdate, businessId: string): Promise<MediaTag | null> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateMediaTag(updateData, businessId);

        if (result.error) {
            console.error("Error updating media tag:", result.error);
            return null;
        }

        return result.data as MediaTag;
    } catch (err) {
        console.error("Error in updateMediaTagById:", err);
        return null;
    }
};

/**
 * Delete a media tag - works offline
 */
export const removeMediaTag = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteMediaTag({ id }, businessId);

        if (result.error) {
            console.error("Error deleting media tag:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeMediaTag:", err);
        return false;
    }
};

/**
 * Get a media tag by ID - works offline
 */
export const getMediaTagById = async (id: string, businessId: string): Promise<MediaTag | null> => {
    try {
        const tags = await getMediaTags(businessId);
        return tags.find(tag => tag.id === id) || null;
    } catch (err) {
        console.error("Error in getMediaTagById:", err);
        return null;
    }
};

// Bulk operations for media tags
export const createMultipleMediaTags = async (tags: MediaTagInsert[]): Promise<MediaTag[]> => {
    const results: MediaTag[] = [];
    for (const tag of tags) {
        try {
            const result = await createMediaTag(tag);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            console.error('Error creating media tag:', error);
        }
    }
    return results;
};

export const deleteMediaTagsByMediaId = async (businessId: string, mediaId: string): Promise<boolean[]> => {
    const tags = await getMediaTags(businessId, mediaId);
    const deletePromises = tags.map(tag => removeMediaTag(tag.id, businessId));
    return await Promise.all(deletePromises);
};

// Get unique tags for a business
export const getUniqueTagsForBusiness = async (businessId: string): Promise<string[]> => {
    try {
        const tags = await getMediaTags(businessId);
        const uniqueTags = [...new Set(tags.map(tag => tag.tag))];
        return uniqueTags;
    } catch (error) {
        console.error('Failed to get tags:', error);
        return [];
    }
};

// Search media by tags
export const searchMediaByTags = async (businessId: string, searchTags: string[]): Promise<string[]> => {
    try {
        const tags = await getMediaTags(businessId);
        const mediaIds = tags
            .filter(tag => searchTags.includes(tag.tag))
            .map(tag => tag.media_id);
        const uniqueMediaIds = [...new Set(mediaIds)];
        return uniqueMediaIds;
    } catch (error) {
        console.error('Failed to search media by tags:', error);
        return [];
    }
};

// Analytics functions
export const getTagUsageStats = async (businessId: string): Promise<Array<{ tag: string; count: number }>> => {
    try {
        const tags = await getMediaTags(businessId);
        const tagCounts: Record<string, number> = {};
        tags.forEach(tag => {
            tagCounts[tag.tag] = (tagCounts[tag.tag] || 0) + 1;
        });

        const sortedTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([tag, count]) => ({ tag, count }));

        return sortedTags;
    } catch (error) {
        console.error('Failed to get tag usage stats:', error);
        return [];
    }
};

// Export compatibility functions for existing code
export {
    getMediaTags as getAllMediaTags,
    createMediaTag as addMediaTag,
    removeMediaTag as deleteMediaTag,
    getMediaTagById as fetchMediaTag,
};
