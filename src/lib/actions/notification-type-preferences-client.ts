/**
 * Client-Side Notification Type Preferences Actions
 * 
 * Replaces src/app/actions/notification-type-preferences.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";

// Type definitions from Supabase schema
type UserNotificationTypePreference = Database['public']['Tables']['user_notification_type_preferences']['Row'];
type UserNotificationTypePreferenceInsert = Database['public']['Tables']['user_notification_type_preferences']['Insert'];
type UserNotificationTypePreferenceUpdate = Database['public']['Tables']['user_notification_type_preferences']['Update'];

// Notification type options (commonly used types)
export type NotificationTypeOptions =
    | 'project_created'
    | 'project_updated'
    | 'task_assigned'
    | 'task_completed'
    | 'daily_log_submitted'
    | 'invoice_generated'
    | 'crew_assigned'
    | 'equipment_assigned'
    | 'milestone_reached'
    | 'budget_warning'
    | 'deadline_reminder'
    | 'weather_alert';

export const notificationTypeOptions: NotificationTypeOptions[] = [
    'project_created',
    'project_updated',
    'task_assigned',
    'task_completed',
    'daily_log_submitted',
    'invoice_generated',
    'crew_assigned',
    'equipment_assigned',
    'milestone_reached',
    'budget_warning',
    'deadline_reminder',
    'weather_alert'
];

// Create action instances
const insertNotificationTypePreference = createInsertAction('user_notification_type_preferences', 'high');
const updateNotificationTypePreference = createUpdateAction('user_notification_type_preferences', 'high');
const deleteNotificationTypePref = createDeleteAction('user_notification_type_preferences', 'high');
const selectNotificationTypePreferences = createSelectAction('user_notification_type_preferences');

/**
 * Get all notification type preferences for a user
 */
export const getAllNotificationTypePreferences = async (
    businessId: string,
    userId: string
): Promise<UserNotificationTypePreference[]> => {
    try {
        const result = await selectNotificationTypePreferences({
            filter: {
                user_id: userId,
                business_id: businessId
            },
            orderBy: { column: 'notification_type', ascending: true }
        }, businessId);

        if (result.error) {
            console.error("Error fetching notification type preferences:", result.error);
            return [];
        }

        return (result.data || []) as UserNotificationTypePreference[];
    } catch (error) {
        console.error("Error in getAllNotificationTypePreferences:", error);
        return [];
    }
};

/**
 * Get preference for a specific notification type
 */
export const getNotificationTypePreference = async (
    businessId: string,
    userId: string,
    notificationType: NotificationTypeOptions
): Promise<UserNotificationTypePreference | null> => {
    try {
        const result = await selectNotificationTypePreferences({
            filter: {
                user_id: userId,
                business_id: businessId,
                notification_type: notificationType
            }
        }, businessId);

        if (result.error || !result.data || result.data.length === 0) {
            return null;
        }

        return result.data[0] as UserNotificationTypePreference;
    } catch (error) {
        console.error("Error in getNotificationTypePreference:", error);
        return null;
    }
};

/**
 * Create or update a notification type preference
 */
export const setNotificationTypePreference = async (
    businessId: string,
    userId: string,
    notificationType: NotificationTypeOptions,
    preferences: {
        email_enabled?: boolean;
        push_enabled?: boolean;
        in_app_enabled?: boolean;
    }
): Promise<{ data?: UserNotificationTypePreference; error?: string }> => {
    try {
        // Check if preference already exists
        const existing = await getNotificationTypePreference(businessId, userId, notificationType);

        if (existing) {
            // Update existing preference
            const updateData: UserNotificationTypePreferenceUpdate = {
                ...preferences,
                updated_at: new Date().toISOString(),
                created_by: userId,
                updated_by: userId
            };

            const result = await updateNotificationTypePreference(updateData, businessId, userId);
            if (result.error) {
                return { error: result.error };
            }

            return { data: result.data as UserNotificationTypePreference };
        } else {
            // Create new preference
            const insertData: UserNotificationTypePreferenceInsert = {
                id: crypto.randomUUID(),
                user_id: userId,
                business_id: businessId,
                notification_type: notificationType,
                email_enabled: preferences.email_enabled ?? true,
                push_enabled: preferences.push_enabled ?? true,
                in_app_enabled: preferences.in_app_enabled ?? true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: userId,
                updated_by: userId
            };

            const result = await insertNotificationTypePreference(insertData, businessId, userId);
            if (result.error) {
                return { error: result.error };
            }

            return { data: result.data as UserNotificationTypePreference };
        }
    } catch (error) {
        console.error("Error in setNotificationTypePreference:", error);
        return { error: "Failed to set notification type preference" };
    }
};

/**
 * Bulk create/update notification type preferences
 */
export const setBulkNotificationTypePreferences = async (
    businessId: string,
    userId: string,
    preferences: Array<{
        notificationType: NotificationTypeOptions;
        email_enabled?: boolean;
        push_enabled?: boolean;
        in_app_enabled?: boolean;
    }>
): Promise<{ data?: UserNotificationTypePreference[]; error?: string }> => {
    try {
        const results: UserNotificationTypePreference[] = [];
        const errors: string[] = [];

        for (const pref of preferences) {
            const result = await setNotificationTypePreference(
                businessId,
                userId,
                pref.notificationType,
                {
                    email_enabled: pref.email_enabled,
                    push_enabled: pref.push_enabled,
                    in_app_enabled: pref.in_app_enabled
                }
            );

            if (result.error) {
                errors.push(`${pref.notificationType}: ${result.error}`);
            } else if (result.data) {
                results.push(result.data);
            }
        }

        if (errors.length > 0) {
            return { error: `Failed to set some preferences: ${errors.join(', ')}` };
        }

        return { data: results };
    } catch (error) {
        console.error("Error in setBulkNotificationTypePreferences:", error);
        return { error: "Failed to set bulk notification type preferences" };
    }
};

/**
 * Delete a notification type preference (revert to default)
 */
export const deleteNotificationTypePreference = async (
    businessId: string,
    userId: string,
    notificationType: NotificationTypeOptions
): Promise<{ data?: boolean; error?: string }> => {
    try {
        const existing = await getNotificationTypePreference(businessId, userId, notificationType);
        if (!existing) {
            return { data: true }; // Already doesn't exist
        }

        const result = await deleteNotificationTypePref(existing.id, businessId, userId);
        if (result.error) {
            return { error: result.error };
        }

        return { data: true };
    } catch (error) {
        console.error("Error in deleteNotificationTypePreference:", error);
        return { error: "Failed to delete notification type preference" };
    }
};

/**
 * Initialize default preferences for a new user
 */
export const initializeDefaultNotificationTypePreferences = async (
    businessId: string,
    userId: string
): Promise<{ data?: UserNotificationTypePreference[]; error?: string }> => {
    try {
        const defaultPreferences = notificationTypeOptions.map(type => ({
            notificationType: type,
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true
        }));

        return await setBulkNotificationTypePreferences(businessId, userId, defaultPreferences);
    } catch (error) {
        console.error("Error in initializeDefaultNotificationTypePreferences:", error);
        return { error: "Failed to initialize default preferences" };
    }
};

/**
 * Get user's effective notification settings for a specific type
 * Combines global preferences with type-specific preferences
 */
export const getEffectiveNotificationSettings = async (
    businessId: string,
    userId: string,
    notificationType: NotificationTypeOptions
): Promise<{
    email_enabled: boolean;
    push_enabled: boolean;
    in_app_enabled: boolean;
}> => {
    try {
        // Get type-specific preference
        const typePreference = await getNotificationTypePreference(businessId, userId, notificationType);

        if (typePreference) {
            return {
                email_enabled: typePreference.email_enabled,
                push_enabled: typePreference.push_enabled,
                in_app_enabled: typePreference.in_app_enabled
            };
        }

        // Fall back to defaults if no specific preference exists
        return {
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true
        };
    } catch (error) {
        console.error("Error in getEffectiveNotificationSettings:", error);
        // Safe defaults
        return {
            email_enabled: false,
            push_enabled: false,
            in_app_enabled: true
        };
    }
};

// Export commonly used functions with shorter names
export {
    getAllNotificationTypePreferences as getNotificationTypePreferences,
    setNotificationTypePreference as updateNotificationTypePreference,
    initializeDefaultNotificationTypePreferences as initUserNotificationDefaults
};
