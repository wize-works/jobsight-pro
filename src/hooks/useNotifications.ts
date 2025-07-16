import { useState, useEffect } from 'react';
import {
    notificationApi,
    NotificationQuery,
    notificationUtils,
    CreateNotificationData,
    UpdateNotificationData
} from '@/lib/api/notifications';
import { Notification } from '@/types/notifications';

// Hook for fetching notifications
export const useNotifications = (query: NotificationQuery) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationApi.getNotifications(query);
            setNotifications(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [JSON.stringify(query)]);

    return {
        notifications,
        loading,
        error,
        count,
        refetch: fetchNotifications,
    };
};

// Hook for user-specific notifications
export const useUserNotifications = (businessId: string, userId: string, limit?: number, offset?: number) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchUserNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationUtils.getNotificationsByUserId(businessId, userId, limit, offset);
            setNotifications(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId && userId) {
            fetchUserNotifications();
        }
    }, [businessId, userId, limit, offset]);

    return {
        notifications,
        loading,
        error,
        count,
        refetch: fetchUserNotifications,
    };
};

// Hook for unread notifications
export const useUnreadNotifications = (businessId: string, userId: string, limit?: number, offset?: number) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchUnreadNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationUtils.getUnreadNotifications(businessId, userId, limit, offset);
            setNotifications(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch unread notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId && userId) {
            fetchUnreadNotifications();
        }
    }, [businessId, userId, limit, offset]);

    return {
        notifications,
        loading,
        error,
        count,
        refetch: fetchUnreadNotifications,
    };
};

// Hook for notification by ID
export const useNotificationById = (businessId: string, id: string) => {
    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotification = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationUtils.getNotificationById(businessId, id);
            setNotification(response.data.length > 0 ? response.data[0] : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notification');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId && id) {
            fetchNotification();
        }
    }, [businessId, id]);

    return {
        notification,
        loading,
        error,
        refetch: fetchNotification,
    };
};

// Hook for managing notifications
export const useNotificationMutations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createNotification = async (data: CreateNotificationData) => {
        try {
            setLoading(true);
            setError(null);

            // Validate notification data
            const validationErrors = notificationUtils.validateNotificationData(data);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            const response = await notificationApi.createNotification(data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create notification');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateNotification = async (
        id: string,
        businessId: string,
        data: UpdateNotificationData
    ) => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationApi.updateNotification(id, businessId, data);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update notification');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async (id: string, businessId: string) => {
        try {
            setLoading(true);
            setError(null);
            await notificationApi.deleteNotification(id, businessId);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete notification');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string, businessId: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationUtils.markNotificationAsRead(businessId, id);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async (businessId: string, userId: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationUtils.markAllNotificationsAsRead(businessId, userId);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createNotification,
        updateNotification,
        deleteNotification,
        markAsRead,
        markAllAsRead,
        loading,
        error,
    };
};

// Hook for creating notifications with email support
export const useCreateNotificationWithEmail = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createNotificationWithEmail = async (
        businessId: string,
        notification: CreateNotificationData,
        sendEmail: boolean = true,
        excludeUserId?: string,
        businessName?: string
    ) => {
        try {
            setLoading(true);
            setError(null);

            // Validate notification data
            const validationErrors = notificationUtils.validateNotificationData(notification);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            const response = await notificationUtils.createNotificationWithEmail(
                businessId,
                notification,
                sendEmail,
                excludeUserId,
                businessName
            );
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create notification with email');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createNotificationWithEmail,
        loading,
        error,
    };
};

// Hook for notifications by type
export const useNotificationsByType = (businessId: string, type: string, limit?: number, offset?: number) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchNotificationsByType = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await notificationUtils.getNotificationsByType(businessId, type, limit, offset);
            setNotifications(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notifications by type');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId && type) {
            fetchNotificationsByType();
        }
    }, [businessId, type, limit, offset]);

    return {
        notifications,
        loading,
        error,
        count,
        refetch: fetchNotificationsByType,
    };
};

// Hook for notification utilities
export const useNotificationUtils = () => {
    return {
        isNotificationRead: notificationUtils.isNotificationRead,
        isNotificationExpired: notificationUtils.isNotificationExpired,
        getNotificationAge: notificationUtils.getNotificationAge,
        formatNotification: notificationUtils.formatNotification,
        groupNotificationsByType: notificationUtils.groupNotificationsByType,
        getNotificationStatistics: notificationUtils.getNotificationStatistics,
        sortNotifications: notificationUtils.sortNotifications,
        filterNotifications: notificationUtils.filterNotifications,
        validateNotificationData: notificationUtils.validateNotificationData,
    };
};

// Hook for notification statistics
export const useNotificationStatistics = (notifications: Notification[]) => {
    const [stats, setStats] = useState({
        total: 0,
        read: 0,
        unread: 0,
        expired: 0,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
    });

    useEffect(() => {
        const newStats = notificationUtils.getNotificationStatistics(notifications);
        setStats(newStats);
    }, [notifications]);

    return stats;
};

// Hook for grouped notifications
export const useGroupedNotifications = (notifications: Notification[]) => {
    const [groupedNotifications, setGroupedNotifications] = useState<Record<string, Notification[]>>({});

    useEffect(() => {
        const grouped = notificationUtils.groupNotificationsByType(notifications);
        setGroupedNotifications(grouped);
    }, [notifications]);

    return groupedNotifications;
};

// Hook for filtered notifications
export const useFilteredNotifications = (
    notifications: Notification[],
    criteria: {
        read?: boolean;
        type?: string;
        priority?: string;
        excludeExpired?: boolean;
        userId?: string;
    }
) => {
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const filtered = notificationUtils.filterNotifications(notifications, criteria);
        setFilteredNotifications(filtered);
    }, [notifications, criteria]);

    return filteredNotifications;
};

// Hook for sorted notifications
export const useSortedNotifications = (notifications: Notification[]) => {
    const [sortedNotifications, setSortedNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const sorted = notificationUtils.sortNotifications([...notifications]);
        setSortedNotifications(sorted);
    }, [notifications]);

    return sortedNotifications;
};
