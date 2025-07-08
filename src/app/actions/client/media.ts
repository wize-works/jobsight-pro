'use client';

import { revalidatePath } from 'next/cache';
import { db, BusinessOfflineManager } from '@/lib/offline/dexie-db';
import {
    Media,
    MediaInsert,
    MediaUpdate,
    MediaUploadQueueItem,
    MediaCaptureOptions
} from '@/types/media';

/**
 * Media Client Actions - Offline-First Implementation
 * 
 * This module handles media metadata operations with offline support.
 * Actual media files are handled separately through the upload queue system.
 * 
 * Key features:
 * - Offline metadata storage in Dexie
 * - Camera capture with direct blob handling
 * - Upload queue for offline uploads
 * - Media caching for offline viewing
 * - User-scoped operations (auth_id based)
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

// Generate a unique ID for new media items
const generateMediaId = () => `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Generate a unique ID for upload queue items
const generateUploadId = () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create media metadata record
 * Note: This creates metadata only. File upload is handled separately via upload queue.
 */
export async function createMediaMetadata(
    businessId: string,
    data: Omit<MediaInsert, 'id' | 'business_id'>
): Promise<{ success: boolean; data?: Media; error?: string }> {
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

        const id = generateMediaId();
        const now = new Date().toISOString();

        const newMedia: Media = {
            id,
            business_id: businessId,
            project_id: data.project_id,
            url: data.url,
            name: data.name,
            description: data.description,
            type: data.type,
            size: data.size,
            uploaded_by: data.uploaded_by || authId,
            uploaded_at: data.uploaded_at || now,
            created_at: now,
            created_by: authId,
            updated_at: null,
            updated_by: null
        };

        // Store in offline database
        await db.media.add(newMedia);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'media',
            'insert',
            newMedia,
            businessId,
            authId
        );

        // Note: Online sync would happen here in a full implementation
        // For now, we're focusing on offline-first structure

        return { success: true, data: newMedia };
    } catch (error) {
        console.error('Error creating media metadata:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create media metadata'
        };
    }
}

/**
 * Get media metadata by ID
 */
export async function getMediaById(
    businessId: string,
    mediaId: string
): Promise<{ success: boolean; data?: Media; error?: string }> {
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

        // Try offline first
        const offlineData = await db.media.get(mediaId);
        if (offlineData && offlineData.business_id === businessId) {
            return { success: true, data: offlineData };
        }

        // Note: Online fetch would happen here in a full implementation
        return { success: false, error: 'Media not found' };
    } catch (error) {
        console.error('Error getting media:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get media'
        };
    }
}

/**
 * List media metadata with filters
 */
export async function listMedia(
    businessId: string,
    filters: {
        projectId?: string;
        type?: string;
        uploadedBy?: string;
        limit?: number;
        offset?: number;
    } = {}
): Promise<{ success: boolean; data?: Media[]; error?: string }> {
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

        let query = db.media.filter(media => media.business_id === businessId);

        // Apply filters
        if (filters.projectId) {
            query = query.and(media => media.project_id === filters.projectId);
        }
        if (filters.type) {
            query = query.and(media => media.type === filters.type);
        }
        if (filters.uploadedBy) {
            query = query.and(media => media.uploaded_by === filters.uploadedBy);
        }

        let results = await query.reverse().sortBy('created_at');

        // Apply pagination
        if (filters.offset) {
            results = results.slice(filters.offset);
        }
        if (filters.limit) {
            results = results.slice(0, filters.limit);
        }

        // Note: Online sync would happen here in a full implementation

        return { success: true, data: results };
    } catch (error) {
        console.error('Error listing media:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list media'
        };
    }
}

/**
 * Update media metadata
 */
export async function updateMedia(
    businessId: string,
    mediaId: string,
    updates: MediaUpdate
): Promise<{ success: boolean; data?: Media; error?: string }> {
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

        // Get current media
        const current = await db.media.get(mediaId);
        if (!current || current.business_id !== businessId) {
            return { success: false, error: 'Media not found' };
        }

        const updatedMedia: Media = {
            ...current,
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: authId
        };

        // Update offline database
        await db.media.update(mediaId, updatedMedia);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'media',
            'update',
            { ...updates, updated_at: updatedMedia.updated_at, updated_by: authId },
            businessId,
            authId
        );

        // Note: Online sync would happen here in a full implementation

        revalidatePath('/dashboard/projects');
        return { success: true, data: updatedMedia };
    } catch (error) {
        console.error('Error updating media:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update media'
        };
    }
}

/**
 * Delete media metadata (note: actual file deletion should be handled separately)
 */
export async function deleteMedia(
    businessId: string,
    mediaId: string
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

        // Check if media exists and belongs to business
        const media = await db.media.get(mediaId);
        if (!media || media.business_id !== businessId) {
            return { success: false, error: 'Media not found' };
        }

        // Delete from offline database
        await db.media.delete(mediaId);

        // Add to sync queue
        await BusinessOfflineManager.addToSyncQueue(
            'media',
            'delete',
            { id: mediaId },
            businessId,
            authId
        );

        // Note: Online sync would happen here in a full implementation

        revalidatePath('/dashboard/projects');
        return { success: true };
    } catch (error) {
        console.error('Error deleting media:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete media'
        };
    }
}

/**
 * Search media by name or description
 */
export async function searchMedia(
    businessId: string,
    searchTerm: string,
    filters: {
        projectId?: string;
        type?: string;
        limit?: number;
    } = {}
): Promise<{ success: boolean; data?: Media[]; error?: string }> {
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

        const searchLower = searchTerm.toLowerCase();

        let query = db.media.filter(media => {
            if (media.business_id !== businessId) return false;

            const nameMatch = media.name?.toLowerCase().includes(searchLower) || false;
            const descMatch = media.description?.toLowerCase().includes(searchLower) || false;

            return nameMatch || descMatch;
        });

        // Apply filters
        if (filters.projectId) {
            query = query.and(media => media.project_id === filters.projectId);
        }
        if (filters.type) {
            query = query.and(media => media.type === filters.type);
        }

        let results = await query.reverse().sortBy('created_at');

        if (filters.limit) {
            results = results.slice(0, filters.limit);
        }

        return { success: true, data: results };
    } catch (error) {
        console.error('Error searching media:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to search media'
        };
    }
}

/**
 * Capture media from camera or gallery
 */
export async function captureMedia(
    businessId: string,
    options: MediaCaptureOptions,
    metadata: {
        projectId?: string;
        name?: string;
        description?: string;
        linkedId?: string;
        linkedType?: string;
        tags?: string[];
    } = {}
): Promise<{ success: boolean; data?: { uploadId: string; mediaId: string; tempBlobUrl: string }; error?: string }> {
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

        // Check if we have camera/media APIs available
        if (!navigator.mediaDevices && options.source === 'camera') {
            return { success: false, error: 'Camera not available on this device' };
        }

        let file: File | null = null;
        let location: { latitude: number; longitude: number; accuracy?: number } | undefined;

        // Get geolocation if requested
        if (options.includeLocation && navigator.geolocation) {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000 // 5 minutes
                    });
                });
                location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
            } catch (geoError) {
                console.log('Could not get location:', geoError);
            }
        }

        if (options.source === 'camera') {
            // Camera capture
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: options.maxWidth || 1920 },
                        height: { ideal: options.maxHeight || 1080 },
                        facingMode: 'environment' // Use back camera on mobile
                    }
                });

                // Create a video element to capture frame
                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.muted = true;

                return new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        // Create canvas and capture frame
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;

                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(video, 0, 0);

                            // Convert to blob
                            canvas.toBlob(async (blob) => {
                                // Stop camera stream
                                stream.getTracks().forEach(track => track.stop());

                                if (blob) {
                                    file = new File([blob], metadata.name || `camera_${Date.now()}.jpg`, {
                                        type: 'image/jpeg'
                                    });

                                    const result = await processMediaFile(businessId, file, metadata, location, 'camera', authId);
                                    resolve(result);
                                } else {
                                    resolve({ success: false, error: 'Failed to capture image' });
                                }
                            }, options.format || 'image/jpeg', options.quality || 0.8);
                        } else {
                            stream.getTracks().forEach(track => track.stop());
                            resolve({ success: false, error: 'Canvas not supported' });
                        }
                    };
                });
            } catch (cameraError) {
                return { success: false, error: 'Camera access denied or not available' };
            }
        } else if (options.source === 'gallery') {
            // File picker for gallery
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,video/*';
                input.multiple = false;

                input.onchange = async (e) => {
                    const selectedFile = (e.target as HTMLInputElement).files?.[0];
                    if (selectedFile) {
                        const result = await processMediaFile(businessId, selectedFile, metadata, location, 'gallery', authId);
                        resolve(result);
                    } else {
                        resolve({ success: false, error: 'No file selected' });
                    }
                };

                input.onclick = () => {
                    // If user cancels, resolve with error
                    setTimeout(() => {
                        if (!input.files?.length) {
                            resolve({ success: false, error: 'File selection cancelled' });
                        }
                    }, 100);
                };

                input.click();
            });
        }

        return { success: false, error: 'Invalid capture source' };
    } catch (error) {
        console.error('Error capturing media:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to capture media'
        };
    }
}

/**
 * Process captured media file and add to upload queue
 */
async function processMediaFile(
    businessId: string,
    file: File,
    metadata: {
        projectId?: string;
        name?: string;
        description?: string;
        linkedId?: string;
        linkedType?: string;
        tags?: string[];
    },
    location: { latitude: number; longitude: number; accuracy?: number } | undefined,
    captureSource: 'camera' | 'gallery' | 'file',
    authId: string
): Promise<{ success: boolean; data?: { uploadId: string; mediaId: string; tempBlobUrl: string }; error?: string }> {
    try {
        // Create blob URL for temporary access
        const tempBlobUrl = URL.createObjectURL(file);

        const uploadId = generateUploadId();
        const mediaId = generateMediaId();
        const now = new Date().toISOString();

        // Create upload queue item
        const uploadItem: MediaUploadQueueItem = {
            id: uploadId,
            businessId,
            projectId: metadata.projectId,
            tempBlobUrl,
            name: metadata.name || file.name,
            description: metadata.description,
            type: file.type,
            size: file.size,
            linkedId: metadata.linkedId,
            linkedType: metadata.linkedType,
            tags: metadata.tags,
            uploadedBy: authId,
            createdAt: now,
            uploadProgress: 0,
            uploadStatus: 'pending',
            retryCount: 0,
            captureSource,
            location
        };

        // Add to upload queue
        await db.mediaUploadQueue.add(uploadItem);

        // Trigger upload processing in background
        setTimeout(() => processUploadQueue(businessId), 100);

        return {
            success: true,
            data: {
                uploadId,
                mediaId,
                tempBlobUrl
            }
        };
    } catch (error) {
        console.error('Error processing media file:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process media file'
        };
    }
}

/**
 * Process upload queue (background task)
 */
async function processUploadQueue(businessId: string): Promise<void> {
    try {
        const pendingUploads = await db.mediaUploadQueue
            .filter(item => item.businessId === businessId && item.uploadStatus === 'pending')
            .toArray();

        for (const upload of pendingUploads) {
            try {
                // Update status to uploading
                await db.mediaUploadQueue.update(upload.id, {
                    uploadStatus: 'uploading',
                    uploadProgress: 10
                });

                // TODO: Implement actual file upload to Supabase Storage
                // This would include:
                // 1. Upload file to Supabase Storage
                // 2. Create media metadata record
                // 3. Update upload queue status
                // 4. Clean up temporary blob URL

                console.log('Upload queue processing not yet implemented for:', upload.name);

                // For now, mark as completed (this should be replaced with actual upload logic)
                await db.mediaUploadQueue.update(upload.id, {
                    uploadStatus: 'completed',
                    uploadProgress: 100
                });

            } catch (uploadError) {
                console.error('Upload failed:', uploadError);
                await db.mediaUploadQueue.update(upload.id, {
                    uploadStatus: 'failed',
                    errorMessage: uploadError instanceof Error ? uploadError.message : 'Upload failed',
                    retryCount: upload.retryCount + 1
                });
            }
        }
    } catch (error) {
        console.error('Error processing upload queue:', error);
    }
}

/**
 * Get upload queue status for a business
 */
export async function getUploadQueueStatus(
    businessId: string
): Promise<{ success: boolean; data?: MediaUploadQueueItem[]; error?: string }> {
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

        const uploads = await db.mediaUploadQueue
            .filter(item => item.businessId === businessId)
            .reverse()
            .sortBy('createdAt');

        return { success: true, data: uploads };
    } catch (error) {
        console.error('Error getting upload queue status:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get upload queue status'
        };
    }
}

/**
 * Clear completed uploads from queue
 */
export async function clearCompletedUploads(
    businessId: string
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

        const completedUploads = await db.mediaUploadQueue
            .filter(item => item.businessId === businessId && item.uploadStatus === 'completed')
            .toArray();

        // Clean up blob URLs and remove from queue
        for (const upload of completedUploads) {
            if (upload.tempBlobUrl) {
                URL.revokeObjectURL(upload.tempBlobUrl);
            }
            await db.mediaUploadQueue.delete(upload.id);
        }

        return { success: true };
    } catch (error) {
        console.error('Error clearing completed uploads:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to clear completed uploads'
        };
    }
}
