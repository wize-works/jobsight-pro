import { useState } from "react";
import {
    EmailNotificationsAPI,
    BulkEmailRequest,
    SingleEmailRequest,
    TestEmailRequest,
    BulkEmailResponse,
    SingleEmailResponse,
    handleEmailNotificationApiError,
    EmailNotificationUtils
} from "@/lib/api/email-notifications";
import { NotificationTypeOptions } from "@/types/notifications";

// Hook for bulk email notifications
export function useBulkEmailNotifications() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<BulkEmailResponse | null>(null);

    const sendBulkNotifications = async (data: BulkEmailRequest): Promise<BulkEmailResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await EmailNotificationsAPI.sendBulkNotifications(data);
            setLastResult(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailNotificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setLastResult(null);
    };

    return {
        sendBulkNotifications,
        loading,
        error,
        lastResult,
        reset,
    };
}

// Hook for single email notifications
export function useSingleEmailNotification() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<SingleEmailResponse | null>(null);

    const sendSingleNotification = async (data: SingleEmailRequest): Promise<SingleEmailResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await EmailNotificationsAPI.sendSingleNotification(data);
            setLastResult(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailNotificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setLastResult(null);
    };

    return {
        sendSingleNotification,
        loading,
        error,
        lastResult,
        reset,
    };
}

// Hook for test email notifications
export function useTestEmailNotification() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<SingleEmailResponse | null>(null);

    const sendTestNotification = async (data: TestEmailRequest): Promise<SingleEmailResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await EmailNotificationsAPI.sendTestNotification(data);
            setLastResult(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailNotificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setLastResult(null);
    };

    return {
        sendTestNotification,
        loading,
        error,
        lastResult,
        reset,
    };
}

// Comprehensive email notifications hook
export function useEmailNotifications() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendBulkNotifications = async (data: BulkEmailRequest): Promise<BulkEmailResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await EmailNotificationsAPI.sendBulkNotifications(data);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailNotificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const sendSingleNotification = async (data: SingleEmailRequest): Promise<SingleEmailResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await EmailNotificationsAPI.sendSingleNotification(data);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailNotificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const sendTestNotification = async (data: TestEmailRequest): Promise<SingleEmailResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await EmailNotificationsAPI.sendTestNotification(data);
            return response.data;
        } catch (err) {
            const errorMessage = handleEmailNotificationApiError(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Convenience methods
    const sendProjectUpdateNotification = async (
        recipientEmail: string,
        recipientName: string,
        projectName: string,
        updateType: string,
        updateDetails: string,
        projectId: string,
        businessName?: string
    ): Promise<SingleEmailResponse> => {
        return sendSingleNotification({
            recipientEmail,
            recipientName,
            type: "projectUpdates",
            title: `Project Update: ${projectName}`,
            message: `${updateType}: ${updateDetails}`,
            link: `/dashboard/projects/${projectId}`,
            metadata: {
                projectName,
                updateType,
                projectId,
                eventType: "project_update",
            },
            businessName,
        });
    };

    const sendTaskAssignmentNotification = async (
        recipientEmail: string,
        recipientName: string,
        taskName: string,
        taskId: string,
        assignedBy: string,
        businessName?: string
    ): Promise<SingleEmailResponse> => {
        return sendSingleNotification({
            recipientEmail,
            recipientName,
            type: "taskAssignments",
            title: `New Task Assignment: ${taskName}`,
            message: `You have been assigned a new task: ${taskName}`,
            link: `/dashboard/tasks/${taskId}`,
            metadata: {
                taskName,
                taskId,
                assignedBy,
                eventType: "task_assignment",
            },
            businessName,
        });
    };

    const sendEquipmentAlertNotification = async (
        recipientEmail: string,
        recipientName: string,
        equipmentName: string,
        alertType: string,
        description: string,
        equipmentId: string,
        priority: "low" | "medium" | "high" = "medium",
        businessName?: string
    ): Promise<SingleEmailResponse> => {
        return sendSingleNotification({
            recipientEmail,
            recipientName,
            type: "equipmentAlerts",
            title: `Equipment Alert: ${equipmentName}`,
            message: `${alertType}: ${description}`,
            link: `/dashboard/equipment/${equipmentId}`,
            metadata: {
                equipmentName,
                alertType,
                equipmentId,
                priority,
                eventType: "equipment_alert",
            },
            businessName,
        });
    };

    const sendInvoiceUpdateNotification = async (
        recipientEmail: string,
        recipientName: string,
        invoiceNumber: string,
        updateType: string,
        invoiceId: string,
        businessName?: string
    ): Promise<SingleEmailResponse> => {
        return sendSingleNotification({
            recipientEmail,
            recipientName,
            type: "invoiceUpdates",
            title: `Invoice Update: ${invoiceNumber}`,
            message: `Invoice ${invoiceNumber} has been ${updateType}`,
            link: `/dashboard/invoices/${invoiceId}`,
            metadata: {
                invoiceNumber,
                updateType,
                invoiceId,
                eventType: "invoice_update",
            },
            businessName,
        });
    };

    const sendSystemAnnouncementNotification = async (
        recipientEmail: string,
        recipientName: string,
        announcementTitle: string,
        announcementMessage: string,
        businessName?: string
    ): Promise<SingleEmailResponse> => {
        return sendSingleNotification({
            recipientEmail,
            recipientName,
            type: "systemAnnouncements",
            title: announcementTitle,
            message: announcementMessage,
            link: "/dashboard/notifications",
            metadata: {
                eventType: "system_announcement",
            },
            businessName,
        });
    };

    const reset = () => {
        setError(null);
    };

    return {
        // Core methods
        sendBulkNotifications,
        sendSingleNotification,
        sendTestNotification,

        // Convenience methods
        sendProjectUpdateNotification,
        sendTaskAssignmentNotification,
        sendEquipmentAlertNotification,
        sendInvoiceUpdateNotification,
        sendSystemAnnouncementNotification,

        // State
        loading,
        error,
        reset,

        // Utilities
        utils: EmailNotificationUtils,
    };
}

// Hook for email notification statistics
export function useEmailNotificationStats() {
    const [stats, setStats] = useState<{
        totalSent: number;
        totalFailed: number;
        successRate: number;
        lastSent: Date | null;
    }>({
        totalSent: 0,
        totalFailed: 0,
        successRate: 0,
        lastSent: null,
    });

    const updateStats = (result: BulkEmailResponse) => {
        setStats(prev => ({
            totalSent: prev.totalSent + result.successful,
            totalFailed: prev.totalFailed + result.failed,
            successRate: ((prev.totalSent + result.successful) /
                (prev.totalSent + prev.totalFailed + result.successful + result.failed)) * 100,
            lastSent: new Date(),
        }));
    };

    const resetStats = () => {
        setStats({
            totalSent: 0,
            totalFailed: 0,
            successRate: 0,
            lastSent: null,
        });
    };

    return {
        stats,
        updateStats,
        resetStats,
    };
}
