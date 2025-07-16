import { useState, useEffect } from 'react';
import {
    notificationTypePreferenceApi,
    NotificationTypePreferenceQuery,
    notificationTypePreferenceUtils,
    CreateNotificationTypePreferenceData,
    UpdateNotificationTypePreferenceData
} from '@/lib/api/notification-type-preferences';
import {
    UserNotificationTypePreference,
    NotificationTypeOptions
} from '@/types/notifications';

// Hook for fetching notification type preferences
export const useNotificationTypePreferences = (query: NotificationTypePreferenceQuery) => {
    const [preferences, setPreferences] = useState<UserNotificationTypePreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationTypePreferenceApi.getNotificationTypePreferences(query);
            setPreferences(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notification type preferences');
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

// Hook for user-specific notification type preferences
export const useUserNotificationTypePreferences = (businessId: string, userId: string) => {
    const [preferences, setPreferences] = useState<UserNotificationTypePreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserPreferences = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationTypePreferenceUtils.getAllUserPreferences(businessId, userId);
            setPreferences(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user notification type preferences');
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

// Hook for specific notification type preference
export const useNotificationTypePreference = (
    businessId: string,
    userId: string,
    notificationType: NotificationTypeOptions
) => {
    const [preference, setPreference] = useState<UserNotificationTypePreference | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPreference = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationTypePreferenceUtils.getTypePreference(businessId, userId, notificationType);
            setPreference(response.data.length > 0 ? response.data[0] : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notification type preference');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId && userId && notificationType) {
            fetchPreference();
        }
    }, [businessId, userId, notificationType]);

    return {
        preference,
        loading,
        error,
        refetch: fetchPreference,
    };
};

// Hook for managing notification type preferences
export const useNotificationTypePreferenceMutations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createOrUpdatePreference = async (data: CreateNotificationTypePreferenceData) => {
        try {
            setLoading(true);
            setError(null);

            // Validate notification type
            if (!notificationTypePreferenceUtils.validateNotificationType(data.notificationType)) {
                throw new Error('Invalid notification type');
            }

            const response = await notificationTypePreferenceApi.createOrUpdateNotificationTypePreference(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create/update notification type preference');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updatePreference = async (
        id: string,
        businessId: string,
        preferences: UpdateNotificationTypePreferenceData
    ) => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationTypePreferenceApi.updateNotificationTypePreference(
                id,
                businessId,
                preferences
            );
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update notification type preference');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deletePreference = async (
        businessId: string,
        id?: string,
        userId?: string,
        notificationType?: NotificationTypeOptions
    ) => {
        try {
            setLoading(true);
            setError(null);
            await notificationTypePreferenceApi.deleteNotificationTypePreference(
                businessId,
                id,
                userId,
                notificationType
            );
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete notification type preference');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createOrUpdatePreference,
        updatePreference,
        deletePreference,
        loading,
        error,
    };
};

// Hook for managing user notification type settings
export const useUserNotificationTypeSettings = (businessId: string, userId: string) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initializeDefaultPreferences = async () => {
        try {
            setLoading(true);
            setError(null);
            const success = await notificationTypePreferenceUtils.initializeDefaultPreferences(businessId, userId);
            if (!success) {
                throw new Error('Failed to initialize default preferences');
            }
            return success;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize default preferences');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateTypePreference = async (
        notificationType: NotificationTypeOptions,
        preferences: UpdateNotificationTypePreferenceData
    ) => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationTypePreferenceUtils.updateTypePreference(
                businessId,
                userId,
                notificationType,
                preferences
            );
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update type preference');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const toggleNotificationType = async (notificationType: NotificationTypeOptions, enabled: boolean) => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationTypePreferenceUtils.toggleNotificationType(
                businessId,
                userId,
                notificationType,
                enabled
            );
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle notification type');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const toggleNotificationTypeChannel = async (
        notificationType: NotificationTypeOptions,
        channel: 'email' | 'push' | 'in_app',
        enabled: boolean
    ) => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationTypePreferenceUtils.toggleNotificationTypeChannel(
                businessId,
                userId,
                notificationType,
                channel,
                enabled
            );
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle notification type channel');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteTypePreference = async (notificationType: NotificationTypeOptions) => {
        try {
            setLoading(true);
            setError(null);
            await notificationTypePreferenceUtils.deleteTypePreference(businessId, userId, notificationType);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete type preference');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        initializeDefaultPreferences,
        updateTypePreference,
        toggleNotificationType,
        toggleNotificationTypeChannel,
        deleteTypePreference,
        loading,
        error,
    };
};

// Hook for enabled notification types by channel
export const useEnabledNotificationTypes = (
    businessId: string,
    userId: string,
    channel: 'email' | 'push' | 'in_app'
) => {
    const [enabledTypes, setEnabledTypes] = useState<NotificationTypeOptions[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEnabledTypes = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationTypePreferenceUtils.getEnabledNotificationTypes(
                businessId,
                userId,
                channel
            );
            setEnabledTypes(response.data.map(pref => pref.notification_type as NotificationTypeOptions));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch enabled notification types');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId && userId && channel) {
            fetchEnabledTypes();
        }
    }, [businessId, userId, channel]);

    return {
        enabledTypes,
        loading,
        error,
        refetch: fetchEnabledTypes,
    };
};

// Hook for notification type preference utilities
export const useNotificationTypePreferenceUtils = () => {
    return {
        isNotificationTypeEnabled: notificationTypePreferenceUtils.isNotificationTypeEnabled,
        isNotificationTypeChannelEnabled: notificationTypePreferenceUtils.isNotificationTypeChannelEnabled,
        getEnabledTypesForChannel: notificationTypePreferenceUtils.getEnabledTypesForChannel,
        getTypeStatistics: notificationTypePreferenceUtils.getTypeStatistics,
        validateNotificationType: notificationTypePreferenceUtils.validateNotificationType,
        getNotificationTypeInfo: notificationTypePreferenceUtils.getNotificationTypeInfo,
    };
};

// Hook for notification type preference statistics
export const useNotificationTypePreferenceStats = (preferences: UserNotificationTypePreference[]) => {
    const [stats, setStats] = useState({
        totalTypes: 0,
        enabledTypes: { email: 0, push: 0, in_app: 0 },
        disabledTypes: { email: 0, push: 0, in_app: 0 },
    });

    useEffect(() => {
        const newStats = notificationTypePreferenceUtils.getTypeStatistics(preferences);
        setStats(newStats);
    }, [preferences]);

    return stats;
};
