"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import {
    UserNotificationTypePreference,
    UserNotificationTypePreferenceInsert,
    UserNotificationTypePreferenceUpdate,
    NotificationTypeOptions,
    notificationTypeOptions
} from "@/types/notifications";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

// Get type-specific preferences for all notification types for a user
export const getAllNotificationTypePreferences = async (userId: string): Promise<UserNotificationTypePreference[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("user_notification_type_preferences", business.id, "*", {
        filter: { user_id: userId },
        orderBy: { column: "notification_type", ascending: true },
    });

    if (error) {
        console.error("Error fetching notification type preferences:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as UserNotificationTypePreference[];
    }

    return data as unknown as UserNotificationTypePreference[];
};

// Get preferences for a specific notification type for a user
export const getNotificationTypePreference = async (
    userId: string,
    notificationType: NotificationTypeOptions
): Promise<UserNotificationTypePreference | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("user_notification_type_preferences", business.id, "*", {
        filter: {
            user_id: userId,
            notification_type: notificationType
        },
    });

    if (error) {
        console.error("Error fetching notification type preference:", error);
        return null;
    }

    if (!data || data.length === 0) {
        return null;
    }

    return data[0] as unknown as UserNotificationTypePreference;
};

// Update preferences for a specific notification type for a user
export const updateNotificationTypePreference = async (
    userId: string,
    notificationType: NotificationTypeOptions,
    preferences: UserNotificationTypePreferenceUpdate
): Promise<UserNotificationTypePreference | null> => {
    const { business } = await withBusinessServer();

    // Check if preferences exist for this type
    const { data: existingPrefs } = await fetchByBusiness("user_notification_type_preferences", business.id, "*", {
        filter: {
            user_id: userId,
            notification_type: notificationType
        },
    });

    preferences = await applyUpdated<UserNotificationTypePreferenceUpdate>(preferences);

    if (existingPrefs && existingPrefs.length > 0) {
        // Update existing preferences
        const { data, error } = await updateWithBusinessCheck(
            "user_notification_type_preferences",
            (existingPrefs[0] as unknown as UserNotificationTypePreference).id,
            preferences,
            business.id
        );

        if (error) {
            console.error("Error updating notification type preference:", error);
            return null;
        }

        return data as UserNotificationTypePreference;
    } else {
        // Create new preferences
        const newPrefs: UserNotificationTypePreferenceInsert = {
            user_id: userId,
            notification_type: notificationType,
            ...preferences
        };

        const { data, error } = await insertWithBusiness(
            "user_notification_type_preferences",
            await applyCreated<UserNotificationTypePreferenceInsert>(newPrefs),
            business.id
        );

        if (error) {
            console.error("Error creating notification type preference:", error);
            return null;
        }

        return data as UserNotificationTypePreference;
    }
};

// Delete preferences for a specific notification type for a user
export const deleteNotificationTypePreference = async (
    userId: string,
    notificationType: NotificationTypeOptions
): Promise<boolean> => {
    const { business } = await withBusinessServer();

    // Find the preference first
    const { data: existingPrefs } = await fetchByBusiness("user_notification_type_preferences", business.id, "*", {
        filter: {
            user_id: userId,
            notification_type: notificationType
        },
    });

    if (!existingPrefs || existingPrefs.length === 0) {
        return true; // Nothing to delete
    }

    const { error } = await deleteWithBusinessCheck(
        "user_notification_type_preferences",
        (existingPrefs[0] as unknown as UserNotificationTypePreference).id,
        business.id
    );

    if (error) {
        console.error("Error deleting notification type preference:", error);
        return false;
    }

    return true;
};

// Initialize default notification type preferences for a new user
export const initializeDefaultNotificationTypePreferences = async (userId: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    try {
        // Create default preferences for each notification type
        const createPromises = Object.keys(notificationTypeOptions).map(async (type) => {
            const defaultPrefs = {
                user_id: userId,
                notification_type: type as NotificationTypeOptions,
                email_enabled: true,
                push_enabled: true,
                in_app_enabled: true,
            } as UserNotificationTypePreferenceInsert;

            return insertWithBusiness(
                "user_notification_type_preferences",
                await applyCreated<UserNotificationTypePreferenceInsert>(defaultPrefs),
                business.id
            );
        });

        await Promise.all(createPromises);
        return true;
    } catch (error) {
        console.error("Error initializing default notification type preferences:", error);
        return false;
    }
};

// Get notification types that a user has enabled for a specific channel
export const getEnabledNotificationTypes = async (
    userId: string,
    channel: 'email' | 'push' | 'in_app'
): Promise<NotificationTypeOptions[]> => {
    const { business } = await withBusinessServer();

    const channelField = `${channel}_enabled`;

    const { data, error } = await fetchByBusiness("user_notification_type_preferences", business.id, "*", {
        filter: {
            user_id: userId,
            [channelField]: true
        },
    });

    if (error) {
        console.error("Error fetching enabled notification types:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return (data as unknown as UserNotificationTypePreference[]).map(pref => pref.notification_type) as NotificationTypeOptions[];
};
