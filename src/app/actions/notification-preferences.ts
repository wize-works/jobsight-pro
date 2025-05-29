"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { UserNotificationPreference, UserNotificationPreferenceInsert, UserNotificationPreferenceUpdate } from "@/types/notifications";
import { UserNotificationTypePreference, UserNotificationTypePreferenceInsert, UserNotificationTypePreferenceUpdate } from "@/types/notifications";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

// Get notification preferences for a user
export const getUserNotificationPreferences = async (userId: string): Promise<UserNotificationPreference[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("user_notification_preferences", business.id, "*", {
        filter: { user_id: userId },
    });

    if (error) {
        console.error("Error fetching user notification preferences:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as UserNotificationPreference[];
    }

    return data as unknown as UserNotificationPreference[];
};

// Create or update notification preferences for a user
export const updateUserNotificationPreferences = async (
    userId: string,
    preferences: UserNotificationPreferenceUpdate
): Promise<UserNotificationPreference | null> => {
    const { business } = await withBusinessServer();

    // First check if preferences exist
    const { data: existingPrefs } = await fetchByBusiness("user_notification_preferences", business.id, "*", {
        filter: { user_id: userId },
    });

    preferences = await applyUpdated<UserNotificationPreferenceUpdate>(preferences);

    if (Array.isArray(existingPrefs) && existingPrefs.length > 0 && 'id' in existingPrefs[0]) {
        // Update existing preferences
        const { data, error } = await updateWithBusinessCheck(
            "user_notification_preferences",
            (existingPrefs[0] as { id: string }).id,
            preferences,
            business.id
        );

        if (error) {
            console.error("Error updating user notification preferences:", error);
            return null;
        }

        return data as UserNotificationPreference;
    } else {
        // Create new preferences
        const newPrefs: UserNotificationPreferenceInsert = {
            user_id: userId,
            ...preferences
        };

        const { data, error } = await insertWithBusiness(
            "user_notification_preferences",
            await applyCreated<UserNotificationPreferenceInsert>(newPrefs),
            business.id
        );

        if (error) {
            console.error("Error creating user notification preferences:", error);
            return null;
        }

        return data as UserNotificationPreference;
    }
};

// Get type-specific notification preferences for a user
export const getUserNotificationTypePreferences = async (userId: string): Promise<UserNotificationTypePreference[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("user_notification_type_preferences", business.id, "*", {
        filter: { user_id: userId },
    });

    if (error) {
        console.error("Error fetching user notification type preferences:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as UserNotificationTypePreference[];
    }

    return data as unknown as UserNotificationTypePreference[];
};

// Create or update type-specific notification preferences for a user
export const updateUserNotificationTypePreferences = async (
    userId: string,
    notificationType: string,
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

    // Ensure existingPrefs is an array and has id property
    if (Array.isArray(existingPrefs) && existingPrefs.length > 0 && 'id' in existingPrefs[0]) {
        // Update existing preferences
        const { data, error } = await updateWithBusinessCheck(
            "user_notification_type_preferences",
            (existingPrefs[0] as { id: string }).id,
            preferences,
            business.id
        );

        if (error) {
            console.error("Error updating user notification type preferences:", error);
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
            console.error("Error creating user notification type preferences:", error);
            return null;
        }

        return data as UserNotificationTypePreference;
    }
};

// Delete type-specific notification preferences for a user
export const deleteUserNotificationTypePreferences = async (
    userId: string,
    notificationType: string
): Promise<boolean> => {
    const { business } = await withBusinessServer();

    // Find the preference ID first
    const { data: existingPrefs } = await fetchByBusiness("user_notification_type_preferences", business.id, "*", {
        filter: {
            user_id: userId,
            notification_type: notificationType
        },
    });

    if (!existingPrefs || existingPrefs.length === 0) {
        return true; // Nothing to delete
    }

    // Ensure existingPrefs[0] has an id property before proceeding
    if (!('id' in existingPrefs[0])) {
        console.error("Error: existingPrefs[0] does not have an id property.", existingPrefs[0]);
        return false;
    }

    const { error } = await deleteWithBusinessCheck(
        "user_notification_type_preferences",
        (existingPrefs[0] as { id: string }).id,
        business.id
    );

    if (error) {
        console.error("Error deleting user notification type preferences:", error);
        return false;
    }

    return true;
};
