import { Notification, NotificationInsert, NotificationUpdate } from '@/types/notifications';

// API Response Types
export interface NotificationResponse {
    data: Notification[];
    count: number;
}

export interface NotificationSingleResponse {
    data: Notification;
}

// Query Parameters
export interface NotificationQuery {
    businessId: string;
    userId?: string;
    id?: string;
    read?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
}

// Create Data
export interface CreateNotificationData {
    businessId: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    read?: boolean;
    metadata?: any;
}

// Update Data
export interface UpdateNotificationData {
    title?: string;
    message?: string;
    read?: boolean;
    read_at?: string;
    link?: string;
    metadata?: any;
}

// API Client
class NotificationApiClient {
    private baseUrl = '/api/notifications';

    async getNotifications(params: NotificationQuery): Promise<NotificationResponse> {
        const searchParams = new URLSearchParams();
        searchParams.append('businessId', params.businessId);

        if (params.userId) {
            searchParams.append('userId', params.userId);
        }

        if (params.id) {
            searchParams.append('id', params.id);
        }

        if (params.read !== undefined) {
            searchParams.append('read', params.read.toString());
        }

        if (params.type) {
            searchParams.append('type', params.type);
        }

        if (params.limit) {
            searchParams.append('limit', params.limit.toString());
        }

        if (params.offset) {
            searchParams.append('offset', params.offset.toString());
        }

        const response = await fetch(`${this.baseUrl}?${searchParams}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch notifications: ${response.statusText}`);
        }

        return response.json();
    }

    async createNotification(data: CreateNotificationData): Promise<NotificationSingleResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create notification: ${response.statusText}`);
        }

        return response.json();
    }

    async updateNotification(
        id: string,
        businessId: string,
        data: UpdateNotificationData
    ): Promise<NotificationSingleResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id,
                businessId,
                ...data,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update notification: ${response.statusText}`);
        }

        return response.json();
    }

    async markAllAsRead(businessId: string, userId: string): Promise<{ data: Notification[]; message: string }> {
        const response = await fetch(this.baseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                businessId,
                userId,
                markAllAsRead: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
        }

        return response.json();
    }

    async deleteNotification(id: string, businessId: string): Promise<{ message: string }> {
        const searchParams = new URLSearchParams();
        searchParams.append('id', id);
        searchParams.append('businessId', businessId);

        const response = await fetch(`${this.baseUrl}?${searchParams}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete notification: ${response.statusText}`);
        }

        return response.json();
    }
}

// Export singleton instance
export const notificationApi = new NotificationApiClient();

// Utility Functions
export const notificationUtils = {
    // Get all notifications for business
    getAllNotifications: (businessId: string, limit?: number, offset?: number) => {
        return notificationApi.getNotifications({ businessId, limit, offset });
    },

    // Get notification by ID
    getNotificationById: (businessId: string, id: string) => {
        return notificationApi.getNotifications({ businessId, id });
    },

    // Get notifications for a specific user
    getNotificationsByUserId: (businessId: string, userId: string, limit?: number, offset?: number) => {
        return notificationApi.getNotifications({ businessId, userId, limit, offset });
    },

    // Get unread notifications for a user
    getUnreadNotifications: (businessId: string, userId: string, limit?: number, offset?: number) => {
        return notificationApi.getNotifications({ businessId, userId, read: false, limit, offset });
    },

    // Get notifications by type
    getNotificationsByType: (businessId: string, type: string, limit?: number, offset?: number) => {
        return notificationApi.getNotifications({ businessId, type, limit, offset });
    },

    // Mark notification as read
    markNotificationAsRead: (businessId: string, id: string) => {
        return notificationApi.updateNotification(id, businessId, {
            read: true,
            read_at: new Date().toISOString(),
        });
    },

    // Mark all notifications as read for a user
    markAllNotificationsAsRead: (businessId: string, userId: string) => {
        return notificationApi.markAllAsRead(businessId, userId);
    },

    // Create notification with email support
    createNotificationWithEmail: async (
        businessId: string,
        notification: CreateNotificationData,
        sendEmail: boolean = true,
        excludeUserId?: string,
        businessName?: string
    ) => {
        // Create the notification first
        const createdNotification = await notificationApi.createNotification(notification);

        // TODO: Implement email sending logic if needed
        if (sendEmail) {
            console.log('Email sending not yet implemented in API client');
        }

        return createdNotification;
    },

    // Delete notification
    deleteNotification: (businessId: string, id: string) => {
        return notificationApi.deleteNotification(id, businessId);
    },

    // Check if notification is read
    isNotificationRead: (notification: Notification): boolean => {
        return notification.read;
    },

    // Check if notification is expired (field not in schema)
    isNotificationExpired: (notification: Notification): boolean => {
        // expires_at field not in current schema
        return false;
    },

    // Get notification age in minutes
    getNotificationAge: (notification: Notification): number => {
        const now = new Date();
        const created = new Date(notification.created_at || now);
        return Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    },

    // Format notification for display
    formatNotification: (notification: Notification) => {
        const age = notificationUtils.getNotificationAge(notification);
        const isExpired = notificationUtils.isNotificationExpired(notification);

        return {
            ...notification,
            age,
            isExpired,
            ageDisplay: age < 60 ? `${age}m` : `${Math.floor(age / 60)}h`,
        };
    },

    // Group notifications by type
    groupNotificationsByType: (notifications: Notification[]) => {
        return notifications.reduce((groups, notification) => {
            const type = notification.type || 'other';
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(notification);
            return groups;
        }, {} as Record<string, Notification[]>);
    },

    // Get notification statistics
    getNotificationStatistics: (notifications: Notification[]) => {
        const stats = {
            total: notifications.length,
            read: 0,
            unread: 0,
            expired: 0,
            byType: {} as Record<string, number>,
            byPriority: {
                low: 0,
                medium: 0,
                high: 0,
            } as Record<string, number>,
        };

        notifications.forEach(notification => {
            if (notification.read) stats.read++;
            else stats.unread++;

            if (notificationUtils.isNotificationExpired(notification)) {
                stats.expired++;
            }

            const type = notification.type || 'other';
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            // Priority field not in current schema, default to medium
            const priority = 'medium';
            stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        });

        return stats;
    },

    // Sort notifications by priority and date (priority not in schema)
    sortNotifications: (notifications: Notification[]) => {
        // Since priority field is not in schema, just sort by date (newest first)
        return notifications.sort((a, b) => {
            const aDate = new Date(a.created_at || 0);
            const bDate = new Date(b.created_at || 0);
            return bDate.getTime() - aDate.getTime();
        });
    },

    // Filter notifications by criteria
    filterNotifications: (
        notifications: Notification[],
        criteria: {
            read?: boolean;
            type?: string;
            priority?: string;
            excludeExpired?: boolean;
            userId?: string;
        }
    ) => {
        return notifications.filter(notification => {
            if (criteria.read !== undefined && notification.read !== criteria.read) {
                return false;
            }

            if (criteria.type && notification.type !== criteria.type) {
                return false;
            }

            // Priority field not in current schema, skip priority filtering
            if (criteria.priority) {
                console.warn('Priority filtering not supported in current schema');
            }

            if (criteria.excludeExpired && notificationUtils.isNotificationExpired(notification)) {
                return false;
            }

            if (criteria.userId && notification.user_id !== criteria.userId) {
                return false;
            }

            return true;
        });
    },

    // Validate notification data
    validateNotificationData: (data: Partial<CreateNotificationData>): string[] => {
        const errors: string[] = [];

        if (!data.businessId) {
            errors.push('Business ID is required');
        }

        if (!data.user_id) {
            errors.push('User ID is required');
        }

        if (!data.title) {
            errors.push('Title is required');
        }

        if (!data.type) {
            errors.push('Type is required');
        }

        if (!data.message) {
            errors.push('Message is required');
        }

        return errors;
    },
};
