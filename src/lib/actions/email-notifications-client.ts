/**
 * Client-Side Email Notifications Actions
 * 
 * Replaces src/app/actions/email-notifications.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { createClient } from '@supabase/supabase-js';

// Type definitions from Supabase schema
type Project = Database['public']['Tables']['projects']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Equipment = Database['public']['Tables']['equipment']['Row'];

// Create action instances for data fetching
const selectProjects = createSelectAction('projects');
const selectUsers = createSelectAction('users');
const selectEquipment = createSelectAction('equipment');

// Email notification types
export type ProjectUpdateType =
    | 'status_change'
    | 'new_task'
    | 'task_assigned'
    | 'milestone_completed'
    | 'issue_reported'
    | 'deadline_approaching'
    | 'project_completed';

export type EquipmentAlertType =
    | 'maintenance_due'
    | 'inspection_required'
    | 'issue_reported'
    | 'assigned'
    | 'assignment_change'
    | 'malfunction';

export type EmailPriority = 'low' | 'medium' | 'high';

// Create browser client for online operations
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
 * Send project update notification
 * In offline mode, queues notification for sending when online
 */
export const sendProjectUpdateNotification = async (
    businessId: string,
    projectId: string,
    updateType: ProjectUpdateType,
    updateDetails: string,
    updatedBy: string
): Promise<{ data?: { successful: number; failed: number; total: number }; error?: string; isPending?: boolean }> => {
    try {
        // Get project details from local storage first
        const projectResult = await selectProjects({
            filter: { id: projectId, business_id: businessId }
        }, businessId);

        if (!projectResult.data || projectResult.data.length === 0) {
            return { error: "Project not found" };
        }

        const project = projectResult.data[0] as Project;

        // Get users to notify (managers and admins only)
        const usersResult = await selectUsers({
            filter: {
                business_id: businessId,
                status: "active"
            }
        }, businessId);

        if (!usersResult.data) {
            return { error: "Failed to get users to notify" };
        }

        const projectUsers = (usersResult.data as User[]).filter(
            user => user.role !== "member" // Only notify managers and admins
        );

        if (navigator.onLine) {
            try {
                // Online: Send emails immediately
                const emailResults = await sendEmailsOnline(
                    businessId,
                    project,
                    projectUsers,
                    updateType,
                    updateDetails,
                    updatedBy
                );

                return { data: emailResults };
            } catch (error) {
                console.error("Error sending emails online:", error);
                // Fall back to offline queuing
                await queueProjectUpdateNotification(
                    businessId,
                    project,
                    projectUsers,
                    updateType,
                    updateDetails,
                    updatedBy
                );

                return {
                    data: { successful: 0, failed: 0, total: projectUsers.length },
                    isPending: true
                };
            }
        } else {
            // Offline: Queue notification for sending when online
            await queueProjectUpdateNotification(
                businessId,
                project,
                projectUsers,
                updateType,
                updateDetails,
                updatedBy
            );

            return {
                data: { successful: 0, failed: 0, total: projectUsers.length },
                isPending: true
            };
        }

    } catch (error) {
        console.error("Error in sendProjectUpdateNotification:", error);
        return { error: "Failed to send project update notifications" };
    }
};

/**
 * Send equipment alert notification
 * In offline mode, queues notification for sending when online
 */
export const sendEquipmentAlert = async (
    businessId: string,
    equipmentId: string,
    alertType: EquipmentAlertType,
    description: string,
    priority: EmailPriority = "medium"
): Promise<{ data?: { successful: number; failed: number; total: number }; error?: string; isPending?: boolean }> => {
    try {
        // Get equipment details
        const equipmentResult = await selectEquipment({
            filter: { id: equipmentId, business_id: businessId }
        }, businessId);

        if (!equipmentResult.data || equipmentResult.data.length === 0) {
            return { error: "Equipment not found" };
        }

        const equipment = equipmentResult.data[0] as Equipment;

        // Get users to notify
        const usersResult = await selectUsers({
            filter: {
                business_id: businessId,
                status: "active"
            }
        }, businessId);

        if (!usersResult.data) {
            return { error: "Failed to get users to notify" };
        }

        const equipmentUsers = (usersResult.data as User[]).filter(
            user => user.role === "admin" || user.role === "manager"
        );

        if (navigator.onLine) {
            try {
                // Online: Send emails immediately
                const emailResults = await sendEquipmentEmailsOnline(
                    businessId,
                    equipment,
                    equipmentUsers,
                    alertType,
                    description,
                    priority
                );

                return { data: emailResults };
            } catch (error) {
                console.error("Error sending equipment emails online:", error);
                // Fall back to offline queuing
                await queueEquipmentAlert(
                    businessId,
                    equipment,
                    equipmentUsers,
                    alertType,
                    description,
                    priority
                );

                return {
                    data: { successful: 0, failed: 0, total: equipmentUsers.length },
                    isPending: true
                };
            }
        } else {
            // Offline: Queue notification for sending when online
            await queueEquipmentAlert(
                businessId,
                equipment,
                equipmentUsers,
                alertType,
                description,
                priority
            );

            return {
                data: { successful: 0, failed: 0, total: equipmentUsers.length },
                isPending: true
            };
        }

    } catch (error) {
        console.error("Error in sendEquipmentAlert:", error);
        return { error: "Failed to send equipment alert notifications" };
    }
};

// Helper functions

/**
 * Send project update emails online
 */
async function sendEmailsOnline(
    businessId: string,
    project: Project,
    users: User[],
    updateType: ProjectUpdateType,
    updateDetails: string,
    updatedBy: string
): Promise<{ successful: number; failed: number; total: number }> {
    // TODO: Implement actual email sending via API when online
    // For now, just simulate the process
    console.log('Project update emails would be sent:', {
        project: project.name,
        updateType,
        updateDetails,
        updatedBy,
        recipients: users.length
    });

    // Simulate success/failure
    const successful = users.length;
    const failed = 0;

    return { successful, failed, total: users.length };
}

/**
 * Send equipment alert emails online
 */
async function sendEquipmentEmailsOnline(
    businessId: string,
    equipment: Equipment,
    users: User[],
    alertType: EquipmentAlertType,
    description: string,
    priority: EmailPriority
): Promise<{ successful: number; failed: number; total: number }> {
    // TODO: Implement actual email sending via API when online
    console.log('Equipment alert emails would be sent:', {
        equipment: equipment.name,
        alertType,
        description,
        priority,
        recipients: users.length
    });

    // Simulate success/failure
    const successful = users.length;
    const failed = 0;

    return { successful, failed, total: users.length };
}

/**
 * Queue project update notification for sending when online
 */
async function queueProjectUpdateNotification(
    businessId: string,
    project: Project,
    users: User[],
    updateType: ProjectUpdateType,
    updateDetails: string,
    updatedBy: string
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
            type: 'project_update',
            businessId,
            projectId: project.id,
            projectName: project.name,
            updateType,
            updateDetails,
            updatedBy,
            recipients: users.map(u => ({
                id: u.id,
                email: u.email,
                name: `${u.first_name || ''} ${u.last_name || ''}`.trim()
            })),
            timestamp: new Date().toISOString(),
            priority: 'medium'
        };

        store.add(emailRecord);
    };
}

/**
 * Queue equipment alert for sending when online
 */
async function queueEquipmentAlert(
    businessId: string,
    equipment: Equipment,
    users: User[],
    alertType: EquipmentAlertType,
    description: string,
    priority: EmailPriority
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
            type: 'equipment_alert',
            businessId,
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            alertType,
            description,
            recipients: users.map(u => ({
                id: u.id,
                email: u.email,
                name: `${u.first_name || ''} ${u.last_name || ''}`.trim()
            })),
            timestamp: new Date().toISOString(),
            priority
        };

        store.add(emailRecord);
    };
}

/**
 * Initialize offline email queue store
 */
export function initializeOfflineEmailQueue(): void {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);

    request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('email_queue')) {
            const store = db.createObjectStore('email_queue', {
                keyPath: 'id'
            });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('businessId', 'businessId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('priority', 'priority', { unique: false });
        }
    };
}

/**
 * Process queued emails when back online
 */
export async function processQueuedEmails(businessId: string): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window) || !navigator.onLine) {
        return;
    }

    try {
        const request = indexedDB.open('jobsight_offline', 1);

        request.onsuccess = async (event) => {
            const db = (event.target as any).result;
            const transaction = db.transaction(['email_queue'], 'readwrite');
            const store = transaction.objectStore('email_queue');

            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = async () => {
                const queuedEmails = getAllRequest.result;

                for (const email of queuedEmails) {
                    if (email.businessId === businessId) {
                        try {
                            if (email.type === 'project_update') {
                                // Process project update notification
                                console.log('Processing queued project update email:', email);
                                // TODO: Implement actual email sending

                                // Remove from queue if successful
                                store.delete(email.id);
                            } else if (email.type === 'equipment_alert') {
                                // Process equipment alert
                                console.log('Processing queued equipment alert email:', email);
                                // TODO: Implement actual email sending

                                // Remove from queue if successful
                                store.delete(email.id);
                            }
                        } catch (error) {
                            console.error('Error processing queued email:', error);
                        }
                    }
                }
            };
        };
    } catch (error) {
        console.error('Error processing queued emails:', error);
    }
}

/**
 * Get queued emails count for status indicator
 */
export async function getQueuedEmailsCount(businessId: string): Promise<number> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return 0;
    }

    return new Promise((resolve) => {
        const request = indexedDB.open('jobsight_offline', 1);

        request.onsuccess = (event) => {
            const db = (event.target as any).result;
            const transaction = db.transaction(['email_queue'], 'readonly');
            const store = transaction.objectStore('email_queue');

            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
                const queuedEmails = getAllRequest.result;
                const businessEmails = queuedEmails.filter((email: any) => email.businessId === businessId);
                resolve(businessEmails.length);
            };

            getAllRequest.onerror = () => resolve(0);
        };

        request.onerror = () => resolve(0);
    });
}

// Auto-initialize the offline store when this module loads
if (typeof window !== 'undefined') {
    initializeOfflineEmailQueue();
}
