import { PushSubscription, PushSubscriptionInsert, PushSubscriptionUpdate } from "@/types/notifications";

/**
 * Push Subscriptions API Client
 * Type-safe API client for push subscription operations
 */
export class PushSubscriptionsAPI {
    private static baseUrl = '/api/push-subscriptions';

    /**
     * Get all push subscriptions for a user
     */
    static async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
        const response = await fetch(`${this.baseUrl}?userId=${encodeURIComponent(userId)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch push subscriptions: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get a specific push subscription by ID
     */
    static async getPushSubscription(id: string): Promise<PushSubscription> {
        const response = await fetch(`${this.baseUrl}/${id}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch push subscription: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Create a new push subscription
     */
    static async createPushSubscription(subscription: PushSubscriptionInsert): Promise<PushSubscription> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
        });

        if (!response.ok) {
            throw new Error(`Failed to create push subscription: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Update a push subscription
     */
    static async updatePushSubscription(id: string, updates: PushSubscriptionUpdate): Promise<PushSubscription> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error(`Failed to update push subscription: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Delete a push subscription
     */
    static async deletePushSubscription(id: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete push subscription: ${response.statusText}`);
        }
    }

    /**
     * Delete a push subscription by endpoint
     */
    static async deletePushSubscriptionByEndpoint(userId: string, endpoint: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/endpoint?userId=${encodeURIComponent(userId)}&endpoint=${encodeURIComponent(endpoint)}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete push subscription by endpoint: ${response.statusText}`);
        }
    }

    /**
     * Update last used timestamp for a push subscription
     */
    static async updateLastUsed(id: string): Promise<PushSubscription> {
        const response = await fetch(`${this.baseUrl}/${id}/last-used`, {
            method: 'PUT',
        });

        if (!response.ok) {
            throw new Error(`Failed to update last used timestamp: ${response.statusText}`);
        }

        return response.json();
    }
}

/**
 * Helper functions for common push subscription operations
 */
export const pushSubscriptionsAPI = {
    // Get all push subscriptions for a user
    getUserSubscriptions: (userId: string) => PushSubscriptionsAPI.getPushSubscriptions(userId),

    // Get a specific push subscription
    getSubscription: (id: string) => PushSubscriptionsAPI.getPushSubscription(id),

    // Create a new push subscription
    createSubscription: (subscription: PushSubscriptionInsert) => PushSubscriptionsAPI.createPushSubscription(subscription),

    // Update a push subscription
    updateSubscription: (id: string, updates: PushSubscriptionUpdate) => PushSubscriptionsAPI.updatePushSubscription(id, updates),

    // Delete a push subscription
    deleteSubscription: (id: string) => PushSubscriptionsAPI.deletePushSubscription(id),

    // Delete by endpoint
    deleteByEndpoint: (userId: string, endpoint: string) => PushSubscriptionsAPI.deletePushSubscriptionByEndpoint(userId, endpoint),

    // Update last used timestamp
    updateLastUsed: (id: string) => PushSubscriptionsAPI.updateLastUsed(id),
};
