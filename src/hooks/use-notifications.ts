"use client";

import { useState, useEffect } from "react";
import {
    getUserNotificationPreferences,
    updateUserNotificationPreferences
} from "@/app/actions/notification-preferences";
import {
    getAllNotificationTypePreferences,
    updateNotificationTypePreference,
    initializeDefaultNotificationTypePreferences
} from "@/app/actions/notification-type-preferences";
import { createNotification } from "@/app/actions/notifications";
import {
    NotificationTypeOptions,
    NotificationChannelOptions,
    notificationTypeOptions,
    NotificationInsert
} from "@/types/notifications";

interface UseNotificationsProps {
    userId: string;
}

export function useNotifications({ userId }: UseNotificationsProps) {
    const [loading, setLoading] = useState(true);
    const [preferences, setPreferences] = useState({
        email: true,
        push: false,
        inApp: true,
        types: {} as Record<NotificationTypeOptions, {
            [key in NotificationChannelOptions]: boolean;
        }>
    });

    // Load notification preferences
    useEffect(() => {
        async function loadPreferences() {
            if (!userId) return;

            try {
                setLoading(true);

                // Load global preferences
                const globalPrefs = await getUserNotificationPreferences(userId);
                const globalSettings = globalPrefs[0] || {
                    email_enabled: true,
                    push_enabled: false,
                    in_app_enabled: true
                };

                // Load type-specific preferences
                const typePrefs = await getAllNotificationTypePreferences(userId);
                const typeSettings: Record<string, any> = {};

                // If no type preferences exist, initialize defaults
                if (typePrefs.length === 0) {
                    await initializeDefaultNotificationTypePreferences(userId);
                    // Reload type preferences after initialization
                    const initializedPrefs = await getAllNotificationTypePreferences(userId);
                    initializedPrefs.forEach(pref => {
                        typeSettings[pref.notification_type] = {
                            email: pref.email_enabled,
                            push: pref.push_enabled,
                            inApp: pref.in_app_enabled
                        };
                    });
                } else {
                    typePrefs.forEach(pref => {
                        typeSettings[pref.notification_type] = {
                            email: pref.email_enabled,
                            push: pref.push_enabled,
                            inApp: pref.in_app_enabled
                        };
                    });
                }

                setPreferences({
                    email: globalSettings.email_enabled,
                    push: globalSettings.push_enabled,
                    inApp: globalSettings.in_app_enabled,
                    types: typeSettings as Record<NotificationTypeOptions, {
                        [key in NotificationChannelOptions]: boolean;
                    }>
                });
            } catch (error) {
                console.error("Error loading notification preferences:", error);
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, [userId]);

    // Update global preferences
    const updateGlobalPreferences = async (channel: NotificationChannelOptions, enabled: boolean) => {
        if (!userId) return;

        try {
            const update = {
                [`${channel}_enabled`]: enabled,
                created_by: userId,
                updated_by: userId
            };

            await updateUserNotificationPreferences(userId, update);
            setPreferences(prev => ({
                ...prev,
                [channel]: enabled
            }));
        } catch (error) {
            console.error(`Error updating ${channel} preferences:`, error);
            throw error;
        }
    };

    // Update type-specific preferences
    const updateTypePreferences = async (
        type: NotificationTypeOptions,
        channel: NotificationChannelOptions,
        enabled: boolean
    ) => {
        if (!userId) return;

        try {
            const channelKey = `${channel}_enabled`;
            const update = {
                [channelKey]: enabled,
                created_by: userId,
                updated_by: userId
            };

            await updateNotificationTypePreference(userId, type, update);
            setPreferences(prev => ({
                ...prev,
                types: {
                    ...prev.types,
                    [type]: {
                        ...prev.types[type],
                        [channel]: enabled
                    }
                }
            }));
        } catch (error) {
            console.error(`Error updating ${type} ${channel} preferences:`, error);
            throw error;
        }
    };    // Test notification function
    const sendTestNotification = async (notificationType: NotificationTypeOptions) => {
        if (!userId) return;

        try {
            const typeInfo = notificationTypeOptions[notificationType];
            const now = new Date().toISOString();

            const notification: NotificationInsert = {
                user_id: userId,
                type: notificationType,
                title: `Test ${typeInfo.label}`,
                message: `This is a test ${typeInfo.label.toLowerCase()} notification.`,
                read: false,
                read_at: null,
                link: "/dashboard/notifications",
                metadata: {
                    test: true,
                    type: notificationType,
                    description: typeInfo.description
                }
            };
            console.log("Sending notification:", notification);

            await createNotification(notification);
        } catch (error) {
            console.error("Error sending test notification:", error);
            throw error;
        }
    };

    return {
        loading,
        preferences,
        updateGlobalPreferences,
        updateTypePreferences,
        sendTestNotification
    };
}
