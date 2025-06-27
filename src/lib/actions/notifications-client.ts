/**
 * Client-Side Notifications Actions
 * 
 * Replaces src/app/actions/notifications.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for notifications
type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationUpdate = Partial<Database['public']['Tables']['notifications']['Update']>;

// Create client-side notification actions
const insertNotification = createInsertAction('notifications', 'medium');
const updateNotification = createUpdateAction('notifications', 'medium');
const deleteNotification = createDeleteAction('notifications', 'low');
const selectNotifications = createSelectAction('notifications');

/**
 * Get all notifications for a user - works offline with server fallback
 */
export const getNotifications = async (businessId: string, userId?: string): Promise<Notification[]> => {
    try {
        // Try client-side (IndexedDB) first
        const result = await selectNotifications({}, businessId);

        if (result.error) {
            console.error("Error fetching notifications from IndexedDB:", result.error);
        }

        let clientData = (result.data || []) as Notification[];

        // Filter by user if specified
        if (userId && clientData.length > 0) {
            clientData = clientData.filter(n => n.user_id === userId);
        }

        // If we have data from IndexedDB, return it
        if (clientData.length > 0) {
            console.log(`✅ Notifications loaded from IndexedDB: ${clientData.length} notifications`);
            // Sort by creation date, newest first
            return clientData.sort((a, b) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );
        }

        // Fallback to server if IndexedDB is empty
        console.log('🔄 IndexedDB empty, falling back to server for notifications...');

        try {
            // Import server action dynamically to avoid bundling issues
            const { getNotifications: getNotificationsServer } = await import('@/app/actions/notifications');
            let serverData = await getNotificationsServer(businessId);

            // Filter by user if specified
            if (userId && serverData.length > 0) {
                serverData = serverData.filter((n: any) => n.user_id === userId);
            }

            if (serverData.length > 0) {
                console.log(`✅ Notifications loaded from server: ${serverData.length} notifications`);

                // Cache server data to IndexedDB for future offline use
                try {
                    const { cacheData } = await import('@/lib/offline/storage');
                    await cacheData('notifications', serverData, businessId);
                    console.log(`💾 Cached ${serverData.length} notifications to IndexedDB`);
                } catch (cacheError) {
                    console.warn('⚠️ Failed to cache notifications data:', cacheError);
                }

                // Sort by creation date, newest first
                return serverData.sort((a: any, b: any) =>
                    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                );
            }
        } catch (serverError) {
            console.error('❌ Server fallback failed for notifications:', serverError);
        }

        console.log('📭 No notifications found in IndexedDB or server');
        return [];
    } catch (err) {
        console.error("Error in getNotifications:", err);
        return [];
    }
};

/**
 * Get unread notifications count - works offline
 */
export const getUnreadNotificationsCount = async (businessId: string, userId: string): Promise<number> => {
    try {
        const notifications = await getNotifications(businessId, userId);
        return notifications.filter(n => !n.read).length;
    } catch (err) {
        console.error("Error in getUnreadNotificationsCount:", err);
        return 0;
    }
};

/**
 * Get notification by ID - works offline
 */
export const getNotificationById = async (businessId: string, id: string): Promise<Notification | null> => {
    try {
        const notifications = await getNotifications(businessId);
        const notification = notifications.find(n => n.id === id);

        if (!notification) {
            console.warn(`Notification with ID ${id} not found`);
            return null;
        }

        return notification;
    } catch (err) {
        console.error("Error in getNotificationById:", err);
        return null;
    }
};

/**
 * Create new notification - works offline with optimistic updates
 */
export const createNotification = async (
    data: NotificationInsert,
    businessId: string,
    userId?: string
): Promise<{ data?: Notification; error?: string }> => {
    try {
        // Ensure required fields
        const notificationData = {
            ...data,
            id: data.id || uuidv4(),
            business_id: businessId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            read: data.read || false,
            read_at: data.read_at || null,
        };

        const result = await insertNotification(notificationData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Notification };
    } catch (err) {
        console.error("Error in createNotification:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Mark notification as read - works offline
 */
export const markNotificationAsRead = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ data?: Notification; error?: string }> => {
    try {
        const updateData = {
            id,
            read: true,
            read_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await updateNotification(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as Notification };
    } catch (err) {
        console.error("Error in markNotificationAsRead:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Mark all notifications as read for a user - works offline
 */
export const markAllNotificationsAsRead = async (
    businessId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const notifications = await getNotifications(businessId, userId);
        const unreadNotifications = notifications.filter(n => !n.read);

        // Mark each unread notification as read
        const updatePromises = unreadNotifications.map(notification =>
            markNotificationAsRead(notification.id, businessId, userId)
        );

        const results = await Promise.all(updatePromises);

        // Check if any updates failed
        const failedUpdates = results.filter(result => result.error);
        if (failedUpdates.length > 0) {
            console.error("Some notifications failed to mark as read:", failedUpdates);
            return { success: false, error: "Some notifications could not be marked as read" };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in markAllNotificationsAsRead:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Delete notification - works offline with optimistic updates
 */
export const deleteNotificationById = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteNotification({ id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteNotificationById:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get notifications by type - works offline
 */
export const getNotificationsByType = async (
    businessId: string,
    type: string,
    userId?: string
): Promise<Notification[]> => {
    try {
        const notifications = await getNotifications(businessId, userId);
        return notifications.filter(n => n.type === type);
    } catch (err) {
        console.error("Error in getNotificationsByType:", err);
        return [];
    }
};

/**
 * Delete old notifications - works offline
 */
export const deleteOldNotifications = async (
    businessId: string,
    daysOld: number = 30,
    userId?: string
): Promise<{ deletedCount: number; error?: string }> => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const notifications = await getNotifications(businessId, userId);
        const oldNotifications = notifications.filter(n =>
            new Date(n.created_at || 0) < cutoffDate
        );

        // Delete each old notification
        const deletePromises = oldNotifications.map(notification =>
            deleteNotificationById(notification.id, businessId, userId)
        );

        const results = await Promise.all(deletePromises);

        // Count successful deletions
        const successfulDeletions = results.filter(result => result.success).length;
        const failedDeletions = results.filter(result => !result.success);

        if (failedDeletions.length > 0) {
            console.error("Some old notifications failed to delete:", failedDeletions);
        }

        return { deletedCount: successfulDeletions };
    } catch (err) {
        console.error("Error in deleteOldNotifications:", err);
        return { deletedCount: 0, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Create bulk notifications for multiple users - works offline
 */
export const createBulkNotifications = async (
    userIds: string[],
    notificationData: Omit<NotificationInsert, 'user_id' | 'id'>,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; created: number; error?: string }> => {
    try {
        const createPromises = userIds.map(targetUserId =>
            createNotification({
                ...notificationData,
                user_id: targetUserId,
            }, businessId, userId)
        );

        const results = await Promise.all(createPromises);

        // Count successful creations
        const successfulCreations = results.filter(result => !result.error).length;
        const failedCreations = results.filter(result => result.error);

        if (failedCreations.length > 0) {
            console.error("Some bulk notifications failed to create:", failedCreations);
        }

        return {
            success: failedCreations.length === 0,
            created: successfulCreations,
            error: failedCreations.length > 0 ? "Some notifications failed to create" : undefined
        };
    } catch (err) {
        console.error("Error in createBulkNotifications:", err);
        return { success: false, created: 0, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Check if notification operations are pending sync
 */
export const getNotificationSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending notification operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0
    };
};

/**
 * Get unread notifications for a user - works offline
 */
export const getUnreadNotifications = async (businessId: string, userId: string): Promise<Notification[]> => {
    try {
        const result = await selectNotifications({}, businessId);

        if (result.error) {
            console.error("Error fetching unread notifications:", result.error);
            return [];
        }

        let notifications = (result.data || []) as Notification[];

        // Filter by user and unread status
        notifications = notifications.filter(n =>
            n.user_id === userId && n.read === false
        );

        // Sort by creation date, newest first
        return notifications.sort((a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    } catch (error) {
        console.error("Error in getUnreadNotifications:", error);
        return [];
    }
};

// Export compatibility functions for existing code
export {
    getNotifications as default,
    createNotification as insertNotification,
    markNotificationAsRead as updateNotification,
    deleteNotificationById as deleteNotification
};
