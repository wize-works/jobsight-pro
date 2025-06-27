/**
 * Client-Side Push Subscriptions Actions
 * 
 * Replaces src/app/actions/push-subscriptions.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";

// Type definitions from Supabase schema
type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];
type PushSubscriptionInsert = Database['public']['Tables']['push_subscriptions']['Insert'];
type PushSubscriptionUpdate = Database['public']['Tables']['push_subscriptions']['Update'];

// Create action instances
const insertPushSubscription = createInsertAction('push_subscriptions', 'high');
const updatePushSubscription = createUpdateAction('push_subscriptions', 'high');
const deletePushSubscription = createDeleteAction('push_subscriptions', 'medium');
const selectPushSubscriptions = createSelectAction('push_subscriptions');

/**
 * Get all push subscriptions for a user
 */
export const getPushSubscriptions = async (
    businessId: string,
    userId: string
): Promise<PushSubscription[]> => {
    try {
        const result = await selectPushSubscriptions({
            filter: {
                user_id: userId,
                business_id: businessId
            }
        }, businessId);

        if (result.error) {
            console.error("Error fetching push subscriptions:", result.error);
            return [];
        }

        return (result.data || []) as PushSubscription[];
    } catch (error) {
        console.error("Error in getPushSubscriptions:", error);
        return [];
    }
};

/**
 * Create or update a push subscription
 */
export const createPushSubscription = async (
    businessId: string,
    subscriptionData: {
        userId: string;
        endpoint: string;
        p256dh: string;
        auth: string;
    }
): Promise<{ data?: PushSubscription; error?: string }> => {
    try {
        // Check if subscription already exists
        const existingResult = await selectPushSubscriptions({
            filter: {
                user_id: subscriptionData.userId,
                business_id: businessId,
                endpoint: subscriptionData.endpoint
            }
        }, businessId);

        if (existingResult.data && existingResult.data.length > 0) {
            // Update existing subscription
            const existing = existingResult.data[0] as PushSubscription;

            const updateData: PushSubscriptionUpdate = {
                p256dh: subscriptionData.p256dh,
                auth: subscriptionData.auth,
                user_agent: navigator.userAgent,
                last_used_at: new Date().toISOString(),
                created_at: existing.created_at,
                updated_at: new Date().toISOString(),
                created_by: existing.created_by,
                updated_by: subscriptionData.userId
            };

            const result = await updatePushSubscription(updateData, businessId, subscriptionData.userId);
            if (result.error) {
                return { error: result.error };
            }

            return { data: result.data as PushSubscription };
        } else {
            // Create new subscription
            const insertData: PushSubscriptionInsert = {
                id: crypto.randomUUID(),
                user_id: subscriptionData.userId,
                business_id: businessId,
                endpoint: subscriptionData.endpoint,
                p256dh: subscriptionData.p256dh,
                auth: subscriptionData.auth,
                user_agent: navigator.userAgent,
                last_used_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: subscriptionData.userId,
                updated_by: subscriptionData.userId
            };

            const result = await insertPushSubscription(insertData, businessId, subscriptionData.userId);
            if (result.error) {
                return { error: result.error };
            }

            return { data: result.data as PushSubscription };
        }
    } catch (error) {
        console.error("Error in createPushSubscription:", error);
        return { error: "Failed to create push subscription" };
    }
};

/**
 * Register push subscription from browser API
 */
export const registerPushSubscription = async (
    businessId: string,
    userId: string
): Promise<{ data?: PushSubscription; error?: string }> => {
    try {
        // Check if service worker and push notifications are supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return { error: "Push notifications are not supported in this browser" };
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { error: "Notification permission denied" };
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Get VAPID public key from environment or server
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            return { error: "VAPID public key not configured" };
        }

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // Extract subscription details
        const subscriptionJson = subscription.toJSON();
        if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
            return { error: "Invalid subscription data" };
        }

        // Store subscription in our database
        return await createPushSubscription(businessId, {
            userId,
            endpoint: subscriptionJson.endpoint,
            p256dh: subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys.auth
        });

    } catch (error) {
        console.error("Error registering push subscription:", error);
        return { error: "Failed to register push subscription" };
    }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribePushNotifications = async (
    businessId: string,
    userId: string,
    endpoint?: string
): Promise<{ data?: boolean; error?: string }> => {
    try {
        // Get subscriptions to delete
        let subscriptionsToDelete: PushSubscription[];

        if (endpoint) {
            // Delete specific subscription
            const result = await selectPushSubscriptions({
                filter: {
                    user_id: userId,
                    business_id: businessId,
                    endpoint: endpoint
                }
            }, businessId);
            subscriptionsToDelete = (result.data || []) as PushSubscription[];
        } else {
            // Delete all subscriptions for user
            subscriptionsToDelete = await getPushSubscriptions(businessId, userId);
        }

        // Delete subscriptions from database
        for (const subscription of subscriptionsToDelete) {
            await deletePushSubscription(subscription.id, businessId, userId);
        }

        // Unsubscribe from browser push manager
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                        await subscription.unsubscribe();
                    }
                }
            } catch (error) {
                console.error("Error unsubscribing from browser push manager:", error);
                // Continue anyway since we've removed from database
            }
        }

        return { data: true };

    } catch (error) {
        console.error("Error in unsubscribePushNotifications:", error);
        return { error: "Failed to unsubscribe from push notifications" };
    }
};

/**
 * Check if user has active push subscriptions
 */
export const hasActivePushSubscription = async (
    businessId: string,
    userId: string
): Promise<boolean> => {
    try {
        const subscriptions = await getPushSubscriptions(businessId, userId);
        return subscriptions.length > 0;
    } catch (error) {
        console.error("Error checking push subscription status:", error);
        return false;
    }
};

/**
 * Send test push notification
 */
export const sendTestPushNotification = async (
    businessId: string,
    userId: string
): Promise<{ data?: { sent: number }; error?: string }> => {
    try {
        const subscriptions = await getPushSubscriptions(businessId, userId);

        if (subscriptions.length === 0) {
            return { error: "No push subscriptions found for user" };
        }

        // In offline mode, queue the test notification
        if (!navigator.onLine) {
            await queueTestNotification(businessId, userId, subscriptions);
            return {
                data: { sent: subscriptions.length }
            };
        }

        // TODO: Implement actual push notification sending when online
        console.log('Test push notification would be sent to:', {
            userId,
            subscriptionCount: subscriptions.length
        });

        return { data: { sent: subscriptions.length } };

    } catch (error) {
        console.error("Error sending test push notification:", error);
        return { error: "Failed to send test notification" };
    }
};

/**
 * Cleanup expired push subscriptions
 */
export const cleanupExpiredSubscriptions = async (
    businessId: string,
    userId: string
): Promise<{ data?: { cleaned: number }; error?: string }> => {
    try {
        const subscriptions = await getPushSubscriptions(businessId, userId);
        let cleanedCount = 0;

        // Check each subscription validity (if browser APIs are available)
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                for (const dbSubscription of subscriptions) {
                    try {
                        // Try to get the current browser subscription
                        const browserSubscription = await registration.pushManager.getSubscription();

                        // If no browser subscription or endpoints don't match, remove from database
                        if (!browserSubscription || browserSubscription.endpoint !== dbSubscription.endpoint) {
                            await deletePushSubscription(dbSubscription.id, businessId, userId);
                            cleanedCount++;
                        }
                    } catch (error) {
                        // If there's an error checking the subscription, consider it expired
                        await deletePushSubscription(dbSubscription.id, businessId, userId);
                        cleanedCount++;
                    }
                }
            }
        }

        return { data: { cleaned: cleanedCount } };

    } catch (error) {
        console.error("Error cleaning up expired subscriptions:", error);
        return { error: "Failed to cleanup expired subscriptions" };
    }
};

// Helper functions

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Queue test notification for sending when online
 */
async function queueTestNotification(
    businessId: string,
    userId: string,
    subscriptions: PushSubscription[]
): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);
    request.onsuccess = (event) => {
        const db = (event.target as any).result;
        const transaction = db.transaction(['push_queue'], 'readwrite');
        const store = transaction.objectStore('push_queue');

        const pushRecord = {
            id: crypto.randomUUID(),
            type: 'test_notification',
            businessId,
            userId,
            subscriptions: subscriptions.map(s => ({
                endpoint: s.endpoint,
                p256dh: s.p256dh,
                auth: s.auth
            })),
            title: 'Test Notification',
            message: 'This is a test push notification from JobSight Pro',
            timestamp: new Date().toISOString()
        };

        store.add(pushRecord);
    };
}

/**
 * Initialize offline push queue store
 */
export function initializeOfflinePushQueue(): void {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);

    request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('push_queue')) {
            const store = db.createObjectStore('push_queue', {
                keyPath: 'id'
            });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('businessId', 'businessId', { unique: false });
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
        }
    };
}

// Auto-initialize the offline store when this module loads
if (typeof window !== 'undefined') {
    initializeOfflinePushQueue();
}
