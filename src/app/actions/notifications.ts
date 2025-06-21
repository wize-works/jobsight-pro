"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Notification, NotificationInsert, NotificationUpdate } from "@/types/notifications";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { sendBulkEmailNotifications } from "@/app/actions/email-notifications-bulk";


// Get all notifications for the current business
export const getNotifications = async (businessId: string): Promise<Notification[]> => {


    const { data, error } = await fetchByBusiness("notifications", businessId, "*", {
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
export const getNotificationById = async (businessId: string, id: string): Promise<Notification | null> => {

    const { data, error } = await fetchByBusiness("notifications", businessId, "*", {
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
export const createNotification = async (businessId: string, notification: NotificationInsert): Promise<Notification | null> => {

    const { data, error } = await insertWithBusiness("notifications", notification, businessId);

    if (error) {
        console.error("Error creating notification:", error);
        return null;
    }

    return data as Notification;
};

// Create a notification and optionally send email
export const createNotificationWithEmail = async (
    businessId: string,
    notification: NotificationInsert,
    sendEmail: boolean = true,
    excludeUserId?: string,
    businessName?: string
): Promise<Notification | null> => {
    // Create the in-app notification
    const createdNotification = await createNotification(businessId, notification);

    if (!createdNotification) {
        return null;
    }

    // Send email notifications if enabled
    if (sendEmail) {
        try {
            const emailResults = await sendBulkEmailNotifications(
                businessId,
                notification,
                excludeUserId || notification.user_id,
                businessName
            );

            console.log(`Email notifications sent: ${emailResults.successful} successful, ${emailResults.failed} failed`);
        } catch (error) {
            console.error("Error sending email notifications:", error);
            // Don't fail the notification creation if email fails
        }
    }

    return createdNotification;
};

// Update an existing notification
export const updateNotification = async (businessId: string, id: string, notification: NotificationUpdate): Promise<Notification | null> => {

    const { data, error } = await updateWithBusinessCheck("notifications", id, notification, businessId);

    if (error) {
        console.error("Error updating notification:", error);
        return null;
    }

    return data as Notification;
};

// Delete a notification
export const deleteNotification = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("notifications", id, businessId);

    if (error) {
        console.error("Error deleting notification:", error);
        return false;
    }

    return true;
};

// Get notifications for a specific user
export const getNotificationsByUserId = async (businessId: string, userId: string): Promise<Notification[]> => {


    const { data, error } = await fetchByBusiness("notifications", businessId, "*", {
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
export const markNotificationAsRead = async (businessId: string, id: string): Promise<Notification | null> => {


    const notification: NotificationUpdate = {
        read: true,
        read_at: new Date().toISOString(),
    };

    const { data, error } = await updateWithBusinessCheck("notifications", id, notification, businessId);

    if (error) {
        console.error("Error marking notification as read:", error);
        return null;
    }

    return data as Notification;
};

// Get unread notifications for a user
export const getUnreadNotifications = async (businessId: string, userId: string): Promise<Notification[]> => {


    const { data, error } = await fetchByBusiness("notifications", businessId, "*", {
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
export const markAllNotificationsAsRead = async (businessId: string, userId: string): Promise<boolean> => {


    const now = new Date().toISOString();
    const { data: unreadNotifications, error } = await fetchByBusiness("notifications", businessId, "*", {
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
        }, businessId)
    );

    try {
        await Promise.all(updatePromises);
        return true;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
    }
};