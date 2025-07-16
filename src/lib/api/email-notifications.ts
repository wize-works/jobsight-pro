// Email Notifications API Client
import { NotificationInsert, NotificationTypeOptions } from "@/types/notifications";

// Types
export interface BulkEmailRequest {
    notification: NotificationInsert;
    excludeUserId?: string;
    businessName?: string;
}

export interface SingleEmailRequest {
    recipientEmail: string;
    recipientName: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
    businessName?: string;
}

export interface TestEmailRequest {
    userEmail: string;
    userName: string;
    notificationType: NotificationTypeOptions;
}

export interface BulkEmailResponse {
    successful: number;
    failed: number;
    total: number;
}

export interface SingleEmailResponse {
    sent: boolean;
}

export interface EmailNotificationApiError {
    error: string;
    message?: string;
}

// Email Notifications API
export class EmailNotificationsAPI {
    private static baseUrl = "/api/email-notifications";

    // Send bulk email notifications
    static async sendBulkNotifications(data: BulkEmailRequest): Promise<{
        data: BulkEmailResponse;
        message: string;
    }> {
        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error: EmailNotificationApiError = await response.json();
            throw new Error(error.error || "Failed to send bulk email notifications");
        }

        return response.json();
    }

    // Send single email notification
    static async sendSingleNotification(data: SingleEmailRequest): Promise<{
        data: SingleEmailResponse;
        message: string;
    }> {
        const response = await fetch(this.baseUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error: EmailNotificationApiError = await response.json();
            throw new Error(error.error || "Failed to send email notification");
        }

        return response.json();
    }

    // Send test email notification
    static async sendTestNotification(data: TestEmailRequest): Promise<{
        data: SingleEmailResponse;
        message: string;
    }> {
        const response = await fetch(this.baseUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error: EmailNotificationApiError = await response.json();
            throw new Error(error.error || "Failed to send test email notification");
        }

        return response.json();
    }
}

// Helper function to handle API errors
export function handleEmailNotificationApiError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return "An unknown error occurred";
}

// Utility functions
export const EmailNotificationUtils = {
    // Generate default subject for notification type
    getDefaultSubject(notificationType: NotificationTypeOptions): string {
        switch (notificationType) {
            case "projectUpdates":
                return "Project Update";
            case "taskAssignments":
                return "Task Assignment";
            case "equipmentAlerts":
                return "Equipment Alert";
            case "invoiceUpdates":
                return "Invoice Update";
            case "systemAnnouncements":
                return "System Announcement";
            default:
                return "Notification";
        }
    },

    // Validate email address
    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Create notification insert object
    createNotificationInsert(
        type: NotificationTypeOptions,
        title: string,
        message: string,
        userId?: string,
        link?: string,
        metadata?: Record<string, any>
    ): NotificationInsert {
        return {
            type,
            title,
            message,
            user_id: userId || "system",
            link,
            metadata,
            read: false,
            read_at: null,
        };
    },

    // Format recipient name
    formatRecipientName(firstName?: string, lastName?: string, email?: string): string {
        if (firstName) {
            return `${firstName} ${lastName || ""}`.trim();
        }
        return email || "User";
    },

    // Create bulk email request
    createBulkEmailRequest(
        notification: NotificationInsert,
        excludeUserId?: string,
        businessName?: string
    ): BulkEmailRequest {
        return {
            notification,
            excludeUserId,
            businessName,
        };
    },

    // Create single email request
    createSingleEmailRequest(
        recipientEmail: string,
        recipientName: string,
        type: NotificationTypeOptions,
        title: string,
        message: string,
        link?: string,
        metadata?: Record<string, any>,
        businessName?: string
    ): SingleEmailRequest {
        return {
            recipientEmail,
            recipientName,
            type,
            title,
            message,
            link,
            metadata,
            businessName,
        };
    },

    // Create test email request
    createTestEmailRequest(
        userEmail: string,
        userName: string,
        notificationType: NotificationTypeOptions
    ): TestEmailRequest {
        return {
            userEmail,
            userName,
            notificationType,
        };
    },
};
