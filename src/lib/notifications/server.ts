import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import {
    UserNotificationPreference,
    UserNotificationPreferenceInsert,
    UserNotificationPreferenceUpdate,
    UserNotificationTypePreference,
    UserNotificationTypePreferenceInsert,
    UserNotificationTypePreferenceUpdate,
    Notification,
    NotificationInsert,
    NotificationUpdate,
    NotificationTypeOptions,
    notificationTypeOptions
} from "@/types/notifications";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

// ============= Business Users =============

export const getBusinessUsers = async (businessId: string) => {
    const { data, error } = await fetchByBusiness("users", businessId, "*");

    if (error) {
        console.error("Error fetching business users:", error);
        return [];
    }

    return data || [];
};

// ============= User Notification Preferences =============

export const getUserNotificationPreferencesServer = async (
    businessId: string,
    userId: string
): Promise<UserNotificationPreference[]> => {
    const { data, error } = await fetchByBusiness("user_notification_preferences", businessId, "*", {
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

export const updateUserNotificationPreferencesServer = async (
    businessId: string,
    userId: string,
    preferences: UserNotificationPreferenceUpdate
): Promise<UserNotificationPreference | null> => {
    // First check if preferences exist
    const { data: existingPrefs } = await fetchByBusiness("user_notification_preferences", businessId, "*", {
        filter: { user_id: userId },
    });

    const updatedPreferences = await applyUpdated<UserNotificationPreferenceUpdate>(preferences);

    if (Array.isArray(existingPrefs) && existingPrefs.length > 0 && 'id' in existingPrefs[0]) {
        // Update existing preferences
        const { data, error } = await updateWithBusinessCheck(
            "user_notification_preferences",
            (existingPrefs[0] as { id: string }).id,
            updatedPreferences,
            businessId
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
            ...updatedPreferences
        };

        const { data, error } = await insertWithBusiness(
            "user_notification_preferences",
            await applyCreated<UserNotificationPreferenceInsert>(newPrefs),
            businessId
        );

        if (error) {
            console.error("Error creating user notification preferences:", error);
            return null;
        }

        return data as UserNotificationPreference;
    }
};

// ============= User Notification Type Preferences =============

export const getAllNotificationTypePreferencesServer = async (
    businessId: string,
    userId: string
): Promise<UserNotificationTypePreference[]> => {
    const { data, error } = await fetchByBusiness("user_notification_type_preferences", businessId, "*", {
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

export const getNotificationTypePreferenceServer = async (
    businessId: string,
    userId: string,
    notificationType: NotificationTypeOptions
): Promise<UserNotificationTypePreference | null> => {
    const { data, error } = await fetchByBusiness("user_notification_type_preferences", businessId, "*", {
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

export const updateNotificationTypePreferenceServer = async (
    businessId: string,
    userId: string,
    notificationType: NotificationTypeOptions,
    preferences: UserNotificationTypePreferenceUpdate
): Promise<UserNotificationTypePreference | null> => {
    // Check if preferences exist for this type
    const { data: existingPrefs } = await fetchByBusiness("user_notification_type_preferences", businessId, "*", {
        filter: {
            user_id: userId,
            notification_type: notificationType
        },
    });

    const updatedPreferences = await applyUpdated<UserNotificationTypePreferenceUpdate>(preferences);

    if (existingPrefs && existingPrefs.length > 0) {
        // Update existing preferences
        const { data, error } = await updateWithBusinessCheck(
            "user_notification_type_preferences",
            (existingPrefs[0] as unknown as UserNotificationTypePreference).id,
            updatedPreferences,
            businessId
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
            ...updatedPreferences
        };

        const { data, error } = await insertWithBusiness(
            "user_notification_type_preferences",
            await applyCreated<UserNotificationTypePreferenceInsert>(newPrefs),
            businessId
        );

        if (error) {
            console.error("Error creating notification type preference:", error);
            return null;
        }

        return data as UserNotificationTypePreference;
    }
};

export const deleteNotificationTypePreferenceServer = async (
    businessId: string,
    userId: string,
    notificationType: NotificationTypeOptions
): Promise<boolean> => {
    // Find the preference first
    const { data: existingPrefs } = await fetchByBusiness("user_notification_type_preferences", businessId, "*", {
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
        businessId
    );

    if (error) {
        console.error("Error deleting notification type preference:", error);
        return false;
    }

    return true;
};

export const initializeDefaultNotificationTypePreferencesServer = async (
    businessId: string,
    userId: string
): Promise<boolean> => {
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
                businessId
            );
        });

        await Promise.all(createPromises);
        return true;
    } catch (error) {
        console.error("Error initializing default notification type preferences:", error);
        return false;
    }
};

export const getEnabledNotificationTypesServer = async (
    businessId: string,
    userId: string,
    channel: 'email' | 'push' | 'in_app'
): Promise<NotificationTypeOptions[]> => {
    const channelField = `${channel}_enabled`;

    const { data, error } = await fetchByBusiness("user_notification_type_preferences", businessId, "*", {
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

// ============= Notifications =============

export const getNotificationsServer = async (businessId: string): Promise<Notification[]> => {
    const { data, error } = await fetchByBusiness("notifications", businessId, "*", {
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Notification[];
    }

    return data as unknown as Notification[];
};

export const getNotificationByIdServer = async (
    businessId: string,
    id: string
): Promise<Notification | null> => {
    const { data, error } = await fetchByBusiness("notifications", businessId, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching notification by ID:", error);
        return null;
    }

    if (data && data.length > 0) {
        return data[0] as unknown as Notification;
    }

    return null;
};

export const createNotificationServer = async (
    businessId: string,
    notification: NotificationInsert
): Promise<Notification | null> => {
    const { data, error } = await insertWithBusiness("notifications", notification, businessId);

    if (error) {
        console.error("Error creating notification:", error);
        return null;
    }

    return data as Notification;
};

export const createNotificationWithEmailServer = async (
    businessId: string,
    notification: NotificationInsert,
    sendEmail: boolean = true,
    excludeUserId?: string
): Promise<Notification | null> => {
    // Create the in-app notification
    const createdNotification = await createNotificationServer(businessId, notification);

    if (!createdNotification) {
        return null;
    }

    // Send email notifications if enabled
    if (sendEmail) {
        try {
            // Make internal API call to send bulk email notifications
            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email-notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    notification,
                    excludeUserId: excludeUserId || notification.user_id,
                }),
            });

            if (emailResponse.ok) {
                const emailResults = await emailResponse.json();
                console.log(`Email notifications sent: ${emailResults.successful || 0} successful, ${emailResults.failed || 0} failed`);
            } else {
                console.error('Failed to send email notifications:', emailResponse.statusText);
            }
        } catch (error) {
            console.error("Error sending email notifications:", error);
            // Don't fail the notification creation if email fails
        }
    }

    return createdNotification;
};

export const updateNotificationServer = async (
    businessId: string,
    id: string,
    notification: NotificationUpdate
): Promise<Notification | null> => {
    const { data, error } = await updateWithBusinessCheck("notifications", id, notification, businessId);

    if (error) {
        console.error("Error updating notification:", error);
        return null;
    }

    return data as Notification;
};

export const deleteNotificationServer = async (businessId: string, id: string): Promise<boolean> => {
    const { error } = await deleteWithBusinessCheck("notifications", id, businessId);

    if (error) {
        console.error("Error deleting notification:", error);
        return false;
    }

    return true;
};

export const getNotificationsByUserIdServer = async (
    businessId: string,
    userId: string
): Promise<Notification[]> => {
    const { data, error } = await fetchByBusiness("notifications", businessId, "*", {
        filter: { user_id: userId },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching notifications for user:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Notification[];
    }

    return data as unknown as Notification[];
};

export const markNotificationAsReadServer = async (
    businessId: string,
    id: string
): Promise<Notification | null> => {
    const notification: NotificationUpdate = {
        read: true,
        read_at: new Date().toISOString(),
    };

    const { data, error } = await updateWithBusinessCheck("notifications", id, notification, businessId);

    if (error) {
        console.error("Error marking notification as read:", error);
        return null;
    }

    return data as Notification;
};

export const getUnreadNotificationsServer = async (
    businessId: string,
    userId: string
): Promise<Notification[]> => {
    const { data, error } = await fetchByBusiness("notifications", businessId, "*", {
        filter: {
            user_id: userId,
            read: false
        },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching unread notifications:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Notification[];
    }

    return data as unknown as Notification[];
};

export const markAllNotificationsAsReadServer = async (
    businessId: string,
    userId: string
): Promise<boolean> => {
    const now = new Date().toISOString();
    const { data: unreadNotifications, error } = await fetchByBusiness("notifications", businessId, "*", {
        filter: {
            user_id: userId,
            read: false
        }
    });

    if (error) {
        console.error("Error fetching unread notifications:", error);
        return false;
    }

    if (!unreadNotifications || unreadNotifications.length === 0) {
        return true;
    }

    // Update all unread notifications in parallel
    const updatePromises = (unreadNotifications as unknown as Notification[]).map(notification =>
        updateWithBusinessCheck("notifications", notification.id, {
            read: true,
            read_at: now
        }, businessId)
    );

    try {
        await Promise.all(updatePromises);
        return true;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
    }
};
