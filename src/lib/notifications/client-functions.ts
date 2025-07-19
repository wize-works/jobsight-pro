import {
    UserNotificationPreference,
    UserNotificationPreferenceUpdate,
    UserNotificationTypePreference,
    UserNotificationTypePreferenceUpdate,
    Notification,
    NotificationInsert,
    NotificationUpdate,
    NotificationTypeOptions
} from "@/types/notifications";

// ============= User Notification Preferences =============

export const getUserNotificationPreferencesClient = async (
    userId: string
): Promise<UserNotificationPreference[]> => {
    try {
        const response = await fetch('/api/notifications/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch notification preferences');
        }

        const data = await response.json();
        return data.preferences;
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        throw error;
    }
};

export const updateUserNotificationPreferencesClient = async (
    userId: string,
    preferences: UserNotificationPreferenceUpdate
): Promise<UserNotificationPreference> => {
    try {
        const response = await fetch('/api/notifications/preferences', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, preferences }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update notification preferences');
        }

        const data = await response.json();
        return data.preference;
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
    }
};

// ============= User Notification Type Preferences =============

export const getAllNotificationTypePreferencesClient = async (
    userId: string
): Promise<UserNotificationTypePreference[]> => {
    try {
        const response = await fetch('/api/notifications/type-preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch notification type preferences');
        }

        const data = await response.json();
        return data.preferences;
    } catch (error) {
        console.error('Error fetching notification type preferences:', error);
        throw error;
    }
};

export const getNotificationTypePreferenceClient = async (
    userId: string,
    notificationType: NotificationTypeOptions
): Promise<UserNotificationTypePreference | null> => {
    try {
        const response = await fetch('/api/notifications/type-preferences/single', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, notificationType }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch notification type preference');
        }

        const data = await response.json();
        return data.preference;
    } catch (error) {
        console.error('Error fetching notification type preference:', error);
        throw error;
    }
};

export const updateNotificationTypePreferenceClient = async (
    userId: string,
    notificationType: NotificationTypeOptions,
    preferences: UserNotificationTypePreferenceUpdate
): Promise<UserNotificationTypePreference> => {
    try {
        const response = await fetch('/api/notifications/type-preferences', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, notificationType, preferences }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update notification type preference');
        }

        const data = await response.json();
        return data.preference;
    } catch (error) {
        console.error('Error updating notification type preference:', error);
        throw error;
    }
};

export const deleteNotificationTypePreferenceClient = async (
    userId: string,
    notificationType: NotificationTypeOptions
): Promise<boolean> => {
    try {
        const response = await fetch('/api/notifications/type-preferences', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, notificationType }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete notification type preference');
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error deleting notification type preference:', error);
        throw error;
    }
};

export const initializeDefaultNotificationTypePreferencesClient = async (
    userId: string
): Promise<boolean> => {
    try {
        const response = await fetch('/api/notifications/type-preferences/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to initialize notification type preferences');
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error initializing notification type preferences:', error);
        throw error;
    }
};

export const getEnabledNotificationTypesClient = async (
    userId: string,
    channel: 'email' | 'push' | 'in_app'
): Promise<NotificationTypeOptions[]> => {
    try {
        const response = await fetch('/api/notifications/type-preferences/enabled', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, channel }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch enabled notification types');
        }

        const data = await response.json();
        return data.types;
    } catch (error) {
        console.error('Error fetching enabled notification types:', error);
        throw error;
    }
};

// ============= Notifications =============

export const getNotificationsClient = async (): Promise<Notification[]> => {
    try {
        const response = await fetch('/api/notifications', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch notifications');
        }

        const data = await response.json();
        return data.notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const getNotificationByIdClient = async (id: string): Promise<Notification | null> => {
    try {
        const response = await fetch(`/api/notifications/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch notification');
        }

        const data = await response.json();
        return data.notification;
    } catch (error) {
        console.error('Error fetching notification:', error);
        throw error;
    }
};

export const createNotificationClient = async (
    notification: NotificationInsert
): Promise<Notification> => {
    try {
        const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notification }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create notification');
        }

        const data = await response.json();
        return data.notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export const createNotificationWithEmailClient = async (
    notification: NotificationInsert,
    sendEmail: boolean = true,
    excludeUserId?: string
): Promise<Notification> => {
    try {
        const response = await fetch('/api/notifications/with-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notification, sendEmail, excludeUserId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create notification with email');
        }

        const data = await response.json();
        return data.notification;
    } catch (error) {
        console.error('Error creating notification with email:', error);
        throw error;
    }
};

export const updateNotificationClient = async (
    id: string,
    notification: NotificationUpdate
): Promise<Notification> => {
    try {
        const response = await fetch(`/api/notifications/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notification }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update notification');
        }

        const data = await response.json();
        return data.notification;
    } catch (error) {
        console.error('Error updating notification:', error);
        throw error;
    }
};

export const deleteNotificationClient = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete notification');
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

export const getNotificationsByUserIdClient = async (userId: string): Promise<Notification[]> => {
    try {
        const response = await fetch('/api/notifications/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch user notifications');
        }

        const data = await response.json();
        return data.notifications;
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        throw error;
    }
};

export const markNotificationAsReadClient = async (id: string): Promise<Notification> => {
    try {
        const response = await fetch(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to mark notification as read');
        }

        const data = await response.json();
        return data.notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const getUnreadNotificationsClient = async (userId: string): Promise<Notification[]> => {
    try {
        const response = await fetch('/api/notifications/unread', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch unread notifications');
        }

        const data = await response.json();
        return data.notifications;
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        throw error;
    }
};

export const markAllNotificationsAsReadClient = async (userId: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/notifications/mark-all-read', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to mark all notifications as read');
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};
