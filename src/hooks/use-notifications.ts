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
import { createNotificationWithEmail } from "@/app/actions/notifications";
import {
    NotificationTypeOptions,
    NotificationChannelOptions,
    notificationTypeOptions,
    NotificationInsert
} from "@/types/notifications";
import { useBusiness } from "@/lib/business-context";

interface UseNotificationsProps {
    userId: string;
}

export function useNotifications({ userId }: UseNotificationsProps) {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [preferences, setPreferences] = useState({
        email: true,
        push: false,
        inApp: true,
        types: {} as Record<NotificationTypeOptions, {
            [key in NotificationChannelOptions]: boolean;
        }>
    });    // Load notification preferences
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        async function loadPreferences() {
            console.log("useNotifications effect triggered with:", { userId, businessId });

            if (!businessId || businessId === "") {
                console.log("No businessId available, skipping notification preferences load");
                setLoading(false);
                return;
            }
            if (!userId || userId === "") {
                console.log("No userId available, skipping notification preferences load");
                setLoading(false);
                return;
            }

            console.log("Loading notification preferences for user:", userId, "business:", businessId);

            try {
                setLoading(true);

                // Set a timeout to prevent infinite loading
                timeoutId = setTimeout(() => {
                    console.warn("Notification preferences loading timed out");
                    setLoading(false);
                }, 10000); // 10 second timeout

                // Load global preferences
                console.log("Fetching global preferences...");
                const globalPrefs = await getUserNotificationPreferences(businessId, userId);
                console.log("Global preferences result:", globalPrefs);

                const globalSettings = globalPrefs[0] || {
                    email_enabled: true,
                    push_enabled: false,
                    in_app_enabled: true
                };

                // Load type-specific preferences
                console.log("Fetching type preferences...");
                const typePrefs = await getAllNotificationTypePreferences(businessId, userId);
                console.log("Type preferences result:", typePrefs);

                const typeSettings: Record<string, any> = {};

                // If no type preferences exist, initialize defaults
                if (typePrefs.length === 0) {
                    console.log("No type preferences found, initializing defaults");
                    const initResult = await initializeDefaultNotificationTypePreferences(businessId, userId);
                    console.log("Initialization result:", initResult);

                    if (initResult) {
                        // Reload type preferences after initialization
                        const initializedPrefs = await getAllNotificationTypePreferences(businessId, userId);
                        console.log("Reloaded type preferences:", initializedPrefs);

                        initializedPrefs.forEach(pref => {
                            typeSettings[pref.notification_type] = {
                                email: pref.email_enabled,
                                push: pref.push_enabled,
                                inApp: pref.in_app_enabled
                            };
                        });
                    }
                } else {
                    typePrefs.forEach(pref => {
                        typeSettings[pref.notification_type] = {
                            email: pref.email_enabled,
                            push: pref.push_enabled,
                            inApp: pref.in_app_enabled
                        };
                    });
                }

                console.log("Final type settings:", typeSettings);

                setPreferences({
                    email: globalSettings.email_enabled,
                    push: globalSettings.push_enabled,
                    inApp: globalSettings.in_app_enabled,
                    types: typeSettings as Record<NotificationTypeOptions, {
                        [key in NotificationChannelOptions]: boolean;
                    }>
                });

                console.log("Notification preferences loaded successfully");
                clearTimeout(timeoutId);
            } catch (error) {
                console.error("Error loading notification preferences:", error);
                clearTimeout(timeoutId);
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [userId, businessId]); // Added businessId to dependency array

    // Update global preferences
    const updateGlobalPreferences = async (channel: NotificationChannelOptions, enabled: boolean) => {
        if (!userId) return;

        try {
            const update = {
                [`${channel}_enabled`]: enabled,
                created_by: userId,
                updated_by: userId
            };

            await updateUserNotificationPreferences(businessId, userId, update);
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

            await updateNotificationTypePreference(businessId, userId, type, update);
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

            await createNotificationWithEmail(businessId, notification, true, userId);
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
