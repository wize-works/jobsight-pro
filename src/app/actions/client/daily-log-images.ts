"use client";

/**
 * Daily Log Images Client Actions - Offline-First Implementation (Phase 4.2 - Daily Operations System)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { DailyLogImage, DailyLogImageInsert, DailyLogImageUpdate } from "@/types/daily-log-image";
import { db } from "@/lib/offline/dexie-db";
import { initializeAuthState } from "./business";
import { v4 as uuidv4 } from "uuid";

// Global auth state for client actions (imported from business actions)
declare let currentClerkUser: { id: string } | null;
declare let authStateInitialized: boolean;

// Check if we're online
function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

// Get current authenticated user ID (auth_id) from auth system
async function getCurrentUserId(): Promise<string | null> {
    // First priority: Use initialized Clerk user state (when online and available)
    if (authStateInitialized && currentClerkUser?.id) {
        return currentClerkUser.id;
    }

    // Second priority: Get from cached auth_id (for offline scenarios)
    if (typeof window !== 'undefined') {
        const cachedAuthId = window.localStorage.getItem('cached_auth_id');
        if (cachedAuthId) {
            return cachedAuthId;
        }
    }

    // If no auth state available, return null (user needs to authenticate)
    console.warn('No authenticated user found. Ensure initializeAuthState() is called from a React component.');
    return null;
}

// Validate that user has access to the specified business (using auth_id)
async function validateUserBusinessAccess(userAuthId: string, businessId: string): Promise<boolean> {
    try {
        // Check if user has a mapping to this business (using auth_id)
        const userBusinessId = await db.userBusinessMappings.get(userAuthId);
        if (userBusinessId?.businessId === businessId) {
            return true;
        }

        // Fallback: Check if user is the business owner
        const business = await db.businesses.get(businessId);
        if (business && business.owner_id === userAuthId) {
            // Cache the mapping for future use
            await db.userBusinessMappings.put({
                userId: userAuthId,
                businessId: businessId,
                role: 'owner',
                lastUpdated: Date.now()
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error validating user business access:', error);
        return false;
    }
}

/**
 * Add image to a daily log - Offline-First
 */
export async function addDailyLogImage(
    businessId: string,
    dailyLogId: string,
    imageData: Omit<DailyLogImageInsert, 'id' | 'business_id' | 'daily_log_id' | 'created_at' | 'created_by'>
): Promise<{ success: boolean; data?: DailyLogImage; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Validate that the daily log exists and belongs to the business
        const dailyLog = await db.dailyLogs.get(dailyLogId);
        if (!dailyLog || dailyLog.business_id !== businessId) {
            return { success: false, error: 'Daily log not found or access denied' };
        }

        const imageId = uuidv4();
        const now = new Date().toISOString();

        const newImage: DailyLogImage = {
            id: imageId,
            business_id: businessId,
            daily_log_id: dailyLogId,
            ...imageData,
            created_at: now,
            created_by: userId,
            updated_at: now,
            updated_by: userId
        };

        // Store locally first (offline-first approach)
        await db.dailyLogImages.put(newImage);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogImages_insert_${imageId}_${Date.now()}`,
            table: 'dailyLogImages',
            operation: 'insert',
            data: newImage,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: newImage };
    } catch (error) {
        console.error('Error adding daily log image:', error);
        return { success: false, error: 'Failed to add daily log image' };
    }
}

/**
 * Get all images for a daily log - Cache-First
 */
export async function getDailyLogImages(
    businessId: string,
    dailyLogId: string
): Promise<{ success: boolean; data?: DailyLogImage[]; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Validate that the daily log exists and belongs to the business
        const dailyLog = await db.dailyLogs.get(dailyLogId);
        if (!dailyLog || dailyLog.business_id !== businessId) {
            return { success: false, error: 'Daily log not found or access denied' };
        }

        // Get images from local database
        const images = await db.dailyLogImages
            .where('daily_log_id')
            .equals(dailyLogId)
            .and(item => item.business_id === businessId)
            .sortBy('created_at');

        return { success: true, data: images };
    } catch (error) {
        console.error('Error getting daily log images:', error);
        return { success: false, error: 'Failed to get daily log images' };
    }
}

/**
 * Get image by ID - Cache-First
 */
export async function getDailyLogImageById(
    businessId: string,
    imageId: string
): Promise<{ success: boolean; data?: DailyLogImage; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get from local database
        const image = await db.dailyLogImages.get(imageId);
        if (!image || image.business_id !== businessId) {
            return { success: false, error: 'Daily log image not found' };
        }

        return { success: true, data: image };
    } catch (error) {
        console.error('Error getting daily log image by ID:', error);
        return { success: false, error: 'Failed to get daily log image' };
    }
}

/**
 * Update daily log image - Offline-First
 */
export async function updateDailyLogImage(
    businessId: string,
    imageId: string,
    updates: Partial<DailyLogImageUpdate>
): Promise<{ success: boolean; data?: DailyLogImage; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get existing image to validate
        const existingImage = await db.dailyLogImages.get(imageId);
        if (!existingImage || existingImage.business_id !== businessId) {
            return { success: false, error: 'Daily log image not found or access denied' };
        }

        // Prepare updated data
        const now = new Date().toISOString();
        const updatedImage: DailyLogImage = {
            ...existingImage,
            ...updates,
            updated_at: now,
            updated_by: userId
        };

        // Update locally first (offline-first approach)
        await db.dailyLogImages.put(updatedImage);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogImages_update_${imageId}_${Date.now()}`,
            table: 'dailyLogImages',
            operation: 'update',
            data: updatedImage,
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true, data: updatedImage };
    } catch (error) {
        console.error('Error updating daily log image:', error);
        return { success: false, error: 'Failed to update daily log image' };
    }
}

/**
 * Delete daily log image - Offline-First
 */
export async function deleteDailyLogImage(
    businessId: string,
    imageId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get existing image to validate
        const existingImage = await db.dailyLogImages.get(imageId);
        if (!existingImage || existingImage.business_id !== businessId) {
            return { success: false, error: 'Daily log image not found or access denied' };
        }

        // Delete locally first (offline-first approach)
        await db.dailyLogImages.delete(imageId);

        // Queue for sync to server
        await db.syncQueue.add({
            id: `dailyLogImages_delete_${imageId}_${Date.now()}`,
            table: 'dailyLogImages',
            operation: 'delete',
            data: { id: imageId },
            businessId,
            userId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting daily log image:', error);
        return { success: false, error: 'Failed to delete daily log image' };
    }
}

/**
 * Get images for multiple daily logs - Cache-First
 */
export async function getBatchDailyLogImages(
    businessId: string,
    dailyLogIds: string[]
): Promise<{ success: boolean; data?: { [dailyLogId: string]: DailyLogImage[] }; error?: string }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get images from local database
        const images = await db.dailyLogImages
            .where('business_id')
            .equals(businessId)
            .and(image => dailyLogIds.includes(image.daily_log_id))
            .toArray();

        // Group by daily log ID
        const result: { [dailyLogId: string]: DailyLogImage[] } = {};

        // Initialize empty arrays for all requested daily log IDs
        dailyLogIds.forEach(id => {
            result[id] = [];
        });

        // Populate with images
        images.forEach(image => {
            if (!result[image.daily_log_id]) {
                result[image.daily_log_id] = [];
            }
            result[image.daily_log_id].push(image);
        });

        // Sort images within each daily log by created_at
        Object.keys(result).forEach(dailyLogId => {
            result[dailyLogId].sort((a, b) =>
                new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
            );
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting batch daily log images:', error);
        return { success: false, error: 'Failed to get batch daily log images' };
    }
}

/**
 * Get images by project - Cache-First
 */
export async function getProjectDailyLogImages(
    businessId: string,
    projectId: string,
    startDate?: string,
    endDate?: string,
    limit?: number
): Promise<{
    success: boolean; data?: Array<DailyLogImage & {
        daily_log_date: string;
        daily_log_work_completed: string;
    }>; error?: string
}> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get daily logs for the project with date filtering
        let dailyLogsQuery = db.dailyLogs
            .where('business_id')
            .equals(businessId)
            .and(log => log.project_id === projectId);

        if (startDate || endDate) {
            dailyLogsQuery = dailyLogsQuery.and(log => {
                if (startDate && log.date < startDate) return false;
                if (endDate && log.date > endDate) return false;
                return true;
            });
        }

        const dailyLogs = await dailyLogsQuery.toArray();
        const dailyLogIds = dailyLogs.map(log => log.id);

        // Get images for these daily logs
        let imagesQuery = db.dailyLogImages
            .where('business_id')
            .equals(businessId)
            .and(image => dailyLogIds.includes(image.daily_log_id));

        if (limit) {
            imagesQuery = imagesQuery.limit(limit);
        }

        const images = await imagesQuery.reverse().sortBy('created_at');

        // Create a map for quick daily log lookup
        const dailyLogMap = new Map(dailyLogs.map(log => [log.id, log]));

        // Enhance images with daily log information
        const enhancedImages = images.map(image => {
            const dailyLog = dailyLogMap.get(image.daily_log_id);
            return {
                ...image,
                daily_log_date: dailyLog?.date || '',
                daily_log_work_completed: dailyLog?.work_completed || ''
            };
        });

        return { success: true, data: enhancedImages };
    } catch (error) {
        console.error('Error getting project daily log images:', error);
        return { success: false, error: 'Failed to get project daily log images' };
    }
}

/**
 * Search images by caption or metadata - Cache-First
 */
export async function searchDailyLogImages(
    businessId: string,
    searchCriteria: {
        caption?: string;
        projectId?: string;
        startDate?: string;
        endDate?: string;
        mediaId?: string;
        limit?: number;
    }
): Promise<{
    success: boolean; data?: Array<DailyLogImage & {
        daily_log_date: string;
        daily_log_project_id: string;
    }>; error?: string
}> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // If projectId is specified, first get daily logs for that project
        let dailyLogIds: string[] | undefined;
        if (searchCriteria.projectId) {
            const dailyLogs = await db.dailyLogs
                .where('business_id')
                .equals(businessId)
                .and(log => log.project_id === searchCriteria.projectId!)
                .toArray();
            dailyLogIds = dailyLogs.map(log => log.id);
        }

        // Start with business filter
        let query = db.dailyLogImages.where('business_id').equals(businessId);

        // Apply filters
        query = query.and(image => {
            // Caption search (case-insensitive)
            if (searchCriteria.caption) {
                const caption = searchCriteria.caption.toLowerCase();
                if (!image.caption || !image.caption.toLowerCase().includes(caption)) {
                    return false;
                }
            }

            // Media ID filter
            if (searchCriteria.mediaId && image.media_id !== searchCriteria.mediaId) {
                return false;
            }

            // Project filter (via daily log IDs)
            if (dailyLogIds && !dailyLogIds.includes(image.daily_log_id)) {
                return false;
            }

            return true;
        });

        // Apply limit
        if (searchCriteria.limit) {
            query = query.limit(searchCriteria.limit);
        }

        const images = await query.reverse().sortBy('created_at');

        // Get daily log information for date and project context
        const uniqueDailyLogIds = [...new Set(images.map(img => img.daily_log_id))];
        const dailyLogs = await db.dailyLogs
            .where('business_id')
            .equals(businessId)
            .and(log => uniqueDailyLogIds.includes(log.id))
            .toArray();

        const dailyLogMap = new Map(dailyLogs.map(log => [log.id, log]));

        // Apply date filtering if needed and enhance with daily log info
        let enhancedImages = images.map(image => {
            const dailyLog = dailyLogMap.get(image.daily_log_id);
            return {
                ...image,
                daily_log_date: dailyLog?.date || '',
                daily_log_project_id: dailyLog?.project_id || ''
            };
        });

        // Filter by date if specified
        if (searchCriteria.startDate || searchCriteria.endDate) {
            enhancedImages = enhancedImages.filter(image => {
                const date = image.daily_log_date;
                if (!date) return false;

                if (searchCriteria.startDate && date < searchCriteria.startDate) return false;
                if (searchCriteria.endDate && date > searchCriteria.endDate) return false;

                return true;
            });
        }

        return { success: true, data: enhancedImages };
    } catch (error) {
        console.error('Error searching daily log images:', error);
        return { success: false, error: 'Failed to search daily log images' };
    }
}

/**
 * Get image count summary - Cache-First
 */
export async function getDailyLogImageSummary(
    businessId: string,
    projectId?: string,
    startDate?: string,
    endDate?: string
): Promise<{
    success: boolean; data?: {
        total_images: number;
        images_with_captions: number;
        images_without_captions: number;
        daily_logs_with_images: number;
        average_images_per_log: number;
    }; error?: string
}> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate user access to business
        const hasAccess = await validateUserBusinessAccess(userId, businessId);
        if (!hasAccess) {
            return { success: false, error: 'Access denied: User not authorized for this business' };
        }

        // Get daily logs for filtering
        let dailyLogsQuery = db.dailyLogs.where('business_id').equals(businessId);

        if (projectId) {
            dailyLogsQuery = dailyLogsQuery.and(log => log.project_id === projectId);
        }

        if (startDate || endDate) {
            dailyLogsQuery = dailyLogsQuery.and(log => {
                if (startDate && log.date < startDate) return false;
                if (endDate && log.date > endDate) return false;
                return true;
            });
        }

        const dailyLogs = await dailyLogsQuery.toArray();
        const dailyLogIds = dailyLogs.map(log => log.id);

        // Get images for the filtered daily logs
        const images = await db.dailyLogImages
            .where('business_id')
            .equals(businessId)
            .and(image => dailyLogIds.includes(image.daily_log_id))
            .toArray();

        // Calculate summary
        const totalImages = images.length;
        const imagesWithCaptions = images.filter(img => img.caption && img.caption.trim().length > 0).length;
        const imagesWithoutCaptions = totalImages - imagesWithCaptions;

        // Count unique daily logs that have images
        const dailyLogsWithImages = new Set(images.map(img => img.daily_log_id)).size;

        const averageImagesPerLog = dailyLogsWithImages > 0 ? totalImages / dailyLogsWithImages : 0;

        const result = {
            total_images: totalImages,
            images_with_captions: imagesWithCaptions,
            images_without_captions: imagesWithoutCaptions,
            daily_logs_with_images: dailyLogsWithImages,
            average_images_per_log: Number(averageImagesPerLog.toFixed(2))
        };

        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting daily log image summary:', error);
        return { success: false, error: 'Failed to get daily log image summary' };
    }
}
