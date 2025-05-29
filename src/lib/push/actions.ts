'use server';

import webpush from 'web-push';

webpush.setVapidDetails(
    "mailto:brandon@jobsight.co",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
)

import type { PushSubscription, PushSubscription as WebPushSubscription } from 'web-push';

let subscription: WebPushSubscription | null = null;

export async function subscribeUser(sub: PushSubscription) {
    subscription = sub;
    console.log('User subscribed:', subscription);
    return { success: true };
}

export async function unsubscribeUser() {
    if (subscription) {
        console.log('User unsubscribed:', subscription);
        subscription = null;
        return { success: true };
    }
    return { success: false, message: 'No active subscription found' };
}

export async function sendPushNotification(title: string, body: string, data?: any) {
    if (!subscription) {
        throw new Error('No subscription found');
    }

    const payload = JSON.stringify({
        title,
        body,
        data
    });

    try {
        await webpush.sendNotification(subscription, payload);
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw new Error('Failed to send push notification');
    }
}