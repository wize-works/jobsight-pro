'use client';

import { revalidatePath } from 'next/cache';
import { db, BusinessOfflineManager } from '@/lib/offline/dexie-db';
import {
    MediaLink,
    MediaLinkInsert,
    MediaLinkUpdate,
    MediaMetadata,
    MediaMetadataInsert,
    MediaMetadataUpdate,
    MediaTag,
    MediaTagInsert,
    MediaTagUpdate
} from '@/types/media';

/**
 * Media Extensions Client Actions - Offline-First Implementation
 * 
 * This module handles media links, metadata, and tags operations with offline support.
 */

// Global auth state for client actions
let currentClerkUser: { id: string } | null = null;
let authStateInitialized = false;

// Initialize auth state (should be called from a React component that uses Clerk hooks)
export function initializeAuthState(clerkUser: { id: string } | null) {
    currentClerkUser = clerkUser;
    authStateInitialized = true;

    // Cache the auth_id for offline use
    if (typeof window !== 'undefined' && clerkUser?.id) {
        window.localStorage.setItem('cached_auth_id', clerkUser.id);
    } else if (typeof window !== 'undefined' && !clerkUser) {
        // Clear cached auth when user logs out
        window.localStorage.removeItem('cached_auth_id');
    }
}

// Get current auth_id (Clerk user ID)
function getCurrentAuthId(): string | null {
    if (currentClerkUser?.id) {
        return currentClerkUser.id;
    }

    // Fallback to cached auth_id for offline use
    if (typeof window !== 'undefined') {
        return window.localStorage.getItem('cached_auth_id');
    }

    return null;
}

// Generate unique IDs
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// =============================================================================
// MEDIA LINKS
// =============================================================================

/**
 * Create media link
 */
export async function createMediaLink(
    businessId: string,
    data: Omit<MediaLinkInsert, 'id' | 'business_id'>
): Promise<{ success: boolean; data?: MediaLink; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        const id = generateId();
        const now = new Date().toISOString();

        const newLink: MediaLink = {
            id,
            business_id: businessId,
            media_id: data.media_id,
            linked_id: data.linked_id,
            linked_type: data.linked_type,
            created_at: now,
            created_by: authId,
            updated_at: null,
            updated_by: null
        };

        // Store in offline database
        await db.mediaLinks.add(newLink);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'mediaLinks',
            'insert',
            newLink,
            businessId,
            authId
        );

        return { success: true, data: newLink };
    } catch (error) {
        console.error('Error creating media link:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create media link'
        };
    }
}

/**
 * Get media links for a specific media item
 */
export async function getMediaLinks(
    businessId: string,
    mediaId: string
): Promise<{ success: boolean; data?: MediaLink[]; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        const links = await db.mediaLinks
            .filter(link => link.business_id === businessId && link.media_id === mediaId)
            .toArray();

        return { success: true, data: links };
    } catch (error) {
        console.error('Error getting media links:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get media links'
        };
    }
}

/**
 * Get media links for a specific linked entity
 */
export async function getLinkedMedia(
    businessId: string,
    linkedId: string,
    linkedType: string
): Promise<{ success: boolean; data?: MediaLink[]; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        const links = await db.mediaLinks
            .filter(link =>
                link.business_id === businessId &&
                link.linked_id === linkedId &&
                link.linked_type === linkedType
            )
            .toArray();

        return { success: true, data: links };
    } catch (error) {
        console.error('Error getting linked media:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get linked media'
        };
    }
}

/**
 * Delete media link
 */
export async function deleteMediaLink(
    businessId: string,
    linkId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        // Check if link exists and belongs to business
        const link = await db.mediaLinks.get(linkId);
        if (!link || link.business_id !== businessId) {
            return { success: false, error: 'Media link not found' };
        }

        // Delete from offline database
        await db.mediaLinks.delete(linkId);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'mediaLinks',
            'delete',
            { id: linkId },
            businessId,
            authId
        );

        return { success: true };
    } catch (error) {
        console.error('Error deleting media link:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete media link'
        };
    }
}

// =============================================================================
// MEDIA METADATA
// =============================================================================

/**
 * Create media metadata
 */
export async function createMediaMetadata(
    businessId: string,
    data: Omit<MediaMetadataInsert, 'id' | 'business_id'>
): Promise<{ success: boolean; data?: MediaMetadata; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        const id = generateId();
        const now = new Date().toISOString();

        const newMetadata: MediaMetadata = {
            id,
            business_id: businessId,
            media_id: data.media_id,
            key: data.key,
            value: data.value || null,
            created_at: now,
            created_by: authId,
            updated_at: null,
            updated_by: null
        };

        // Store in offline database
        await db.mediaMetadata.add(newMetadata);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'mediaMetadata',
            'insert',
            newMetadata,
            businessId,
            authId
        );

        return { success: true, data: newMetadata };
    } catch (error) {
        console.error('Error creating media metadata:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create media metadata'
        };
    }
}

/**
 * Get media metadata for a specific media item
 */
export async function getMediaMetadata(
    businessId: string,
    mediaId: string
): Promise<{ success: boolean; data?: MediaMetadata[]; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        const metadata = await db.mediaMetadata
            .filter(meta => meta.business_id === businessId && meta.media_id === mediaId)
            .toArray();

        return { success: true, data: metadata };
    } catch (error) {
        console.error('Error getting media metadata:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get media metadata'
        };
    }
}

/**
 * Update media metadata
 */
export async function updateMediaMetadata(
    businessId: string,
    metadataId: string,
    updates: MediaMetadataUpdate
): Promise<{ success: boolean; data?: MediaMetadata; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        // Get current metadata
        const current = await db.mediaMetadata.get(metadataId);
        if (!current || current.business_id !== businessId) {
            return { success: false, error: 'Media metadata not found' };
        }

        const updatedMetadata: MediaMetadata = {
            ...current,
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: authId
        };

        // Update offline database
        await db.mediaMetadata.update(metadataId, updatedMetadata);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'mediaMetadata',
            'update',
            { ...updates, updated_at: updatedMetadata.updated_at, updated_by: authId },
            businessId,
            authId
        );

        return { success: true, data: updatedMetadata };
    } catch (error) {
        console.error('Error updating media metadata:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update media metadata'
        };
    }
}

/**
 * Delete media metadata
 */
export async function deleteMediaMetadata(
    businessId: string,
    metadataId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        // Check if metadata exists and belongs to business
        const metadata = await db.mediaMetadata.get(metadataId);
        if (!metadata || metadata.business_id !== businessId) {
            return { success: false, error: 'Media metadata not found' };
        }

        // Delete from offline database
        await db.mediaMetadata.delete(metadataId);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'mediaMetadata',
            'delete',
            { id: metadataId },
            businessId,
            authId
        );

        return { success: true };
    } catch (error) {
        console.error('Error deleting media metadata:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete media metadata'
        };
    }
}

// =============================================================================
// MEDIA TAGS
// =============================================================================

/**
 * Create media tag
 */
export async function createMediaTag(
    businessId: string,
    data: Omit<MediaTagInsert, 'id' | 'business_id'>
): Promise<{ success: boolean; data?: MediaTag; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        // Check if tag already exists for this media
        const existingTag = await db.mediaTags
            .filter(tag =>
                tag.business_id === businessId &&
                tag.media_id === data.media_id &&
                tag.tag === data.tag
            )
            .first();

        if (existingTag) {
            return { success: true, data: existingTag };
        }

        const id = generateId();
        const now = new Date().toISOString();

        const newTag: MediaTag = {
            id,
            business_id: businessId,
            media_id: data.media_id,
            tag: data.tag,
            created_at: now,
            created_by: authId,
            updated_at: null,
            updated_by: null
        };

        // Store in offline database
        await db.mediaTags.add(newTag);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'mediaTags',
            'insert',
            newTag,
            businessId,
            authId
        );

        return { success: true, data: newTag };
    } catch (error) {
        console.error('Error creating media tag:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create media tag'
        };
    }
}

/**
 * Get media tags for a specific media item
 */
export async function getMediaTags(
    businessId: string,
    mediaId: string
): Promise<{ success: boolean; data?: MediaTag[]; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        const tags = await db.mediaTags
            .filter(tag => tag.business_id === businessId && tag.media_id === mediaId)
            .toArray();

        return { success: true, data: tags };
    } catch (error) {
        console.error('Error getting media tags:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get media tags'
        };
    }
}

/**
 * Search media by tag
 */
export async function searchMediaByTag(
    businessId: string,
    tag: string
): Promise<{ success: boolean; data?: MediaTag[]; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        const tags = await db.mediaTags
            .filter(mediaTag =>
                mediaTag.business_id === businessId &&
                mediaTag.tag.toLowerCase().includes(tag.toLowerCase())
            )
            .toArray();

        return { success: true, data: tags };
    } catch (error) {
        console.error('Error searching media by tag:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to search media by tag'
        };
    }
}

/**
 * Delete media tag
 */
export async function deleteMediaTag(
    businessId: string,
    tagId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        // Check if tag exists and belongs to business
        const tag = await db.mediaTags.get(tagId);
        if (!tag || tag.business_id !== businessId) {
            return { success: false, error: 'Media tag not found' };
        }

        // Delete from offline database
        await db.mediaTags.delete(tagId);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'mediaTags',
            'delete',
            { id: tagId },
            businessId,
            authId
        );

        return { success: true };
    } catch (error) {
        console.error('Error deleting media tag:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete media tag'
        };
    }
}

/**
 * Get all unique tags for a business (for autocomplete/suggestions)
 */
export async function getAllTags(
    businessId: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
        const authId = getCurrentAuthId();
        if (!authId) {
            return { success: false, error: 'Authentication required' };
        }

        // Validate user access to business
        const hasAccess = await BusinessOfflineManager.validateUserAccess(authId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied to this business' };
        }

        const tags = await db.mediaTags
            .filter(tag => tag.business_id === businessId)
            .toArray();

        // Extract unique tag names
        const uniqueTags = [...new Set(tags.map(tag => tag.tag))].sort();

        return { success: true, data: uniqueTags };
    } catch (error) {
        console.error('Error getting all tags:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get all tags'
        };
    }
}
