"use client";

import { useState, useEffect, useRef } from "react";
import {
    getUserNotificationPreferences,
    updateUserNotificationPreferences
} from "@/lib/actions/notification-preferences-client";
import {
    getAllNotificationTypePreferences,
    updateNotificationTypePreference,
    initializeDefaultNotificationTypePreferences
} from "@/lib/actions/notification-type-preferences-client";
import { createNotification } from "@/lib/actions/notifications-client";
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
    });

    // Use refs to prevent stale closures
    const userIdRef = useRef(userId);
    const businessIdRef = useRef(businessId);

    useEffect(() => {
        userIdRef.current = userId;
        businessIdRef.current = businessId;
    }, [userId, businessId]);

    // Load notification preferences
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let isMounted = true;

        async function loadPreferences() {
            console.log("useNotifications effect triggered with:", { userId: userIdRef.current, businessId: businessIdRef.current });

            if (!businessIdRef.current || businessIdRef.current === "") {
                console.log("No businessId available, skipping notification preferences load");
                if (isMounted) setLoading(false);
                return;
            }
            if (!userIdRef.current || userIdRef.current === "") {
                console.log("No userId available, skipping notification preferences load");
                if (isMounted) setLoading(false); return;
            }

            console.log("Loading notification preferences for user:", userIdRef.current, "business:", businessIdRef.current);

            try {
                if (isMounted) setLoading(true);

                // Set a timeout to prevent infinite loading
                timeoutId = setTimeout(() => {
                    console.warn("Notification preferences loading timed out");
                    if (isMounted) setLoading(false);
                }, 10000); // 10 second timeout

                // Load global preferences
                console.log("Fetching global preferences...");
                const globalPrefs = await getUserNotificationPreferences(businessIdRef.current, userIdRef.current);
                console.log("Global preferences result:", globalPrefs);

                if (!isMounted) return; // Component unmounted, don't update state

                const globalSettings = globalPrefs[0] || {
                    email_enabled: true,
                    push_enabled: false,
                    in_app_enabled: true
                };                // Load type-specific preferences
                console.log("Fetching type preferences...");
                const typePrefs = await getAllNotificationTypePreferences(businessIdRef.current, userIdRef.current);
                console.log("Type preferences result:", typePrefs);

                if (!isMounted) return; // Component unmounted, don't update state

                const typeSettings: Record<string, any> = {};

                // If no type preferences exist, initialize defaults
                if (typePrefs.length === 0) {
                    console.log("No type preferences found, initializing defaults");
                    const initResult = await initializeDefaultNotificationTypePreferences(businessIdRef.current, userIdRef.current);
                    console.log("Initialization result:", initResult);

                    if (initResult) {
                        // Reload type preferences after initialization
                        const initializedPrefs = await getAllNotificationTypePreferences(businessIdRef.current, userIdRef.current);
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
                } console.log("Final type settings:", typeSettings);

                if (isMounted) {
                    setPreferences({
                        email: globalSettings.email_enabled,
                        push: globalSettings.push_enabled,
                        inApp: globalSettings.in_app_enabled,
                        types: typeSettings as Record<NotificationTypeOptions, {
                            [key in NotificationChannelOptions]: boolean;
                        }>
                    });
                }

                console.log("Notification preferences loaded successfully");
                clearTimeout(timeoutId);
            } catch (error) {
                console.error("Error loading notification preferences:", error);
                if (isMounted) {
                    setPreferences(prev => prev); // Keep existing state on error
                }
                clearTimeout(timeoutId);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadPreferences();

        return () => {
            isMounted = false;
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

            await createNotification(notification, businessId, userId);
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
