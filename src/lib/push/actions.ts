'use server';

import webpush from 'web-push';
import { withBusinessServer } from '@/lib/auth/with-business-server';
import { insertWithBusiness, fetchByBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from '@/lib/db';
import type { PushSubscriptionInsert, PushSubscriptionUpdate } from '@/types/notifications';

function ensureVapidDetails() {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.warn('VAPID keys not configured for push notifications');
        return false;
    }
    
    webpush.setVapidDetails(
        "mailto:brandon@jobsight.co",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    return true;
}

export async function subscribeUser(subscription: PushSubscription) {
    try {
        const { business, userId } = await withBusinessServer();

        // Store subscription in database
        const subscriptionData: PushSubscriptionInsert = {
            user_id: userId,
            business_id: business.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.getKey("p256dh") ? Buffer.from(subscription.getKey("p256dh") as ArrayBuffer).toString('base64') : '',
            auth: subscription.getKey("auth") ? Buffer.from(subscription.getKey("auth") as ArrayBuffer).toString('base64') : '',
            created_by: userId,
            updated_by: userId,
            user_agent: null,
            last_used_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await insertWithBusiness("push_subscriptions", subscriptionData, business.id);

        if (error) {
            console.error('Error storing push subscription:', error);
            return { success: false, error: 'Failed to store subscription' };
        }

        console.log('User subscribed and stored in database:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Error in subscribeUser:', error);
        return { success: false, error: 'Failed to subscribe user' };
    }
}

export async function unsubscribeUser() {
    try {
        const { business, userId } = await withBusinessServer();

        // Find and deactivate user's subscriptions
        const { data: subscriptions, error: fetchError } = await fetchByBusiness(
            "push_subscriptions",
            business.id,
            "*",
            { filter: { user_id: userId, is_active: true } }
        );

        if (fetchError) {
            console.error('Error fetching subscriptions:', fetchError);
            return { success: false, error: 'Failed to fetch subscriptions' };
        }

        if (subscriptions && subscriptions.length > 0) {
            // Deactivate all subscriptions for the user
            const updatePromises = subscriptions.map(sub =>
                updateWithBusinessCheck("push_subscriptions", sub.id, {
                    is_active: false,
                    updated_by: userId,
                    updated_at: new Date().toISOString()
                } as unknown as PushSubscriptionUpdate, business.id)
            );

            await Promise.all(updatePromises);
        }

        console.log('User unsubscribed from push notifications');
        return { success: true };
    } catch (error) {
        console.error('Error in unsubscribeUser:', error);
        return { success: false, error: 'Failed to unsubscribe user' };
    }
}

export async function sendPushNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: any,
    url?: string
) {
    try {
        if (!ensureVapidDetails()) {
            return { success: false, message: 'Push notifications not configured' };
        }

        const { business } = await withBusinessServer();

        // Get active subscriptions for the user
        const { data: subscriptions, error } = await fetchByBusiness(
            "push_subscriptions",
            business.id,
            "*",
            { filter: { user_id: userId, is_active: true } }
        );

        if (error) {
            console.error('Error fetching user subscriptions:', error);
            throw new Error('Failed to fetch user subscriptions');
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log('No active subscriptions found for user:', userId);
            return { success: false, message: 'No active subscriptions found' };
        }

        const payload = JSON.stringify({
            title,
            body,
            data: {
                ...data,
                url: url || '/dashboard'
            }
        });

        // Send notification to all user's devices
        const sendPromises = subscriptions.map(async (sub: any) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            try {
                await webpush.sendNotification(pushSubscription, payload);
                console.log('Push notification sent successfully to:', sub.endpoint);
            } catch (error) {
                console.error('Failed to send push notification:', error);
                // Deactivate invalid subscriptions
                if (typeof error === 'object' && error !== null && 'statusCode' in error && (error as any).statusCode === 410) {
                    await updateWithBusinessCheck("push_subscriptions", sub.id, {
                        updated_by: userId,
                        updated_at: new Date().toISOString(),
                    } as PushSubscriptionUpdate, business.id);
                }
            }
        });

        await Promise.all(sendPromises);
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification to user:', error);
        throw new Error('Failed to send push notification');
    }
}

export async function sendPushNotificationToBusiness(
    title: string,
    body: string,
    data?: any,
    url?: string,
    excludeUserId?: string
) {
    try {
        if (!ensureVapidDetails()) {
            return { success: false, message: 'Push notifications not configured' };
        }

        const { business } = await withBusinessServer();

        // Get all active subscriptions for the business
        const { data: subscriptions, error } = await fetchByBusiness(
            "push_subscriptions",
            business.id,
            "*",
            { filter: { is_active: true } }
        );

        if (error) {
            console.error('Error fetching business subscriptions:', error);
            throw new Error('Failed to fetch business subscriptions');
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log('No active subscriptions found for business');
            return { success: false, message: 'No active subscriptions found' };
        }

        // Filter out excluded user if specified
        const filteredSubscriptions = excludeUserId
            ? subscriptions.filter((sub: any) => sub.user_id !== excludeUserId)
            : subscriptions;

        const payload = JSON.stringify({
            title,
            body,
            data: {
                ...data,
                url: url || '/dashboard'
            }
        });

        // Send notification to all devices
        const sendPromises = filteredSubscriptions.map(async (sub: any) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            try {
                await webpush.sendNotification(pushSubscription, payload);
                console.log('Push notification sent successfully');
            } catch (error) {
                console.error('Failed to send push notification:', error);
                // Deactivate invalid subscriptions
                if (typeof error === 'object' && error !== null && 'statusCode' in error && (error as any).statusCode === 410) {
                    await updateWithBusinessCheck("push_subscriptions", sub.id, {
                        updated_by: sub.user_id,
                        updated_at: new Date().toISOString(),
                    } as PushSubscriptionUpdate, business.id);
                }
            }
        });

        await Promise.all(sendPromises);
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification to business:', error);
        throw new Error('Failed to send push notification');
    }
}

// Legacy function for backward compatibility
export async function sendPushNotification(title: string, body: string, data?: any) {
    return sendPushNotificationToBusiness(title, body, data);
}