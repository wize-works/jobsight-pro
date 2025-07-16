'use client';

import { useState, useEffect } from 'react';
import { PushSubscription as DBPushSubscription, PushSubscriptionInsert, PushSubscriptionUpdate } from '@/types/notifications';
import { pushSubscriptionsAPI } from '@/lib/api/push-subscriptions';

/**
 * Hook to get push subscriptions for a user
 */
export function usePushSubscriptions(userId: string) {
    const [subscriptions, setSubscriptions] = useState<DBPushSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await pushSubscriptionsAPI.getUserSubscriptions(userId);
            setSubscriptions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchSubscriptions();
        }
    }, [userId]);

    return { subscriptions, loading, error, refetch: fetchSubscriptions };
}

/**
 * Hook to get a specific push subscription
 */
export function usePushSubscription(id: string) {
    const [subscription, setSubscription] = useState<DBPushSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await pushSubscriptionsAPI.getSubscription(id);
            setSubscription(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchSubscription();
        }
    }, [id]);

    return { subscription, loading, error, refetch: fetchSubscription };
}

/**
 * Combined hook for push subscription mutations
 */
export function usePushSubscriptionMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const create = async (subscription: PushSubscriptionInsert): Promise<DBPushSubscription> => {
        try {
            setLoading(true);
            setError(null);
            return await pushSubscriptionsAPI.createSubscription(subscription);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id: string, updates: PushSubscriptionUpdate): Promise<DBPushSubscription> => {
        try {
            setLoading(true);
            setError(null);
            return await pushSubscriptionsAPI.updateSubscription(id, updates);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteSubscription = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            await pushSubscriptionsAPI.deleteSubscription(id);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete subscription';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteByEndpoint = async (userId: string, endpoint: string): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            await pushSubscriptionsAPI.deleteByEndpoint(userId, endpoint);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete subscription by endpoint';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateLastUsed = async (id: string): Promise<DBPushSubscription> => {
        try {
            setLoading(true);
            setError(null);
            return await pushSubscriptionsAPI.updateLastUsed(id);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update last used timestamp';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        create,
        update,
        delete: deleteSubscription,
        deleteByEndpoint,
        updateLastUsed,
        loading,
        error,
    };
}

/**
 * Hook for push subscription management with browser integration
 */
export function usePushSubscriptionManager(userId: string) {
    const [isSupported, setIsSupported] = useState(false);
    const [browserSubscription, setBrowserSubscription] = useState<PushSubscription | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);

    const { subscriptions, refetch } = usePushSubscriptions(userId);
    const mutations = usePushSubscriptionMutations();

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkExistingSubscription();
        }
    }, []);

    const checkExistingSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setBrowserSubscription(subscription);
        } catch (error) {
            console.error('Error checking existing subscription:', error);
        }
    };

    const subscribe = async () => {
        if (!isSupported) return;

        try {
            setIsRegistering(true);
            const registration = await navigator.serviceWorker.ready;
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidKey) {
                throw new Error('VAPID public key is not configured');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });

            setBrowserSubscription(subscription);

            // Store in database
            const subscriptionData: PushSubscriptionInsert = {
                user_id: userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.getKey('p256dh') ?
                    Buffer.from(subscription.getKey('p256dh') as ArrayBuffer).toString('base64') : '',
                auth: subscription.getKey('auth') ?
                    Buffer.from(subscription.getKey('auth') as ArrayBuffer).toString('base64') : '',
                user_agent: navigator.userAgent,
                last_used_at: new Date().toISOString(),
                created_by: userId,
                updated_by: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            await mutations.create(subscriptionData);
            await refetch();
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            throw error;
        } finally {
            setIsRegistering(false);
        }
    };

    const unsubscribe = async () => {
        if (!browserSubscription) return;

        try {
            await browserSubscription.unsubscribe();
            setBrowserSubscription(null);

            // Remove from database
            await mutations.deleteByEndpoint(userId, browserSubscription.endpoint);
            await refetch();
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
            throw error;
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
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
    };

    return {
        isSupported,
        isSubscribed: !!browserSubscription,
        isRegistering,
        subscriptions,
        subscribe,
        unsubscribe,
        updateLastUsed: mutations.updateLastUsed,
        refetch,
    };
}
