import {
    UserNotificationTypePreference,
    UserNotificationTypePreferenceInsert,
    UserNotificationTypePreferenceUpdate,
    NotificationTypeOptions,
    notificationTypeOptions
} from '@/types/notifications';

// API Response Types
export interface NotificationTypePreferenceResponse {
    data: UserNotificationTypePreference[];
    count: number;
}

export interface NotificationTypePreferenceSingleResponse {
    data: UserNotificationTypePreference;
}

// Query Parameters
export interface NotificationTypePreferenceQuery {
    businessId: string;
    userId?: string;
    notificationType?: NotificationTypeOptions;
    channel?: 'email' | 'push' | 'in_app';
}

// Create/Update Data
export interface CreateNotificationTypePreferenceData {
    businessId: string;
    userId: string;
    notificationType: NotificationTypeOptions;
    email_enabled?: boolean;
    push_enabled?: boolean;
    in_app_enabled?: boolean;
}

export interface UpdateNotificationTypePreferenceData {
    email_enabled?: boolean;
    push_enabled?: boolean;
    in_app_enabled?: boolean;
}

// API Client
class NotificationTypePreferenceApiClient {
    private baseUrl = '/api/notification-type-preferences';

    async getNotificationTypePreferences(params: NotificationTypePreferenceQuery): Promise<NotificationTypePreferenceResponse> {
        const searchParams = new URLSearchParams();
        searchParams.append('businessId', params.businessId);

        if (params.userId) {
            searchParams.append('userId', params.userId);
        }

        if (params.notificationType) {
            searchParams.append('notificationType', params.notificationType);
        }

        if (params.channel) {
            searchParams.append('channel', params.channel);
        }

        const response = await fetch(`${this.baseUrl}?${searchParams}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch notification type preferences: ${response.statusText}`);
        }

        return response.json();
    }

    async createOrUpdateNotificationTypePreference(
        data: CreateNotificationTypePreferenceData
    ): Promise<NotificationTypePreferenceSingleResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create/update notification type preference: ${response.statusText}`);
        }

        return response.json();
    }

    async updateNotificationTypePreference(
        id: string,
        businessId: string,
        preferences: UpdateNotificationTypePreferenceData
    ): Promise<NotificationTypePreferenceSingleResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id,
                businessId,
                ...preferences,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update notification type preference: ${response.statusText}`);
        }

        return response.json();
    }

    async deleteNotificationTypePreference(
        businessId: string,
        id?: string,
        userId?: string,
        notificationType?: NotificationTypeOptions
    ): Promise<{ message: string }> {
        const searchParams = new URLSearchParams();
        searchParams.append('businessId', businessId);

        if (id) {
            searchParams.append('id', id);
        } else if (userId && notificationType) {
            searchParams.append('userId', userId);
            searchParams.append('notificationType', notificationType);
        } else {
            throw new Error('Either id or userId and notificationType must be provided');
        }

        const response = await fetch(`${this.baseUrl}?${searchParams}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete notification type preference: ${response.statusText}`);
        }

        return response.json();
    }
}

// Export singleton instance
export const notificationTypePreferenceApi = new NotificationTypePreferenceApiClient();

// Utility Functions
export const notificationTypePreferenceUtils = {
    // Get all preferences for a user
    getAllUserPreferences: (businessId: string, userId: string) => {
        return notificationTypePreferenceApi.getNotificationTypePreferences({ businessId, userId });
    },

    // Get preference for a specific notification type
    getTypePreference: (businessId: string, userId: string, notificationType: NotificationTypeOptions) => {
        return notificationTypePreferenceApi.getNotificationTypePreferences({
            businessId,
            userId,
            notificationType
        });
    },

    // Get enabled notification types for a specific channel
    getEnabledNotificationTypes: (businessId: string, userId: string, channel: 'email' | 'push' | 'in_app') => {
        return notificationTypePreferenceApi.getNotificationTypePreferences({
            businessId,
            userId,
            channel
        });
    },

    // Initialize default preferences for all notification types
    initializeDefaultPreferences: async (businessId: string, userId: string): Promise<boolean> => {
        try {
            const createPromises = Object.keys(notificationTypeOptions).map(type =>
                notificationTypePreferenceApi.createOrUpdateNotificationTypePreference({
                    businessId,
                    userId,
                    notificationType: type as NotificationTypeOptions,
                    email_enabled: true,
                    push_enabled: true,
                    in_app_enabled: true,
                })
            );

            await Promise.all(createPromises);
            return true;
        } catch (error) {
            console.error('Error initializing default notification type preferences:', error);
            return false;
        }
    },

    // Update preference for a specific notification type
    updateTypePreference: (
        businessId: string,
        userId: string,
        notificationType: NotificationTypeOptions,
        preferences: UpdateNotificationTypePreferenceData
    ) => {
        return notificationTypePreferenceApi.createOrUpdateNotificationTypePreference({
            businessId,
            userId,
            notificationType,
            ...preferences,
        });
    },

    // Enable/disable a notification type for all channels
    toggleNotificationType: (
        businessId: string,
        userId: string,
        notificationType: NotificationTypeOptions,
        enabled: boolean
    ) => {
        return notificationTypePreferenceApi.createOrUpdateNotificationTypePreference({
            businessId,
            userId,
            notificationType,
            email_enabled: enabled,
            push_enabled: enabled,
            in_app_enabled: enabled,
        });
    },

    // Enable/disable a notification type for a specific channel
    toggleNotificationTypeChannel: (
        businessId: string,
        userId: string,
        notificationType: NotificationTypeOptions,
        channel: 'email' | 'push' | 'in_app',
        enabled: boolean
    ) => {
        const channelField = `${channel}_enabled` as keyof UpdateNotificationTypePreferenceData;
        return notificationTypePreferenceApi.createOrUpdateNotificationTypePreference({
            businessId,
            userId,
            notificationType,
            [channelField]: enabled,
        });
    },

    // Delete preferences for a specific notification type
    deleteTypePreference: (businessId: string, userId: string, notificationType: NotificationTypeOptions) => {
        return notificationTypePreferenceApi.deleteNotificationTypePreference(
            businessId,
            undefined,
            userId,
            notificationType
        );
    },

    // Check if a notification type is enabled for any channel
    isNotificationTypeEnabled: (preferences: UserNotificationTypePreference[], notificationType: NotificationTypeOptions): boolean => {
        const typePrefs = preferences.find(p => p.notification_type === notificationType);
        if (!typePrefs) return true; // Default to enabled if no preferences found

        return typePrefs.email_enabled || typePrefs.push_enabled || typePrefs.in_app_enabled;
    },

    // Check if a notification type is enabled for a specific channel
    isNotificationTypeChannelEnabled: (
        preferences: UserNotificationTypePreference[],
        notificationType: NotificationTypeOptions,
        channel: 'email' | 'push' | 'in_app'
    ): boolean => {
        const typePrefs = preferences.find(p => p.notification_type === notificationType);
        if (!typePrefs) return true; // Default to enabled if no preferences found

        const channelField = `${channel}_enabled` as keyof UserNotificationTypePreference;
        return typePrefs[channelField] as boolean;
    },

    // Get all notification types that are enabled for a specific channel
    getEnabledTypesForChannel: (
        preferences: UserNotificationTypePreference[],
        channel: 'email' | 'push' | 'in_app'
    ): NotificationTypeOptions[] => {
        const channelField = `${channel}_enabled` as keyof UserNotificationTypePreference;
        return preferences
            .filter(p => p[channelField] as boolean)
            .map(p => p.notification_type as NotificationTypeOptions);
    },

    // Get notification type statistics
    getTypeStatistics: (preferences: UserNotificationTypePreference[]) => {
        const stats = {
            totalTypes: Object.keys(notificationTypeOptions).length,
            enabledTypes: {
                email: 0,
                push: 0,
                in_app: 0,
            },
            disabledTypes: {
                email: 0,
                push: 0,
                in_app: 0,
            },
        };

        preferences.forEach(pref => {
            if (pref.email_enabled) stats.enabledTypes.email++;
            else stats.disabledTypes.email++;

            if (pref.push_enabled) stats.enabledTypes.push++;
            else stats.disabledTypes.push++;

            if (pref.in_app_enabled) stats.enabledTypes.in_app++;
            else stats.disabledTypes.in_app++;
        });

        return stats;
    },

    // Validate notification type
    validateNotificationType: (notificationType: string): boolean => {
        return Object.keys(notificationTypeOptions).includes(notificationType);
    },

    // Get notification type label and description
    getNotificationTypeInfo: (notificationType: NotificationTypeOptions) => {
        return notificationTypeOptions[notificationType] || { label: notificationType, description: '' };
    },
};
