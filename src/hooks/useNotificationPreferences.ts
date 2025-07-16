import { useState, useEffect } from 'react';
import {
    notificationPreferenceApi,
    NotificationPreferenceQuery,
    notificationPreferenceUtils
} from '@/lib/api/notification-preferences';
import { UserNotificationPreference, UserNotificationPreferenceUpdate } from '@/types/notifications';

// Hook for fetching notification preferences
export const useNotificationPreferences = (query: NotificationPreferenceQuery) => {
    const [preferences, setPreferences] = useState<UserNotificationPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationPreferenceApi.getNotificationPreferences(query);
            setPreferences(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notification preferences');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreferences();
    }, [JSON.stringify(query)]);

    return {
        preferences,
        loading,
        error,
        count,
        refetch: fetchPreferences,
    };
};

// Hook for user-specific notification preferences
export const useUserNotificationPreferences = (businessId: string, userId: string) => {
    const [preferences, setPreferences] = useState<UserNotificationPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserPreferences = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationPreferenceUtils.getUserPreferences(businessId, userId);
            setPreferences(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user notification preferences');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId && userId) {
            fetchUserPreferences();
        }
    }, [businessId, userId]);

    return {
        preferences,
        loading,
        error,
        refetch: fetchUserPreferences,
    };
};

// Hook for managing notification preferences
export const useNotificationPreferenceMutations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createOrUpdatePreferences = async (
        businessId: string,
        userId: string,
        preferences: Partial<UserNotificationPreferenceUpdate>
    ) => {
        try {
            setLoading(true);
            setError(null);

            // Validate preferences
            const validationErrors = notificationPreferenceUtils.validatePreferences(preferences);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            const response = await notificationPreferenceApi.createOrUpdateNotificationPreferences(
                businessId,
                userId,
                preferences
            );
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update notification preferences');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updatePreferences = async (
        id: string,
        businessId: string,
        preferences: UserNotificationPreferenceUpdate
    ) => {
        try {
            setLoading(true);
            setError(null);

            // Validate preferences
            const validationErrors = notificationPreferenceUtils.validatePreferences(preferences);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            const response = await notificationPreferenceApi.updateNotificationPreferences(
                id,
                businessId,
                preferences
            );
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update notification preferences');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deletePreferences = async (id: string, businessId: string) => {
        try {
            setLoading(true);
            setError(null);
            await notificationPreferenceApi.deleteNotificationPreferences(id, businessId);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete notification preferences');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createOrUpdatePreferences,
        updatePreferences,
        deletePreferences,
        loading,
        error,
    };
};

// Hook for managing user-specific settings
export const useUserNotificationSettings = (businessId: string, userId: string) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createDefaultPreferences = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationPreferenceUtils.createDefaultPreferences(businessId, userId);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create default preferences');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const toggleAllNotifications = async (enabled: boolean) => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationPreferenceUtils.toggleAllNotifications(businessId, userId, enabled);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle all notifications');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updatePreferenceSettings = async (settings: Partial<UserNotificationPreferenceUpdate>) => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationPreferenceUtils.updatePreferenceSettings(businessId, userId, settings);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update preference settings');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createDefaultPreferences,
        toggleAllNotifications,
        updatePreferenceSettings,
        loading,
        error,
    };
};

// Hook for notification preference utilities
export const useNotificationPreferenceUtils = () => {
    return {
        areNotificationsEnabled: notificationPreferenceUtils.areNotificationsEnabled,
        isWithinQuietHours: notificationPreferenceUtils.isWithinQuietHours,
        getUserTimezone: notificationPreferenceUtils.getUserTimezone,
        getEmailDigestFrequency: notificationPreferenceUtils.getEmailDigestFrequency,
        validatePreferences: notificationPreferenceUtils.validatePreferences,
    };
};

// Hook for notification preference status
export const useNotificationPreferenceStatus = (preferences: UserNotificationPreference[]) => {
    const [status, setStatus] = useState({
        areEnabled: false,
        isWithinQuietHours: false,
        userTimezone: '',
        emailDigestFrequency: 'daily',
    });

    useEffect(() => {
        const areEnabled = notificationPreferenceUtils.areNotificationsEnabled(preferences);
        const isWithinQuietHours = notificationPreferenceUtils.isWithinQuietHours(preferences);
        const userTimezone = notificationPreferenceUtils.getUserTimezone(preferences);
        const emailDigestFrequency = notificationPreferenceUtils.getEmailDigestFrequency(preferences);

        setStatus({
            areEnabled,
            isWithinQuietHours,
            userTimezone,
            emailDigestFrequency,
        });
    }, [preferences]);

    return status;
};
