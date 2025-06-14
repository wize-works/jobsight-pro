"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Notification, NotificationInsert, NotificationUpdate } from "@/types/notifications";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";

// Get all notifications for the current business
export const getNotifications = async (): Promise<Notification[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("notifications", business.id, "*", {
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Notification[];
    }

    return data as unknown as Notification[];
};

// Get a specific notification by ID
export const getNotificationById = async (id: string): Promise<Notification | null> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("notifications", business.id, "*", {
        filter: { id },
    });

    if (error) {
        console.error("Error fetching notification by ID:", error);
        return null;
    }

    if (data && data.length > 0) {
        return data[0] as unknown as Notification;
    }

    return null;
};

// Create a new notification
export const createNotification = async (notification: NotificationInsert): Promise<Notification | null> => {
    const { business } = await ensureBusinessOrRedirect();

    notification = await applyCreated<NotificationInsert>(notification);

    const { data, error } = await insertWithBusiness("notifications", notification, business.id);

    if (error) {
        console.error("Error creating notification:", error);
        return null;
    }

    return data as Notification;
};

// Update an existing notification
export const updateNotification = async (id: string, notification: NotificationUpdate): Promise<Notification | null> => {
    const { business } = await ensureBusinessOrRedirect();

    notification = await applyUpdated<NotificationUpdate>(notification);

    const { data, error } = await updateWithBusinessCheck("notifications", id, notification, business.id);

    if (error) {
        console.error("Error updating notification:", error);
        return null;
    }

    return data as Notification;
};

// Delete a notification
export const deleteNotification = async (id: string): Promise<boolean> => {
    const { business } = await ensureBusinessOrRedirect();

    const { error } = await deleteWithBusinessCheck("notifications", id, business.id);

    if (error) {
        console.error("Error deleting notification:", error);
        return false;
    }

    return true;
};

// Get notifications for a specific user
export const getNotificationsByUserId = async (userId: string): Promise<Notification[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("notifications", business.id, "*", {
        filter: { user_id: userId },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching notifications for user:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Notification[];
    }

    return data as unknown as Notification[];
};

// Mark a notification as read
export const markNotificationAsRead = async (id: string): Promise<Notification | null> => {
    const { business } = await ensureBusinessOrRedirect();

    const notification: NotificationUpdate = {
        read: true,
        read_at: new Date().toISOString(),
    };

    const { data, error } = await updateWithBusinessCheck("notifications", id, notification, business.id);

    if (error) {
        console.error("Error marking notification as read:", error);
        return null;
    }

    return data as Notification;
};

// Get unread notifications for a user
export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("notifications", business.id, "*", {
        filter: {
            user_id: userId,
            read: false
        },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching unread notifications:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Notification[];
    }

    return data as unknown as Notification[];
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
    const { business } = await ensureBusinessOrRedirect();

    const now = new Date().toISOString();
    const { data: unreadNotifications, error } = await fetchByBusiness("notifications", business.id, "*", {
        filter: {
            user_id: userId,
            read: false
        }
    });

    if (error) {
        console.error("Error fetching unread notifications:", error);
        return false;
    }

    if (!unreadNotifications || unreadNotifications.length === 0) {
        return true;
    }

    // Update all unread notifications in parallel
    const updatePromises = (unreadNotifications as unknown as Notification[]).map(notification =>
        updateWithBusinessCheck("notifications", notification.id, {
            read: true,
            read_at: now
        }, business.id)
    );

    try {
        await Promise.all(updatePromises);
        return true;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
    }
};