/**
 * Client-Side Media Actions
 * 
 * Replaces src/app/actions/media.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 * 
 * Special handling for file uploads - files are cached locally and uploaded during sync.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for media
type Media = Database['public']['Tables']['media']['Row'];
type MediaInsert = Database['public']['Tables']['media']['Insert'];
type MediaUpdate = Partial<Database['public']['Tables']['media']['Update']>;

// Media links for associating media with entities
type MediaLink = Database['public']['Tables']['media_links']['Row'];
type MediaLinkInsert = Database['public']['Tables']['media_links']['Insert'];

// Extended types for media with additional data
type MediaWithLinks = Media & {
    linked_entities: Array<{
        linked_type: string;
        linked_id: string;
        entity_name?: string;
    }>;
};

// Create client-side media actions
const insertMedia = createInsertAction('media', 'medium');
const updateMedia = createUpdateAction('media', 'medium');
const deleteMedia = createDeleteAction('media', 'low');
const selectMedia = createSelectAction('media');

// Media links actions
const insertMediaLink = createInsertAction('media_links', 'medium');
const deleteMediaLink = createDeleteAction('media_links', 'low');
const selectMediaLinks = createSelectAction('media_links');

/**
 * Get all media for a business - works offline
 */
export const getMedia = async (businessId: string): Promise<Media[]> => {
    try {
        const result = await selectMedia({}, businessId);

        if (result.error) {
            console.error("Error fetching media:", result.error);
            return [];
        }

        let media = (result.data || []) as Media[];

        // Filter by business
        media = media.filter(m => m.business_id === businessId);

        // Sort by upload date, newest first
        return media.sort((a, b) =>
            new Date(b.uploaded_at || b.created_at || 0).getTime() -
            new Date(a.uploaded_at || a.created_at || 0).getTime()
        );
    } catch (err) {
        console.error("Error in getMedia:", err);
        return [];
    }
};

/**
 * Get media by ID - works offline
 */
export const getMediaById = async (businessId: string, id: string): Promise<Media | null> => {
    try {
        const media = await getMedia(businessId);
        const mediaItem = media.find(m => m.id === id);

        if (!mediaItem) {
            console.warn(`Media with ID ${id} not found`);
            return null;
        }

        return mediaItem;
    } catch (err) {
        console.error("Error in getMediaById:", err);
        return null;
    }
};

/**
 * Create new media record - works offline with optimistic updates
 * NOTE: File upload will be queued for sync when online
 */
export const createMedia = async (
    data: MediaInsert,
    businessId: string,
    userId?: string
): Promise<{ data?: Media; error?: string }> => {
    try {
        // Ensure required fields
        const mediaData = {
            ...data,
            id: data.id || uuidv4(),
            business_id: businessId,
            uploaded_by: userId || data.uploaded_by,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId || data.created_by,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by,
        };

        const result = await insertMedia(mediaData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Media };
    } catch (err) {
        console.error("Error in createMedia:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update media - works offline with optimistic updates
 */
export const updateMediaById = async (
    id: string,
    data: MediaUpdate,
    businessId: string,
    userId?: string
): Promise<{ data?: Media; error?: string }> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
            updated_by: userId || data.updated_by,
        };

        const result = await updateMedia(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Media };
    } catch (err) {
        console.error("Error in updateMediaById:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Delete media - works offline with optimistic updates
 */
export const deleteMediaById = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteMedia({ id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteMediaById:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get media by project - works offline
 */
export const getMediaByProject = async (businessId: string, projectId: string): Promise<Media[]> => {
    try {
        const media = await getMedia(businessId);
        return media.filter(m => m.project_id === projectId);
    } catch (err) {
        console.error("Error in getMediaByProject:", err);
        return [];
    }
};

/**
 * Get media by type - works offline
 */
export const getMediaByType = async (businessId: string, type: string): Promise<Media[]> => {
    try {
        const media = await getMedia(businessId);
        return media.filter(m => m.type === type);
    } catch (err) {
        console.error("Error in getMediaByType:", err);
        return [];
    }
};

/**
 * Get media by entity (via media_links) - works offline
 */
export const getMediaByEntity = async (
    businessId: string,
    entityType: string,
    entityId: string
): Promise<Media[]> => {
    try {
        // Get media links for this entity
        const linksResult = await selectMediaLinks({}, businessId);
        if (linksResult.error) {
            console.error("Error fetching media links:", linksResult.error);
            return [];
        }

        const links = (linksResult.data || []) as MediaLink[];
        const entityLinks = links.filter(
            link => link.linked_type === entityType && link.linked_id === entityId
        );

        if (entityLinks.length === 0) {
            return [];
        }

        // Get media items for these links
        const media = await getMedia(businessId);
        const linkedMediaIds = entityLinks.map(link => link.media_id);

        return media.filter(m => linkedMediaIds.includes(m.id));
    } catch (err) {
        console.error("Error in getMediaByEntity:", err);
        return [];
    }
};

/**
 * Link media to an entity - works offline
 */
export const linkMediaToEntity = async (
    mediaId: string,
    entityType: string,
    entityId: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const linkData: MediaLinkInsert = {
            id: uuidv4(),
            business_id: businessId,
            media_id: mediaId,
            linked_type: entityType,
            linked_id: entityId,
            created_at: new Date().toISOString(),
            created_by: userId || null,
            updated_at: new Date().toISOString(),
            updated_by: userId || null,
        };

        const result = await insertMediaLink(linkData, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in linkMediaToEntity:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Unlink media from an entity - works offline
 */
export const unlinkMediaFromEntity = async (
    mediaId: string,
    entityType: string,
    entityId: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Find the specific link to delete
        const linksResult = await selectMediaLinks({}, businessId);
        if (linksResult.error) {
            return { success: false, error: linksResult.error };
        }

        const links = (linksResult.data || []) as MediaLink[];
        const linkToDelete = links.find(
            link => link.media_id === mediaId &&
                link.linked_type === entityType &&
                link.linked_id === entityId
        );

        if (!linkToDelete) {
            return { success: false, error: "Media link not found" };
        }

        const result = await deleteMediaLink({ id: linkToDelete.id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in unlinkMediaFromEntity:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get media with linked entities - works offline
 */
export const getMediaWithLinks = async (businessId: string): Promise<MediaWithLinks[]> => {
    try {
        const media = await getMedia(businessId);
        const linksResult = await selectMediaLinks({}, businessId);

        if (linksResult.error) {
            console.error("Error fetching media links:", linksResult.error);
            return media.map(m => ({ ...m, linked_entities: [] }));
        }

        const links = (linksResult.data || []) as MediaLink[];

        return media.map(mediaItem => {
            const mediaLinks = links.filter(link => link.media_id === mediaItem.id);

            return {
                ...mediaItem,
                linked_entities: mediaLinks.map(link => ({
                    linked_type: link.linked_type,
                    linked_id: link.linked_id,
                    entity_name: "Loading..." // TODO: Implement entity name lookup
                }))
            };
        });
    } catch (err) {
        console.error("Error in getMediaWithLinks:", err);
        return [];
    }
};

/**
 * Check if media operations are pending sync
 */
export const getMediaSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending media operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0,
        pendingUploads: 0 // Count of files waiting to upload
    };
};

// Export compatibility functions for existing code
export {
    getMedia as default,
    createMedia as insertMedia,
    updateMediaById as updateMedia,
    deleteMediaById as deleteMedia
};
