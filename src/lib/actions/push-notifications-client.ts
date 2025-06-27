/**
 * @fileoverview Push Notifications Client Actions
 * Offline-first push notification system using only push_subscriptions table.
 * Notifications are sent directly without persistent storage in database.
 * Uses IndexedDB for offline queueing when network is unavailable.
 */

import { Database } from '@/types/supabase';

type PushSubscriptionRow = Database['public']['Tables']['push_subscriptions']['Row'];

// Interface for queued notifications (stored in IndexedDB only)
interface QueuedNotification {
    id: string;
    business_id: string;
    user_id?: string;
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
    created_at: string;
    retry_count: number;
    max_retries: number;
}

// IndexedDB operations for notification queue
class NotificationQueue {
    private dbName = 'jobsight_notifications';
    private storeName = 'queued_notifications';
    private db: IDBDatabase | null = null;

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('business_id', 'business_id', { unique: false });
                    store.createIndex('created_at', 'created_at', { unique: false });
                }
            };
        });
    }

    async add(notification: QueuedNotification): Promise<void> {
        const db = await this.getDB();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise((resolve, reject) => {
            const request = store.add(notification);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getAll(business_id: string): Promise<QueuedNotification[]> {
        const db = await this.getDB();
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('business_id');

        return new Promise((resolve, reject) => {
            const request = index.getAll(business_id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    async remove(id: string): Promise<void> {
        const db = await this.getDB();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async update(notification: QueuedNotification): Promise<void> {
        const db = await this.getDB();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise((resolve, reject) => {
            const request = store.put(notification);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

const notificationQueue = new NotificationQueue();

// Get push subscriptions from Supabase
const getPushSubscriptions = async (business_id: string, user_ids?: string[]): Promise<PushSubscriptionRow[]> => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
        .from('push_subscriptions')
        .select('*')
        .eq('business_id', business_id);

    if (user_ids && user_ids.length > 0) {
        query = query.in('user_id', user_ids);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
};

// Send push notification via service worker/API
const sendPushToSubscription = async (subscription: PushSubscriptionRow, payload: any): Promise<boolean> => {
    try {
        const response = await fetch('/api/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
                p256dh: subscription.p256dh,
                auth: subscription.auth,
                payload
            }),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to send push notification:', error);
        return false;
    }
};

// Main push notification function
export const sendPushNotification = async (params: {
    business_id: string;
    user_ids?: string[];
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
}) => {
    const { business_id, user_ids, title, body, icon, badge, data, actions } = params;

    try {
        // Check if online
        const isOnline = navigator.onLine;

        if (!isOnline) {
            // Queue notification for later sending
            const queuedNotification: QueuedNotification = {
                id: crypto.randomUUID(),
                business_id,
                user_id: user_ids?.[0], // For single user notifications
                title,
                body,
                icon,
                badge,
                data,
                actions,
                created_at: new Date().toISOString(),
                retry_count: 0,
                max_retries: 3
            };

            await notificationQueue.add(queuedNotification);
            return { success: true, queued: true, notification_id: queuedNotification.id };
        }

        // Get push subscriptions
        const subscriptions = await getPushSubscriptions(business_id, user_ids);

        if (!subscriptions.length) {
            return { success: false, error: 'No push subscriptions found' };
        }

        const results = [];
        const payload = { title, body, icon, badge, data, actions };

        for (const subscription of subscriptions) {
            const sent = await sendPushToSubscription(subscription, payload);
            results.push({
                success: sent,
                user_id: subscription.user_id,
                subscription_id: subscription.id
            });
        }

        const successCount = results.filter(r => r.success).length;

        return {
            success: successCount > 0,
            results,
            sent_count: successCount,
            total_count: results.length
        };
    } catch (error) {
        console.error('Error sending push notifications:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

// Process queued notifications when coming back online
export const processQueuedNotifications = async (business_id: string) => {
    try {
        const queuedNotifications = await notificationQueue.getAll(business_id);
        const results = [];

        for (const notification of queuedNotifications) {
            if (notification.retry_count >= notification.max_retries) {
                // Remove notifications that have exceeded max retries
                await notificationQueue.remove(notification.id);
                continue;
            }

            const result = await sendPushNotification({
                business_id: notification.business_id,
                user_ids: notification.user_id ? [notification.user_id] : undefined,
                title: notification.title,
                body: notification.body,
                icon: notification.icon,
                badge: notification.badge,
                data: notification.data,
                actions: notification.actions
            });

            if (result.success && !result.queued) {
                // Successfully sent, remove from queue
                await notificationQueue.remove(notification.id);
                results.push({ success: true, notification_id: notification.id });
            } else {
                // Failed to send, increment retry count
                notification.retry_count++;
                if (notification.retry_count >= notification.max_retries) {
                    await notificationQueue.remove(notification.id);
                } else {
                    await notificationQueue.update(notification);
                }
                results.push({ success: false, notification_id: notification.id, error: result.error });
            }
        }

        return { success: true, processed: results.length, results };
    } catch (error) {
        console.error('Error processing queued notifications:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

// Get notification queue status
export const getQueueStatus = async (business_id: string) => {
    try {
        const queuedNotifications = await notificationQueue.getAll(business_id);

        return {
            success: true,
            data: {
                total: queuedNotifications.length,
                pending: queuedNotifications.filter(n => n.retry_count === 0).length,
                retrying: queuedNotifications.filter(n => n.retry_count > 0 && n.retry_count < n.max_retries).length,
                failed: queuedNotifications.filter(n => n.retry_count >= n.max_retries).length
            }
        };
    } catch (error) {
        console.error('Error getting queue status:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

// Clear notification queue (for testing or cleanup)
export const clearNotificationQueue = async (business_id: string) => {
    try {
        const queuedNotifications = await notificationQueue.getAll(business_id);

        for (const notification of queuedNotifications) {
            await notificationQueue.remove(notification.id);
        }

        return { success: true, cleared: queuedNotifications.length };
    } catch (error) {
        console.error('Error clearing notification queue:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

// Auto-sync when coming online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        // Get business_id from current context (you may need to adjust this)
        const business_id = localStorage.getItem('current_business_id');
        if (business_id) {
            processQueuedNotifications(business_id);
        }
    });
}
