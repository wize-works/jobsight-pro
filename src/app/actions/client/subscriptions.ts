"use client";

/**
 * Subscriptions Client Actions - Offline-First Implementation (Phase 2)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { BusinessSubscription, BusinessSubscriptionInsert, BusinessSubscriptionUpdate, SubscriptionPlan, BillingInterval } from "@/types/subscription";
import { db } from "@/lib/offline/dexie-db";
import { v4 as uuidv4 } from "uuid";
import { isOnline, getCurrentUserId } from "./auth-utils";

// Validate that user has access to the specified business (using auth_id)
async function validateUserBusinessAccess(userAuthId: string, businessId: string): Promise<boolean> {
    try {
        // Check if user has a mapping to this business (using auth_id)
        const userBusinessId = await db.userBusinessMappings.get(userAuthId);
        if (userBusinessId?.businessId === businessId) {
            return true;
        }

        // If no mapping found locally, check with business table
        const business = await db.businesses.get(businessId);
        if (business && business.owner_id === userAuthId) {
            // Create the mapping for future use
            await db.userBusinessMappings.put({
                userId: userAuthId,
                businessId: businessId,
                role: 'owner',
                lastUpdated: Date.now()
            });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error validating business access:', error);
        return false;
    }
}

// Helper function to add sync operation to queue
async function addToSyncQueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    businessId: string,
    userId?: string
): Promise<void> {
    const syncItem = {
        id: uuidv4(),
        table,
        operation,
        data,
        businessId,
        userId,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
    };

    await db.syncQueue.add(syncItem);
}

/**
 * Get current active subscription for a business - Offline-first implementation
 * @param businessId - The business ID to get subscription for
 */
export async function getCurrentSubscription(businessId: string): Promise<BusinessSubscription | null> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return null;
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return null;
        }

        // Try to get from local cache first
        const cachedSubscription = await db.businessSubscriptions
            .where('business_id')
            .equals(businessId)
            .and(sub => sub.status === 'active' || sub.status === 'trialing')
            .first();

        if (cachedSubscription && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`subscriptions_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedSubscription;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/subscriptions/business/${businessId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverSubscription = await response.json();

                    if (serverSubscription) {
                        // Update local cache
                        await db.businessSubscriptions.put(serverSubscription);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `subscriptions_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'businessSubscriptions'
                        });

                        return serverSubscription;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch subscription from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedSubscription || null;

    } catch (error) {
        console.error('Error getting current subscription:', error);
        return null;
    }
}

/**
 * Get subscription plans - Client-side cached implementation
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
        // Check if we have cached plans
        const cachedPlans = typeof window !== 'undefined'
            ? window.localStorage.getItem('subscription_plans')
            : null;

        if (cachedPlans) {
            try {
                const plans = JSON.parse(cachedPlans);
                // If cached and fresh (within 1 hour), return cached
                const oneHourAgo = Date.now() - (60 * 60 * 1000);
                const cacheTime = window.localStorage.getItem('subscription_plans_cache_time');
                if (cacheTime && parseInt(cacheTime) > oneHourAgo) {
                    return plans;
                }
            } catch (e) {
                console.warn('Failed to parse cached plans:', e);
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch('/api/subscriptions/plans', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const plans = await response.json();

                    // Cache the plans
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem('subscription_plans', JSON.stringify(plans));
                        window.localStorage.setItem('subscription_plans_cache_time', Date.now().toString());
                    }

                    return plans;
                }
            } catch (error) {
                console.warn('Failed to fetch plans from server:', error);
            }
        }

        // Return cached plans if available, otherwise empty array
        if (cachedPlans) {
            try {
                return JSON.parse(cachedPlans);
            } catch (e) {
                console.warn('Failed to parse cached plans:', e);
            }
        }

        return [];

    } catch (error) {
        console.error('Error getting subscription plans:', error);
        return [];
    }
}

/**
 * Create subscription - Offline-first implementation with authorization
 * @param businessId - The business ID to create subscription for
 * @param planId - The subscription plan ID
 * @param billingInterval - The billing interval ('monthly' or 'annual')
 */
export async function createSubscription(
    businessId: string,
    planId: string,
    billingInterval: BillingInterval
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required. Please sign in to continue."
            };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "Access denied. You don't have permission to modify this business."
            };
        }

        const now = new Date().toISOString();
        const subscriptionId = uuidv4();

        // Check if there's already an active subscription
        const existingSubscription = await db.businessSubscriptions
            .where('business_id')
            .equals(businessId)
            .and(sub => sub.status === 'active' || sub.status === 'trialing')
            .first();

        let subscriptionData: BusinessSubscription;

        if (existingSubscription) {
            // Update existing subscription
            subscriptionData = {
                ...existingSubscription,
                plan_id: planId,
                updated_at: now,
                updated_by: currentUserAuthId,
            };
        } else {
            // Create new subscription
            subscriptionData = {
                id: subscriptionId,
                business_id: businessId,
                plan_id: planId,
                start_date: now,
                end_date: null,
                status: 'active',
                stripe_customer_id: null,
                stripe_subscription_id: null,
                stripe_invoice_id: null,
                created_at: now,
                created_by: currentUserAuthId,
                updated_at: now,
                updated_by: currentUserAuthId,
            };
        }

        // Store locally immediately (optimistic update)
        await db.businessSubscriptions.put(subscriptionData);

        // Queue for sync with server
        await addToSyncQueue(
            'business_subscriptions',
            existingSubscription ? 'update' : 'insert',
            subscriptionData,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const endpoint = existingSubscription
                    ? `/api/subscriptions/${existingSubscription.id}`
                    : '/api/subscriptions';

                const method = existingSubscription ? 'PUT' : 'POST';

                const response = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId,
                        planId,
                        billingInterval,
                        ...(existingSubscription && { subscriptionId: existingSubscription.id })
                    }),
                });

                if (response.ok) {
                    const serverSubscription = await response.json();

                    // Update local data with server response
                    await db.businessSubscriptions.put(serverSubscription);

                    // Mark as synced
                    await db.syncQueue
                        .where('[table+businessId+operation]')
                        .equals(['business_subscriptions', businessId, existingSubscription ? 'update' : 'insert'])
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `subscriptions_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'businessSubscriptions'
                    });
                }
            } catch (error) {
                console.warn('Failed to sync subscription to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error creating subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create subscription"
        };
    }
}

/**
 * Cancel subscription - Offline-first implementation with authorization
 * @param businessId - The business ID to cancel subscription for
 */
export async function cancelSubscription(businessId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required. Please sign in to continue."
            };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "Access denied. You don't have permission to modify this business."
            };
        }

        // Get current subscription
        const currentSubscription = await getCurrentSubscription(businessId);
        if (!currentSubscription) {
            return {
                success: false,
                error: "No active subscription found to cancel."
            };
        }

        const now = new Date().toISOString();

        // Update subscription locally (optimistic update)
        const canceledSubscription: BusinessSubscription = {
            ...currentSubscription,
            status: 'canceled',
            end_date: now,
            updated_at: now,
            updated_by: currentUserAuthId,
        };

        await db.businessSubscriptions.put(canceledSubscription);

        // Queue for sync with server
        await addToSyncQueue(
            'business_subscriptions',
            'update',
            canceledSubscription,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/subscriptions/${currentSubscription.id}/cancel`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ businessId }),
                });

                if (response.ok) {
                    const serverSubscription = await response.json();

                    // Update local data with server response
                    await db.businessSubscriptions.put(serverSubscription);

                    // Mark as synced
                    await db.syncQueue
                        .where('[table+businessId+operation]')
                        .equals(['business_subscriptions', businessId, 'update'])
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `subscriptions_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'businessSubscriptions'
                    });
                }
            } catch (error) {
                console.warn('Failed to sync subscription cancellation to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error canceling subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to cancel subscription"
        };
    }
}

/**
 * Update subscription - Offline-first implementation with authorization
 * @param businessId - The business ID
 * @param subscriptionId - The subscription ID to update
 * @param subscriptionData - The subscription data to update
 */
export async function updateSubscription(
    businessId: string,
    subscriptionId: string,
    subscriptionData: BusinessSubscriptionUpdate
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required. Please sign in to continue."
            };
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "Access denied. You don't have permission to modify this business."
            };
        }

        // Get current subscription
        const currentSubscription = await db.businessSubscriptions.get(subscriptionId);
        if (!currentSubscription) {
            return {
                success: false,
                error: "Subscription not found."
            };
        }

        // Verify the subscription belongs to the business
        if (currentSubscription.business_id !== businessId) {
            return {
                success: false,
                error: "Access denied. Subscription does not belong to this business."
            };
        }

        const now = new Date().toISOString();

        // Prepare update data - be explicit about types
        const updateData: Partial<BusinessSubscription> = {
            updated_at: now,
        };

        // Only include defined values from subscriptionData that match BusinessSubscription schema
        if (subscriptionData.business_id !== undefined) updateData.business_id = subscriptionData.business_id;
        if (subscriptionData.plan_id !== undefined) updateData.plan_id = subscriptionData.plan_id;
        if (subscriptionData.start_date !== undefined) updateData.start_date = subscriptionData.start_date;
        if (subscriptionData.end_date !== undefined) updateData.end_date = subscriptionData.end_date;
        if (subscriptionData.status !== undefined) updateData.status = subscriptionData.status;
        if (subscriptionData.stripe_customer_id !== undefined) updateData.stripe_customer_id = subscriptionData.stripe_customer_id;
        if (subscriptionData.stripe_subscription_id !== undefined) updateData.stripe_subscription_id = subscriptionData.stripe_subscription_id;
        if (subscriptionData.created_at !== undefined) updateData.created_at = subscriptionData.created_at;

        // Update locally first (optimistic update)
        const updatedSubscription = { ...currentSubscription, ...updateData };
        await db.businessSubscriptions.put(updatedSubscription);

        // Queue for sync with server
        await addToSyncQueue(
            'business_subscriptions',
            'update',
            updatedSubscription,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately
        if (isOnline()) {
            try {
                const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...updateData, businessId }),
                });

                if (response.ok) {
                    const serverSubscription = await response.json();

                    // Update local data with server response
                    await db.businessSubscriptions.put(serverSubscription);

                    // Mark as synced
                    await db.syncQueue
                        .where('[table+businessId+operation]')
                        .equals(['business_subscriptions', businessId, 'update'])
                        .modify({ synced: true });

                    // Update sync metadata
                    await db.syncMetadata.put({
                        id: `subscriptions_${businessId}`,
                        lastSync: Date.now(),
                        businessId,
                        table: 'businessSubscriptions'
                    });
                }
            } catch (error) {
                console.warn('Failed to sync subscription update to server immediately, will retry later:', error);
            }
        }

        return { success: true };

    } catch (error) {
        console.error('Error updating subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update subscription"
        };
    }
}

/**
 * Get all subscriptions for a business - Offline-first implementation with authorization
 * @param businessId - The business ID to get subscriptions for
 */
export async function getBusinessSubscriptions(businessId: string): Promise<BusinessSubscription[]> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.warn('No authenticated user found');
            return [];
        }

        // Validate user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.warn('User does not have access to this business');
            return [];
        }

        // Try to get from local cache first
        const cachedSubscriptions = await db.businessSubscriptions
            .where('business_id')
            .equals(businessId)
            .toArray();

        if (cachedSubscriptions.length > 0 && isOnline()) {
            // If we have cached data and are online, check if it's fresh (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const metadata = await db.syncMetadata.get(`subscriptions_${businessId}`);

            if (metadata && metadata.lastSync > fiveMinutesAgo) {
                return cachedSubscriptions;
            }
        }

        // If online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/subscriptions/business/${businessId}/all`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const serverSubscriptions = await response.json();

                    if (serverSubscriptions && Array.isArray(serverSubscriptions)) {
                        // Update local cache
                        await db.businessSubscriptions.bulkPut(serverSubscriptions);

                        // Update sync metadata
                        await db.syncMetadata.put({
                            id: `subscriptions_${businessId}`,
                            lastSync: Date.now(),
                            businessId,
                            table: 'businessSubscriptions'
                        });

                        return serverSubscriptions;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch subscriptions from server, using cache:', error);
            }
        }

        // Return cached data if available
        return cachedSubscriptions;

    } catch (error) {
        console.error('Error getting business subscriptions:', error);
        return [];
    }
}
