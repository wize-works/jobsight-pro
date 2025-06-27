/**
 * Client-Side Bulk Email Notifications Actions
 * 
 * Replaces src/app/actions/email-notifications-bulk.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { createClient } from '@supabase/supabase-js';

// Type definitions
type User = Database['public']['Tables']['users']['Row'];
type Business = Database['public']['Tables']['businesses']['Row'];

// Notification types
export type NotificationTypeOptions =
    | 'project_created'
    | 'project_updated'
    | 'task_assigned'
    | 'task_completed'
    | 'daily_log_submitted'
    | 'invoice_generated'
    | 'crew_assigned'
    | 'equipment_assigned'
    | 'milestone_reached'
    | 'budget_warning'
    | 'deadline_reminder'
    | 'weather_alert'
    | 'system_announcement'
    | 'maintenance_reminder'
    | 'safety_alert';

// Email notification data interface
export interface EmailNotificationData {
    id?: string;
    type: NotificationTypeOptions;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
    recipientEmail: string;
    recipientName: string;
    businessName?: string;
    priority: 'low' | 'medium' | 'high';
}

// Bulk notification interface
export interface BulkNotificationData {
    type: NotificationTypeOptions;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
    priority: 'low' | 'medium' | 'high';
    recipientFilters?: {
        roles?: string[];
        includeMembers?: boolean;
        specificUserIds?: string[];
    };
}

// Create action instances
const selectUsers = createSelectAction('users');
const selectBusinesses = createSelectAction('businesses');

// Create browser client
function createBrowserClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase URL or Anon Key is missing');
        return null;
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Send email notification to a single user
 */
export const sendEmailNotification = async (
    businessId: string,
    notificationData: EmailNotificationData
): Promise<{ data?: { messageId?: string }; error?: string; isPending?: boolean }> => {
    try {
        if (navigator.onLine) {
            try {
                // Online: Send email immediately
                const result = await sendEmailOnline(businessId, notificationData);
                return { data: { messageId: result.messageId } };
            } catch (error) {
                console.error("Error sending email online:", error);
                // Fall back to offline queuing
                await queueEmailNotification(businessId, notificationData);
                return {
                    data: { messageId: 'queued' },
                    isPending: true
                };
            }
        } else {
            // Offline: Queue notification for sending when online
            await queueEmailNotification(businessId, notificationData);
            return {
                data: { messageId: 'queued' },
                isPending: true
            };
        }

    } catch (error) {
        console.error("Error in sendEmailNotification:", error);
        return { error: "Failed to send email notification" };
    }
};

/**
 * Send bulk email notifications to multiple users
 */
export const sendBulkNotifications = async (
    businessId: string,
    notificationData: BulkNotificationData
): Promise<{ data?: { successful: number; failed: number; total: number; queued: number }; error?: string; isPending?: boolean }> => {
    try {
        // Get business details
        const businessResult = await selectBusinesses({
            filter: { id: businessId }
        }, businessId);

        const business = businessResult.data?.[0] as Business;
        const businessName = business?.name || "Your Business";

        // Get recipient users based on filters
        const recipients = await getRecipientUsers(businessId, notificationData.recipientFilters);

        if (recipients.length === 0) {
            return { error: "No recipients found for notification" };
        }

        // Convert to individual email notifications
        const emailNotifications: EmailNotificationData[] = recipients.map(user => ({
            ...notificationData,
            id: crypto.randomUUID(),
            recipientEmail: user.email,
            recipientName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            businessName
        }));

        if (navigator.onLine) {
            try {
                // Online: Send emails immediately
                const results = await sendBulkEmailsOnline(businessId, emailNotifications);
                return { data: results };
            } catch (error) {
                console.error("Error sending bulk emails online:", error);
                // Fall back to offline queuing
                await queueBulkEmailNotifications(businessId, emailNotifications);
                return {
                    data: {
                        successful: 0,
                        failed: 0,
                        total: emailNotifications.length,
                        queued: emailNotifications.length
                    },
                    isPending: true
                };
            }
        } else {
            // Offline: Queue notifications for sending when online
            await queueBulkEmailNotifications(businessId, emailNotifications);
            return {
                data: {
                    successful: 0,
                    failed: 0,
                    total: emailNotifications.length,
                    queued: emailNotifications.length
                },
                isPending: true
            };
        }

    } catch (error) {
        console.error("Error in sendBulkNotifications:", error);
        return { error: "Failed to send bulk notifications" };
    }
};

/**
 * Send system-wide announcement to all users
 */
export const sendSystemAnnouncement = async (
    businessId: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    link?: string
): Promise<{ data?: { successful: number; failed: number; total: number; queued: number }; error?: string; isPending?: boolean }> => {
    const announcementData: BulkNotificationData = {
        type: 'system_announcement',
        title,
        message,
        link,
        priority,
        recipientFilters: {
            includeMembers: true // Include all users
        }
    };

    return await sendBulkNotifications(businessId, announcementData);
};

/**
 * Send safety alert to all users
 */
export const sendSafetyAlert = async (
    businessId: string,
    title: string,
    message: string,
    urgency: 'low' | 'medium' | 'high' = 'high',
    link?: string
): Promise<{ data?: { successful: number; failed: number; total: number; queued: number }; error?: string; isPending?: boolean }> => {
    const alertData: BulkNotificationData = {
        type: 'safety_alert',
        title: `🚨 SAFETY ALERT: ${title}`,
        message,
        link,
        priority: urgency,
        recipientFilters: {
            includeMembers: true // Include all users for safety alerts
        }
    };

    return await sendBulkNotifications(businessId, alertData);
};

/**
 * Send maintenance reminders to relevant users
 */
export const sendMaintenanceReminders = async (
    businessId: string,
    equipmentId: string,
    equipmentName: string,
    dueDate: string
): Promise<{ data?: { successful: number; failed: number; total: number; queued: number }; error?: string; isPending?: boolean }> => {
    const reminderData: BulkNotificationData = {
        type: 'maintenance_reminder',
        title: `Maintenance Due: ${equipmentName}`,
        message: `Equipment "${equipmentName}" is due for maintenance on ${new Date(dueDate).toLocaleDateString()}.`,
        link: `/dashboard/equipment/${equipmentId}`,
        priority: 'medium',
        recipientFilters: {
            roles: ['admin', 'manager'] // Only notify managers and admins
        },
        metadata: {
            equipmentId,
            equipmentName,
            dueDate
        }
    };

    return await sendBulkNotifications(businessId, reminderData);
};

// Helper functions

/**
 * Get recipient users based on filters
 */
async function getRecipientUsers(
    businessId: string,
    filters?: BulkNotificationData['recipientFilters']
): Promise<User[]> {
    try {
        let userFilter: any = {
            business_id: businessId,
            status: 'active'
        };

        // Apply role filters
        if (filters?.roles && filters.roles.length > 0) {
            // Note: Supabase filter would need to be implemented differently for array filters
            // For now, we'll get all users and filter in JavaScript
        }

        const usersResult = await selectUsers({
            filter: userFilter
        }, businessId);

        if (!usersResult.data) {
            return [];
        }

        let users = usersResult.data as User[];

        // Apply JavaScript filters
        if (filters) {
            if (filters.roles && filters.roles.length > 0) {
                users = users.filter(user => user.role && filters.roles!.includes(user.role));
            }

            if (!filters.includeMembers) {
                users = users.filter(user => user.role !== 'member');
            }

            if (filters.specificUserIds && filters.specificUserIds.length > 0) {
                users = users.filter(user => filters.specificUserIds!.includes(user.id));
            }
        }

        return users;

    } catch (error) {
        console.error("Error getting recipient users:", error);
        return [];
    }
}

/**
 * Send email online
 */
async function sendEmailOnline(
    businessId: string,
    notificationData: EmailNotificationData
): Promise<{ messageId: string }> {
    // TODO: Implement actual email sending via API when online
    console.log('Email would be sent:', {
        to: notificationData.recipientEmail,
        subject: notificationData.title,
        type: notificationData.type,
        priority: notificationData.priority
    });

    return { messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
}

/**
 * Send bulk emails online
 */
async function sendBulkEmailsOnline(
    businessId: string,
    notifications: EmailNotificationData[]
): Promise<{ successful: number; failed: number; total: number; queued: number }> {
    // TODO: Implement actual bulk email sending via API when online
    console.log('Bulk emails would be sent:', {
        count: notifications.length,
        types: [...new Set(notifications.map(n => n.type))],
        priorities: [...new Set(notifications.map(n => n.priority))]
    });

    // Simulate success/failure
    const successful = notifications.length;
    const failed = 0;
    const queued = 0;

    return { successful, failed, total: notifications.length, queued };
}

/**
 * Queue email notification for sending when online
 */
async function queueEmailNotification(
    businessId: string,
    notificationData: EmailNotificationData
): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);
    request.onsuccess = (event) => {
        const db = (event.target as any).result;
        const transaction = db.transaction(['email_queue'], 'readwrite');
        const store = transaction.objectStore('email_queue');

        const emailRecord = {
            id: crypto.randomUUID(),
            type: 'single_notification',
            businessId,
            notificationData,
            timestamp: new Date().toISOString(),
            priority: notificationData.priority
        };

        store.add(emailRecord);
    };
}

/**
 * Queue bulk email notifications for sending when online
 */
async function queueBulkEmailNotifications(
    businessId: string,
    notifications: EmailNotificationData[]
): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);
    request.onsuccess = (event) => {
        const db = (event.target as any).result;
        const transaction = db.transaction(['email_queue'], 'readwrite');
        const store = transaction.objectStore('email_queue');

        const emailRecord = {
            id: crypto.randomUUID(),
            type: 'bulk_notifications',
            businessId,
            notifications,
            timestamp: new Date().toISOString(),
            priority: notifications[0]?.priority || 'medium'
        };

        store.add(emailRecord);
    };
}

/**
 * Get default subject based on notification type
 */
function getDefaultSubject(type: NotificationTypeOptions): string {
    const subjects: Record<NotificationTypeOptions, string> = {
        project_created: 'New Project Created',
        project_updated: 'Project Updated',
        task_assigned: 'New Task Assigned',
        task_completed: 'Task Completed',
        daily_log_submitted: 'Daily Log Submitted',
        invoice_generated: 'New Invoice Generated',
        crew_assigned: 'Crew Assignment Updated',
        equipment_assigned: 'Equipment Assignment Updated',
        milestone_reached: 'Milestone Reached',
        budget_warning: 'Budget Warning',
        deadline_reminder: 'Deadline Reminder',
        weather_alert: 'Weather Alert',
        system_announcement: 'System Announcement',
        maintenance_reminder: 'Maintenance Reminder',
        safety_alert: 'Safety Alert'
    };

    return subjects[type] || 'JobSight Pro Notification';
}

// Initialize offline email queue when module loads
if (typeof window !== 'undefined') {
    // Email queue is already initialized by email-notifications-client.ts
}
