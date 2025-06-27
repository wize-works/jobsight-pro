/**
 * Client-Side User Notification Preferences Actions
 * 
 * Replaces src/app/actions/notification-preferences.ts with offline-first implementation.
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

// Extract Supabase types for notification preferences
type NotificationPreferences = Database['public']['Tables']['user_notification_preferences']['Row'];
type NotificationPreferencesInsert = Database['public']['Tables']['user_notification_preferences']['Insert'];
type NotificationPreferencesUpdate = Database['public']['Tables']['user_notification_preferences']['Update'];

// Create client-side notification preferences actions
const insertNotificationPreferences = createInsertAction('user_notification_preferences', 'medium');
const updateNotificationPreferences = createUpdateAction('user_notification_preferences', 'medium');
const deleteNotificationPreferences = createDeleteAction('user_notification_preferences', 'medium');
const selectNotificationPreferences = createSelectAction('user_notification_preferences');

/**
 * Get notification preferences for a business - works offline
 */
export const getNotificationPreferences = async (businessId: string, userId?: string): Promise<NotificationPreferences[]> => {
    try {
        const result = await selectNotificationPreferences({}, businessId);

        if (result.error) {
            console.error("Error fetching notification preferences:", result.error);
            return [];
        }

        let preferences = (result.data || []) as NotificationPreferences[];

        // Filter by user_id if provided
        if (userId) {
            preferences = preferences.filter(pref => pref.user_id === userId);
        }

        return preferences;
    } catch (err) {
        console.error("Error in getNotificationPreferences:", err);
        return [];
    }
};

/**
 * Get notification preferences for a specific user - works offline
 */
export const getUserNotificationPreferences = async (businessId: string, userId: string): Promise<NotificationPreferences | null> => {
    try {
        const preferences = await getNotificationPreferences(businessId, userId);
        return preferences.length > 0 ? preferences[0] : null;
    } catch (err) {
        console.error("Error in getUserNotificationPreferences:", err);
        return null;
    }
};

/**
 * Create new notification preferences - works offline
 */
export const createNotificationPreferences = async (data: NotificationPreferencesInsert): Promise<NotificationPreferences | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for notification preferences');
        }

        const preferencesData = {
            ...data,
            id: data.id || uuidv4(),
            email_enabled: data.email_enabled ?? true,
            push_enabled: data.push_enabled ?? true,
            in_app_enabled: data.in_app_enabled ?? true,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertNotificationPreferences(preferencesData, data.business_id);

        if (result.error) {
            console.error("Error creating notification preferences:", result.error);
            return null;
        }

        return result.data as NotificationPreferences;
    } catch (err) {
        console.error("Error in createNotificationPreferences:", err);
        return null;
    }
};

/**
 * Update notification preferences - works offline
 */
export const updateNotificationPreferencesById = async (id: string, data: NotificationPreferencesUpdate, businessId: string): Promise<NotificationPreferences | null> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateNotificationPreferences(updateData, businessId);

        if (result.error) {
            console.error("Error updating notification preferences:", result.error);
            return null;
        }

        return result.data as NotificationPreferences;
    } catch (err) {
        console.error("Error in updateNotificationPreferencesById:", err);
        return null;
    }
};

/**
 * Update notification preferences for a user - works offline
 */
export const updateUserNotificationPreferences = async (businessId: string, userId: string, data: Partial<Pick<NotificationPreferencesUpdate, 'email_enabled' | 'push_enabled' | 'in_app_enabled'>>): Promise<NotificationPreferences | null> => {
    try {
        const existing = await getUserNotificationPreferences(businessId, userId);

        if (existing) {
            // Update existing preferences
            return await updateNotificationPreferencesById(existing.id, {
                email_enabled: data.email_enabled,
                push_enabled: data.push_enabled,
                in_app_enabled: data.in_app_enabled,
                updated_by: userId,
                created_by: null,
            }, businessId);
        } else {
            // Create new preferences
            return await createNotificationPreferences({
                id: uuidv4(),
                user_id: userId,
                business_id: businessId,
                email_enabled: data.email_enabled ?? true,
                push_enabled: data.push_enabled ?? true,
                in_app_enabled: data.in_app_enabled ?? true,
                created_by: userId,
                updated_by: userId,
            });
        }
    } catch (err) {
        console.error("Error in updateUserNotificationPreferences:", err);
        return null;
    }
};

/**
 * Delete notification preferences - works offline
 */
export const removeNotificationPreferences = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteNotificationPreferences({ id }, businessId);

        if (result.error) {
            console.error("Error deleting notification preferences:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeNotificationPreferences:", err);
        return false;
    }
};

/**
 * Get notification preferences by ID - works offline
 */
export const getNotificationPreferencesById = async (id: string, businessId: string): Promise<NotificationPreferences | null> => {
    try {
        const preferences = await getNotificationPreferences(businessId);
        return preferences.find(pref => pref.id === id) || null;
    } catch (err) {
        console.error("Error in getNotificationPreferencesById:", err);
        return null;
    }
};

// Utility functions for specific preference types
export const toggleEmailNotifications = async (businessId: string, userId: string, enabled: boolean): Promise<NotificationPreferences | null> => {
    return await updateUserNotificationPreferences(businessId, userId, { email_enabled: enabled });
};

export const togglePushNotifications = async (businessId: string, userId: string, enabled: boolean): Promise<NotificationPreferences | null> => {
    return await updateUserNotificationPreferences(businessId, userId, { push_enabled: enabled });
};

export const toggleInAppNotifications = async (businessId: string, userId: string, enabled: boolean): Promise<NotificationPreferences | null> => {
    return await updateUserNotificationPreferences(businessId, userId, { in_app_enabled: enabled });
};

// Bulk operations for notification preferences
export const createDefaultPreferencesForUser = async (businessId: string, userId: string, createdBy: string): Promise<NotificationPreferences | null> => {
    return await createNotificationPreferences({
        id: uuidv4(),
        user_id: userId,
        business_id: businessId,
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        created_by: createdBy,
        updated_by: createdBy,
    });
};

export const resetToDefaultPreferences = async (businessId: string, userId: string): Promise<NotificationPreferences | null> => {
    return await updateUserNotificationPreferences(businessId, userId, {
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
    });
};

// Get summary of notification settings for all users in a business
export const getBusinessNotificationSummary = async (businessId: string): Promise<{
    totalUsers: number;
    emailEnabled: number;
    pushEnabled: number;
    inAppEnabled: number;
}> => {
    try {
        const preferences = await getNotificationPreferences(businessId);

        return {
            totalUsers: preferences.length,
            emailEnabled: preferences.filter(p => p.email_enabled).length,
            pushEnabled: preferences.filter(p => p.push_enabled).length,
            inAppEnabled: preferences.filter(p => p.in_app_enabled).length,
        };
    } catch (error) {
        console.error('Failed to get notification summary:', error);
        return {
            totalUsers: 0,
            emailEnabled: 0,
            pushEnabled: 0,
            inAppEnabled: 0,
        };
    }
};

// Export compatibility functions for existing code
export {
    getNotificationPreferences as getAllNotificationPreferences,
    createNotificationPreferences as addNotificationPreferences,
    removeNotificationPreferences as deleteNotificationPreferences,
    getNotificationPreferencesById as fetchNotificationPreferences,
};
