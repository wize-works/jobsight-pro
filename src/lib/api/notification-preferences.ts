import { UserNotificationPreference, UserNotificationPreferenceInsert, UserNotificationPreferenceUpdate } from '@/types/notifications';

// API Response Types
export interface NotificationPreferenceResponse {
    data: UserNotificationPreference[];
    count: number;
}

export interface NotificationPreferenceSingleResponse {
    data: UserNotificationPreference;
}

// Query Parameters
export interface NotificationPreferenceQuery {
    businessId: string;
    userId?: string;
}

// API Client
class NotificationPreferenceApiClient {
    private baseUrl = '/api/notification-preferences';

    async getNotificationPreferences(params: NotificationPreferenceQuery): Promise<NotificationPreferenceResponse> {
        const searchParams = new URLSearchParams();
        searchParams.append('businessId', params.businessId);

        if (params.userId) {
            searchParams.append('userId', params.userId);
        }

        const response = await fetch(`${this.baseUrl}?${searchParams}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch notification preferences: ${response.statusText}`);
        }

        return response.json();
    }

    async createOrUpdateNotificationPreferences(
        businessId: string,
        userId: string,
        preferences: Partial<UserNotificationPreferenceUpdate>
    ): Promise<NotificationPreferenceSingleResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                businessId,
                userId,
                ...preferences,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create/update notification preferences: ${response.statusText}`);
        }

        return response.json();
    }

    async updateNotificationPreferences(
        id: string,
        businessId: string,
        preferences: UserNotificationPreferenceUpdate
    ): Promise<NotificationPreferenceSingleResponse> {
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
            throw new Error(`Failed to update notification preferences: ${response.statusText}`);
        }

        return response.json();
    }

    async deleteNotificationPreferences(id: string, businessId: string): Promise<{ message: string }> {
        const searchParams = new URLSearchParams();
        searchParams.append('id', id);
        searchParams.append('businessId', businessId);

        const response = await fetch(`${this.baseUrl}?${searchParams}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete notification preferences: ${response.statusText}`);
        }

        return response.json();
    }
}

// Export singleton instance
export const notificationPreferenceApi = new NotificationPreferenceApiClient();

// Utility Functions
export const notificationPreferenceUtils = {
    // Get preferences for a specific user
    getUserPreferences: (businessId: string, userId: string) => {
        return notificationPreferenceApi.getNotificationPreferences({ businessId, userId });
    },

    // Create default preferences for a new user
    createDefaultPreferences: (businessId: string, userId: string) => {
        return notificationPreferenceApi.createOrUpdateNotificationPreferences(businessId, userId, {
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
        });
    },

    // Update specific preference settings
    updatePreferenceSettings: (businessId: string, userId: string, settings: Partial<UserNotificationPreferenceUpdate>) => {
        return notificationPreferenceApi.createOrUpdateNotificationPreferences(businessId, userId, settings);
    },

    // Enable/disable all notifications for a user
    toggleAllNotifications: (businessId: string, userId: string, enabled: boolean) => {
        return notificationPreferenceApi.createOrUpdateNotificationPreferences(businessId, userId, {
            email_enabled: enabled,
            push_enabled: enabled,
            in_app_enabled: enabled,
        });
    },

    // Update quiet hours (not supported in current schema)
    updateQuietHours: (businessId: string, userId: string, startTime: string, endTime: string) => {
        // Note: quiet_hours fields are not in the current schema
        // This is a placeholder for future implementation
        console.warn('Quiet hours not supported in current schema');
        return Promise.resolve({ data: null } as any);
    },

    // Update email digest frequency (not supported in current schema)
    updateEmailDigestFrequency: (businessId: string, userId: string, frequency: 'immediate' | 'daily' | 'weekly' | 'never') => {
        // Note: email_digest_frequency field is not in the current schema
        // This is a placeholder for future implementation
        console.warn('Email digest frequency not supported in current schema');
        return Promise.resolve({ data: null } as any);
    },

    // Update timezone (not supported in current schema)
    updateTimezone: (businessId: string, userId: string, timezone: string) => {
        // Note: timezone field is not in the current schema
        // This is a placeholder for future implementation
        console.warn('Timezone not supported in current schema');
        return Promise.resolve({ data: null } as any);
    },

    // Check if notifications are enabled for a user
    areNotificationsEnabled: (preferences: UserNotificationPreference[]): boolean => {
        if (!preferences || preferences.length === 0) return true; // Default to enabled
        const userPrefs = preferences[0];
        return userPrefs.email_enabled || userPrefs.push_enabled || userPrefs.in_app_enabled;
    },

    // Check if it's within quiet hours (not supported in current schema)
    isWithinQuietHours: (preferences: UserNotificationPreference[], currentTime?: Date): boolean => {
        // Note: quiet_hours fields are not in the current schema
        return false;
    },

    // Get user timezone (not supported in current schema)
    getUserTimezone: (preferences: UserNotificationPreference[]): string => {
        // Return system timezone since timezone field is not in the schema
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    },

    // Get email digest frequency (not supported in current schema)
    getEmailDigestFrequency: (preferences: UserNotificationPreference[]): string => {
        // Return default since email_digest_frequency field is not in the schema
        return 'daily';
    },

    // Validate preference settings
    validatePreferences: (preferences: Partial<UserNotificationPreferenceUpdate>): string[] => {
        const errors: string[] = [];

        // Only validate fields that exist in the schema
        if (preferences.email_enabled !== undefined && typeof preferences.email_enabled !== 'boolean') {
            errors.push('email_enabled must be a boolean');
        }

        if (preferences.push_enabled !== undefined && typeof preferences.push_enabled !== 'boolean') {
            errors.push('push_enabled must be a boolean');
        }

        if (preferences.in_app_enabled !== undefined && typeof preferences.in_app_enabled !== 'boolean') {
            errors.push('in_app_enabled must be a boolean');
        }

        return errors;
    },
};
