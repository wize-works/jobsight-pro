
'use server';

import { sendPushNotificationToUser, sendPushNotificationToBusiness } from './actions';
import { createNotification } from '@/app/actions/notifications';
import { withBusinessServer } from '@/lib/auth/with-business-server';

export async function triggerProjectNotification(
    projectId: string,
    projectName: string,
    action: 'created' | 'updated' | 'completed',
    assignedUserIds?: string[]
) {
    try {
        const { userId } = await withBusinessServer();

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
                    //related_entity_type: 'project',
                    //related_entity_id: projectId,
                    read: false,
                    read_at: null
                });

                // Send push notification
                await sendPushNotificationToUser(userId, title, body, { projectId }, url);
            }
        } else {
            // Notify entire business
            await sendPushNotificationToBusiness(title, body, { projectId }, url, userId);
        }

        console.log(`Project notification triggered: ${action} for project ${projectName}`);
    } catch (error) {
        console.error('Error triggering project notification:', error);
    }
}

export async function triggerTaskNotification(
    taskId: string,
    taskTitle: string,
    projectName: string,
    action: 'assigned' | 'completed' | 'updated',
    assignedUserId?: string
) {
    try {
        const { userId } = await withBusinessServer();

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
                //related_entity_type: 'task',
                //related_entity_id: taskId,
                read: false,
                read_at: null,
            });

            // Send push notification
            await sendPushNotificationToUser(assignedUserId, title, body, { taskId }, url);
        } else {
            // Notify entire business
            await sendPushNotificationToBusiness(title, body, { taskId }, url, userId);
        }

        console.log(`Task notification triggered: ${action} for task ${taskTitle}`);
    } catch (error) {
        console.error('Error triggering task notification:', error);
    }
}

export async function triggerEquipmentNotification(
    equipmentId: string,
    equipmentName: string,
    action: 'maintenance_due' | 'assigned' | 'issue_reported',
    assignedUserId?: string
) {
    try {
        const { userId } = await withBusinessServer();

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
                //related_entity_type: 'equipment',
                //related_entity_id: equipmentId,
                read: false,
                read_at: null,
            });

            // Send push notification
            await sendPushNotificationToUser(assignedUserId, title, body, { equipmentId }, url);
        } else {
            // Notify entire business
            await sendPushNotificationToBusiness(title, body, { equipmentId }, url, userId);
        }

        console.log(`Equipment notification triggered: ${action} for equipment ${equipmentName}`);
    } catch (error) {
        console.error('Error triggering equipment notification:', error);
    }
}

export async function triggerInvoiceNotification(
    invoiceId: string,
    invoiceNumber: string,
    clientName: string,
    action: 'created' | 'sent' | 'paid' | 'overdue'
) {
    try {
        const { userId } = await withBusinessServer();

        const title = `Invoice ${action}`;
        const body = `Invoice ${invoiceNumber} for ${clientName} is ${action}`;
        const url = `/dashboard/invoices/${invoiceId}`;

        // Notify entire business (excluding creator for 'created' action)
        const excludeUserId = action === 'created' ? userId : undefined;
        await sendPushNotificationToBusiness(title, body, { invoiceId }, url, excludeUserId);

        console.log(`Invoice notification triggered: ${action} for invoice ${invoiceNumber}`);
    } catch (error) {
        console.error('Error triggering invoice notification:', error);
    }
}

export async function triggerSystemNotification(
    title: string,
    message: string,
    url?: string
) {
    try {
        const { userId } = await withBusinessServer();

        // Notify entire business
        await sendPushNotificationToBusiness(title, message, {}, url, userId);

        console.log(`System notification triggered: ${title}`);
    } catch (error) {
        console.error('Error triggering system notification:', error);
    }
}
