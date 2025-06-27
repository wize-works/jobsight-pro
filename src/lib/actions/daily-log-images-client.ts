/**
 * Client-Side Daily Log Images Actions
 * 
 * Replaces src/app/actions/daily-log-image.ts with offline-first implementation.
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

// Extract Supabase types for daily log images
type DailyLogImage = Database['public']['Tables']['daily_log_images']['Row'];
type DailyLogImageInsert = Database['public']['Tables']['daily_log_images']['Insert'];
type DailyLogImageUpdate = Database['public']['Tables']['daily_log_images']['Update'];

// Create client-side daily log image actions
const insertDailyLogImage = createInsertAction('daily_log_images', 'high');
const updateDailyLogImage = createUpdateAction('daily_log_images', 'high');
const deleteDailyLogImage = createDeleteAction('daily_log_images', 'high');
const selectDailyLogImages = createSelectAction('daily_log_images');

/**
 * Get all daily log images for a business - works offline
 */
export const getDailyLogImages = async (businessId: string, dailyLogId?: string): Promise<DailyLogImage[]> => {
    try {
        const result = await selectDailyLogImages({}, businessId);

        if (result.error) {
            console.error("Error fetching daily log images:", result.error);
            return [];
        }

        let images = (result.data || []) as DailyLogImage[];

        // Filter by daily_log_id if provided
        if (dailyLogId) {
            images = images.filter(image => image.daily_log_id === dailyLogId);
        }

        return images;
    } catch (err) {
        console.error("Error in getDailyLogImages:", err);
        return [];
    }
};

/**
 * Create a new daily log image - works offline
 */
export const createDailyLogImage = async (data: DailyLogImageInsert): Promise<DailyLogImage | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for daily log image');
        }

        const imageData = {
            ...data,
            id: data.id || uuidv4(),
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertDailyLogImage(imageData, data.business_id);

        if (result.error) {
            console.error("Error creating daily log image:", result.error);
            return null;
        }

        return result.data as DailyLogImage;
    } catch (err) {
        console.error("Error in createDailyLogImage:", err);
        return null;
    }
};

/**
 * Update a daily log image - works offline
 */
export const updateDailyLogImageById = async (id: string, data: Partial<DailyLogImageUpdate>, businessId: string): Promise<DailyLogImage | null> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateDailyLogImage(updateData, businessId);

        if (result.error) {
            console.error("Error updating daily log image:", result.error);
            return null;
        }

        return result.data as DailyLogImage;
    } catch (err) {
        console.error("Error in updateDailyLogImageById:", err);
        return null;
    }
};

/**
 * Delete a daily log image - works offline
 */
export const removeDailyLogImage = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteDailyLogImage({ id }, businessId);

        if (result.error) {
            console.error("Error deleting daily log image:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeDailyLogImage:", err);
        return false;
    }
};

/**
 * Get a daily log image by ID - works offline
 */
export const getDailyLogImageById = async (id: string, businessId: string): Promise<DailyLogImage | null> => {
    try {
        const images = await getDailyLogImages(businessId);
        return images.find(image => image.id === id) || null;
    } catch (err) {
        console.error("Error in getDailyLogImageById:", err);
        return null;
    }
};

/**
 * Get images for specific daily log - works offline
 */
export const getImagesByDailyLogId = async (businessId: string, dailyLogId: string): Promise<DailyLogImage[]> => {
    return await getDailyLogImages(businessId, dailyLogId);
};

/**
 * Update image caption - works offline
 */
export const updateImageCaption = async (businessId: string, imageId: string, caption: string, userId?: string): Promise<DailyLogImage | null> => {
    return await updateDailyLogImageById(imageId, {
        caption,
        updated_by: userId || null,
    }, businessId);
};

/**
 * Update image URL (after upload) - works offline
 */
export const updateImageUrl = async (businessId: string, imageId: string, url: string, userId?: string): Promise<DailyLogImage | null> => {
    return await updateDailyLogImageById(imageId, {
        url,
        updated_by: userId || null,
    }, businessId);
};

// Bulk operations for daily log images
export const createMultipleDailyLogImages = async (images: DailyLogImageInsert[]): Promise<DailyLogImage[]> => {
    const results: DailyLogImage[] = [];
    for (const image of images) {
        try {
            const result = await createDailyLogImage(image);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            console.error('Error creating daily log image:', error);
        }
    }
    return results;
};

export const deleteImagesByDailyLogId = async (businessId: string, dailyLogId: string): Promise<boolean[]> => {
    const images = await getImagesByDailyLogId(businessId, dailyLogId);
    const deletePromises = images.map(image => removeDailyLogImage(image.id, businessId));
    return await Promise.all(deletePromises);
};

// Get images by media ID
export const getImagesByMediaId = async (businessId: string, mediaId: string): Promise<DailyLogImage[]> => {
    try {
        const images = await getDailyLogImages(businessId);
        return images.filter(image => image.media_id === mediaId);
    } catch (err) {
        console.error("Error in getImagesByMediaId:", err);
        return [];
    }
};

// Get images without media ID (pending uploads)
export const getPendingUploadImages = async (businessId: string): Promise<DailyLogImage[]> => {
    try {
        const images = await getDailyLogImages(businessId);
        return images.filter(image => !image.media_id && !image.url);
    } catch (err) {
        console.error("Error in getPendingUploadImages:", err);
        return [];
    }
};

// Get recent images
export const getRecentImages = async (businessId: string, limit: number = 10): Promise<DailyLogImage[]> => {
    try {
        const images = await getDailyLogImages(businessId);
        return images
            .sort((a, b) => {
                const aDate = new Date(a.created_at || 0).getTime();
                const bDate = new Date(b.created_at || 0).getTime();
                return bDate - aDate;
            })
            .slice(0, limit);
    } catch (err) {
        console.error("Error in getRecentImages:", err);
        return [];
    }
};

// Get image statistics for a business
export const getDailyLogImageStats = async (businessId: string): Promise<{
    totalImages: number;
    imagesWithCaptions: number;
    pendingUploads: number;
    imagesByDailyLog: Record<string, number>;
}> => {
    try {
        const images = await getDailyLogImages(businessId);

        const stats = {
            totalImages: images.length,
            imagesWithCaptions: images.filter(img => img.caption && img.caption.trim().length > 0).length,
            pendingUploads: images.filter(img => !img.media_id && !img.url).length,
            imagesByDailyLog: {} as Record<string, number>,
        };

        images.forEach(image => {
            const logId = image.daily_log_id;
            stats.imagesByDailyLog[logId] = (stats.imagesByDailyLog[logId] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error('Failed to get daily log image stats:', error);
        return {
            totalImages: 0,
            imagesWithCaptions: 0,
            pendingUploads: 0,
            imagesByDailyLog: {},
        };
    }
};

// Export compatibility functions for existing code
export {
    getDailyLogImages as getAllDailyLogImages,
    createDailyLogImage as addDailyLogImage,
    removeDailyLogImage as deleteDailyLogImage,
    getDailyLogImageById as fetchDailyLogImage,
};
