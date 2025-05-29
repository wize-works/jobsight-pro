'use client';

import { use, useEffect, useState } from "react";
import { sendPushNotification, subscribeUser, unsubscribeUser } from "@/lib/push/actions";
import { sendNotification } from "web-push";
import { set } from "zod";

export default function PushManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            console.log('Service Worker registered:', registration);
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            setIsSupported(false);
        }
    };

    async function subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                throw new Error('VAPID public key is not configured');
            }

            // Convert VAPID key from base64 to Uint8Array
            const applicationServerKey = urlBase64ToUint8Array(vapidKey);

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });
            setSubscription(sub);

            console.log('User subscribed to push notifications:', sub);
            const serializedSub = JSON.parse(JSON.stringify(sub));
            await subscribeUser(serializedSub);
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        }
    }

    async function unsubscribeFromPush() {
        if (!subscription) {
            console.warn('No active subscription to unsubscribe from.');
            return;
        }
        try {
            await subscription.unsubscribe();
            setSubscription(null);
            await unsubscribeUser();
            console.log('User unsubscribed from push notifications');
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
        }
    }

    async function sendTestNotification() {
        if (subscription) {
            await sendPushNotification('Test Notification', message, {});
            setMessage('');
            console.log('Test notification sent:', message);
        }
    }

    // Helper function to convert VAPID key
    function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    if (!isSupported) {
        return <p>Push notifications are not supported in this browser.</p>
    }

    return (
        <div>
            <h3>Push Notifications</h3>
            {subscription ? (
                <>
                    <p>You are subscribed to push notifications.</p>
                    <button onClick={unsubscribeFromPush}>Unsubscribe</button>
                    <input
                        type="text"
                        placeholder="Enter notification message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button onClick={sendTestNotification}>Send Test</button>
                </>
            ) : (
                <>
                    <p>You are not subscribed to push notifications.</p>
                    <button onClick={subscribeToPush}>Subscribe</button>
                </>
            )}
        </div>
    )
}
