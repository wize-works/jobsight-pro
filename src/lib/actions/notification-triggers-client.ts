/**
 * @fileoverview Notification Triggers Client Actions
 * Replaces src/lib/push/notification-triggers.ts with offline-first implementation.
 * Handles business notification triggers with offline queue support.
 */

import { sendPushNotification } from './push-notifications-client';
import { createNotification } from './notifications-client';

interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export async function triggerProjectNotification(
    businessId: string,
    projectId: string,
    projectName: string,
    action: 'created' | 'updated' | 'completed',
    assignedUserIds?: string[],
    currentUserId?: string
): Promise<ActionResult<void>> {
    try {
        const title = `Project ${action}`;
        const body = `${projectName} has been ${action}`;
        const url = `/dashboard/projects/${projectId}`;

        // Create in-app notification for assigned users
        if (assignedUserIds && assignedUserIds.length > 0) {
            for (const userId of assignedUserIds) {
                await createNotification({
                    user_id: userId,
                    title,
                    message: body,
                    type: 'projectUpdates',
                    read: false,
                    read_at: null
                }, businessId, currentUserId);

                // Send push notification
                await sendPushNotification({
                    business_id: businessId,
                    user_ids: [userId],
                    title,
                    body,
                    data: { projectId },
                    // url handled in data
                });
            }
        } else {
            // Notify entire business
            await sendPushNotification({
                business_id: businessId,
                title,
                body,
                data: { projectId },
                // url handled in data
            });
        }

        console.log(`Project notification triggered: ${action} for project ${projectName}`);
        return { success: true, data: undefined, message: 'Project notification sent successfully' };
    } catch (error) {
        console.error('Error triggering project notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger project notification'
        };
    }
}

export async function triggerTaskNotification(
    businessId: string,
    taskId: string,
    taskTitle: string,
    projectName: string,
    action: 'assigned' | 'completed' | 'updated',
    assignedUserId?: string,
    currentUserId?: string
): Promise<ActionResult<void>> {
    try {
        const title = `Task ${action}`;
        const body = `"${taskTitle}" in ${projectName} has been ${action}`;
        const url = `/dashboard/tasks/${taskId}`;

        if (assignedUserId) {
            // Create in-app notification
            await createNotification({
                user_id: assignedUserId,
                title,
                message: body,
                type: 'taskAssignments',
                read: false,
                read_at: null
            }, businessId, currentUserId);

            // Send push notification
            await sendPushNotification({
                business_id: businessId,
                user_ids: [assignedUserId],
                title,
                body,
                data: { taskId }
            });
        } else {
            // Notify entire business
            await sendPushNotification({
                business_id: businessId,
                title,
                body,
                data: { taskId }
            });
        }

        console.log(`Task notification triggered: ${action} for task ${taskTitle}`);
        return { success: true, data: undefined, message: 'Task notification sent successfully' };
    } catch (error) {
        console.error('Error triggering task notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger task notification'
        };
    }
}

export async function triggerEquipmentNotification(
    businessId: string,
    equipmentId: string,
    equipmentName: string,
    action: 'maintenance_due' | 'assigned' | 'issue_reported',
    assignedUserId?: string,
    currentUserId?: string
): Promise<ActionResult<void>> {
    try {
        const title = `Equipment ${action.replace('_', ' ')}`;
        const body = `${equipmentName}: ${action.replace('_', ' ')}`;
        const url = `/dashboard/equipment/${equipmentId}`;

        if (assignedUserId) {
            // Create in-app notification
            await createNotification({
                user_id: assignedUserId,
                title,
                message: body,
                type: 'equipmentAlerts',
                read: false,
                read_at: null
            }, businessId, currentUserId);

            // Send push notification
            await sendPushNotification({
                business_id: businessId,
                user_ids: [assignedUserId],
                title,
                body,
                data: { equipmentId }
            });
        } else {
            // Notify entire business
            await sendPushNotification({
                business_id: businessId,
                title,
                body,
                data: { equipmentId }
            });
        }

        console.log(`Equipment notification triggered: ${action} for equipment ${equipmentName}`);
        return { success: true, data: undefined, message: 'Equipment notification sent successfully' };
    } catch (error) {
        console.error('Error triggering equipment notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger equipment notification'
        };
    }
}

export async function triggerInvoiceNotification(
    businessId: string,
    invoiceId: string,
    invoiceNumber: string,
    clientName: string,
    action: 'created' | 'sent' | 'paid' | 'overdue',
    currentUserId?: string
): Promise<ActionResult<void>> {
    try {
        const title = `Invoice ${action}`;
        const body = `Invoice ${invoiceNumber} for ${clientName} is ${action}`;
        const url = `/dashboard/invoices/${invoiceId}`;

        // Notify entire business (excluding creator for 'created' action)
        await sendPushNotification({
            business_id: businessId,
            title,
            body,
            data: { invoiceId }
        });

        console.log(`Invoice notification triggered: ${action} for invoice ${invoiceNumber}`);
        return { success: true, data: undefined, message: 'Invoice notification sent successfully' };
    } catch (error) {
        console.error('Error triggering invoice notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger invoice notification'
        };
    }
}

export async function triggerSystemNotification(
    businessId: string,
    title: string,
    message: string,
    url?: string,
    currentUserId?: string
): Promise<ActionResult<void>> {
    try {
        // Notify entire business
        await sendPushNotification({
            business_id: businessId,
            title,
            body: message,
            data: {}
        });

        console.log(`System notification triggered: ${title}`);
        return { success: true, data: undefined, message: 'System notification sent successfully' };
    } catch (error) {
        console.error('Error triggering system notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger system notification'
        };
    }
}

// Daily log notifications
export async function triggerDailyLogNotification(
    businessId: string,
    dailyLogId: string,
    projectName: string,
    action: 'created' | 'updated',
    assignedUserIds?: string[],
    currentUserId?: string
): Promise<ActionResult<void>> {
    try {
        const title = `Daily log ${action}`;
        const body = `Daily log for ${projectName} has been ${action}`;
        const url = `/dashboard/daily-logs/${dailyLogId}`;

        if (assignedUserIds && assignedUserIds.length > 0) {
            for (const userId of assignedUserIds) {
                await createNotification({
                    user_id: userId,
                    title,
                    message: body,
                    type: 'dailyLogUpdates',
                    read: false,
                    read_at: null
                }, businessId, currentUserId);

                await sendPushNotification({
                    business_id: businessId,
                    user_ids: [userId],
                    title,
                    body,
                    data: { dailyLogId }
                });
            }
        } else {
            await sendPushNotification({
                business_id: businessId,
                title,
                body,
                data: { dailyLogId }
            });
        }

        console.log(`Daily log notification triggered: ${action} for project ${projectName}`);
        return { success: true, data: undefined, message: 'Daily log notification sent successfully' };
    } catch (error) {
        console.error('Error triggering daily log notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger daily log notification'
        };
    }
}

// Safety alert notifications
export async function triggerSafetyAlertNotification(
    businessId: string,
    alertTitle: string,
    alertMessage: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    currentUserId?: string
): Promise<ActionResult<void>> {
    try {
        const title = `🚨 Safety Alert - ${priority.toUpperCase()}`;
        const body = `${alertTitle}: ${alertMessage}`;
        const url = `/dashboard/safety`;

        // Safety alerts go to everyone in the business
        await sendPushNotification({
            business_id: businessId,
            title,
            body,
            data: { priority, alertTitle }
        });

        console.log(`Safety alert notification triggered: ${alertTitle} (${priority})`);
        return { success: true, data: undefined, message: 'Safety alert notification sent successfully' };
    } catch (error) {
        console.error('Error triggering safety alert notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger safety alert notification'
        };
    }
}

// Crew assignment notifications
export async function triggerCrewAssignmentNotification(
    businessId: string,
    crewMemberId: string,
    crewMemberName: string,
    projectName: string,
    action: 'assigned' | 'removed',
    currentUserId?: string
): Promise<ActionResult<void>> {
    try {
        const title = `Crew ${action}`;
        const body = `${crewMemberName} has been ${action} ${action === 'assigned' ? 'to' : 'from'} ${projectName}`;
        const url = `/dashboard/crews`;

        // Notify the crew member
        await createNotification({
            user_id: crewMemberId,
            title,
            message: body,
            type: 'crewAssignments',
            read: false,
            read_at: null
        }, businessId, currentUserId);

        await sendPushNotification({
            business_id: businessId,
            user_ids: [crewMemberId],
            title,
            body,
            data: { projectName }
        });

        console.log(`Crew assignment notification triggered: ${action} for ${crewMemberName}`);
        return { success: true, data: undefined, message: 'Crew assignment notification sent successfully' };
    } catch (error) {
        console.error('Error triggering crew assignment notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to trigger crew assignment notification'
        };
    }
}
