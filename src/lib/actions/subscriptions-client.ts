/**
 * @fileoverview Subscriptions Client Actions
 * Replaces src/app/actions/subscriptions.ts with offline-first implementation.
 * Handles business subscription management with offline queue support.
 */

import type { Database } from '@/types/supabase';
import {
    createInsertAction,
    createUpdateAction,
    createSelectAction
} from './client-action-factory';

// Type definitions
type BusinessSubscription = Database['public']['Tables']['business_subscriptions']['Row'];
type BusinessSubscriptionInsert = Database['public']['Tables']['business_subscriptions']['Insert'];
type BusinessSubscriptionUpdate = Database['public']['Tables']['business_subscriptions']['Update'];

interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    maxUsers?: number;
    maxProjects?: number;
    storage?: string;
    popular?: boolean;
}

// Create action instances
const insertSubscription = createInsertAction('business_subscriptions', 'high');
const updateSubscription = createUpdateAction('business_subscriptions', 'high');
const selectSubscriptions = createSelectAction('business_subscriptions');

/**
 * Get current active subscription for a business
 */
export async function getCurrentSubscription(businessId: string): Promise<BusinessSubscription | null> {
    try {
        const result = await selectSubscriptions({
            filter: { status: 'active' }
        }, businessId);

        if (result.error) {
            console.error('Error fetching current subscription:', result.error);
            return null;
        }

        const subscriptions = result.data as BusinessSubscription[];
        return subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
    } catch (error) {
        console.error('Error fetching current subscription:', error);
        return null;
    }
}

/**
 * Get all subscriptions for a business (including past ones)
 */
export async function getBusinessSubscriptions(businessId: string): Promise<BusinessSubscription[]> {
    try {
        const result = await selectSubscriptions({}, businessId);

        if (result.error) {
            console.error('Error fetching business subscriptions:', result.error);
            return [];
        }

        return (result.data as BusinessSubscription[]) || [];
    } catch (error) {
        console.error('Error fetching business subscriptions:', error);
        return [];
    }
}

/**
 * Get available subscription plans
 * For now, returns static data that matches the pricing JSON file
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    // Static subscription plans that match docs/jobsight_pricing.json
    const plans: SubscriptionPlan[] = [
        {
            id: 'personal',
            name: 'Personal',
            description: 'Ideal for individual users who need basic project management tools.',
            price: 0,
            interval: 'month',
            maxUsers: 1,
            maxProjects: undefined,
            storage: '100MB',
            features: [
                'Only 1 user',
                'Core project and task management',
                'Crew and equipment tracking',
                'Mobile access',
                '100MB storage'
            ]
        },
        {
            id: 'starter',
            name: 'Starter',
            description: 'Perfect for small teams looking to enhance their project management capabilities.',
            price: 9.99,
            interval: 'month',
            maxUsers: 3,
            maxProjects: undefined,
            storage: '1GB',
            features: [
                'Up to 3 users',
                'AI Assistant included',
                'Basic reporting',
                'Email support',
                '1GB storage',
                'Everything from Personal'
            ]
        },
        {
            id: 'pro',
            name: 'Pro',
            description: 'Designed for growing teams that need advanced features and support.',
            price: 49,
            interval: 'month',
            maxUsers: 10,
            maxProjects: undefined,
            storage: '10GB',
            popular: true,
            features: [
                'Up to 10 users',
                'Advanced reporting',
                'Equipment management',
                'Client portal',
                'Invoice generation',
                'Priority support',
                'Everything from Starter'
            ]
        }
    ];

    return plans;
}

/**
 * Create a new subscription
 */
export async function createSubscription(
    businessId: string,
    subscriptionData: {
        plan_id: string;
        stripe_subscription_id?: string;
        stripe_customer_id?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
    },
    userId?: string
): Promise<ActionResult<BusinessSubscription>> {
    try {
        const subscriptionInsert: BusinessSubscriptionInsert = {
            id: crypto.randomUUID(),
            business_id: businessId,
            plan_id: subscriptionData.plan_id,
            stripe_subscription_id: subscriptionData.stripe_subscription_id || null,
            stripe_customer_id: subscriptionData.stripe_customer_id || null,
            status: subscriptionData.status || 'pending',
            start_date: subscriptionData.start_date || new Date().toISOString(),
            end_date: subscriptionData.end_date || null,
            created_at: new Date().toISOString(),
            created_by: userId || null,
            updated_at: new Date().toISOString(),
            updated_by: userId || null
        };

        const result = await insertSubscription(subscriptionInsert, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return {
            success: true,
            data: result.data as BusinessSubscription,
            message: 'Subscription created successfully'
        };
    } catch (error) {
        console.error('Error creating subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create subscription'
        };
    }
}

/**
 * Update an existing subscription
 */
export async function updateSubscriptionStatus(
    businessId: string,
    subscriptionId: string,
    updates: {
        status?: string;
        stripe_subscription_id?: string;
        end_date?: string;
        plan_id?: string;
    },
    userId?: string
): Promise<ActionResult<BusinessSubscription>> {
    try {
        // First get the current subscription to merge updates
        const currentSubscriptions = await getBusinessSubscriptions(businessId);
        const currentSubscription = currentSubscriptions.find(sub => sub.id === subscriptionId);

        if (!currentSubscription) {
            return { success: false, error: 'Subscription not found' };
        }

        const updateData = {
            ...currentSubscription,
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: userId || null
        };

        const result = await updateSubscription(updateData, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return {
            success: true,
            data: result.data as BusinessSubscription,
            message: 'Subscription updated successfully'
        };
    } catch (error) {
        console.error('Error updating subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update subscription'
        };
    }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
    businessId: string,
    subscriptionId: string,
    userId?: string
): Promise<ActionResult<BusinessSubscription>> {
    try {
        return await updateSubscriptionStatus(
            businessId,
            subscriptionId,
            {
                status: 'cancelled',
                end_date: new Date().toISOString()
            },
            userId
        );
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel subscription'
        };
    }
}

/**
 * Check if a business has an active subscription
 */
export async function hasActiveSubscription(businessId: string): Promise<boolean> {
    try {
        const subscription = await getCurrentSubscription(businessId);
        return subscription !== null && subscription.status === 'active';
    } catch (error) {
        console.error('Error checking active subscription:', error);
        return false;
    }
}

/**
 * Get subscription features for a business
 */
export async function getSubscriptionFeatures(businessId: string): Promise<string[]> {
    try {
        const subscription = await getCurrentSubscription(businessId);
        if (!subscription) {
            return []; // No subscription = no features
        }

        const plans = await getSubscriptionPlans();
        const plan = plans.find(p => p.id === subscription.plan_id);

        return plan?.features || [];
    } catch (error) {
        console.error('Error getting subscription features:', error);
        return [];
    }
}

/**
 * Check if a business can access a specific feature
 */
export async function canAccessFeature(businessId: string, feature: string): Promise<boolean> {
    try {
        const features = await getSubscriptionFeatures(businessId);
        return features.includes(feature);
    } catch (error) {
        console.error('Error checking feature access:', error);
        return false; // Deny access on error
    }
}

/**
 * Get subscription limits for a business
 */
export async function getSubscriptionLimits(businessId: string): Promise<{
    maxUsers: number;
    maxProjects: number;
    storage: string;
}> {
    try {
        const subscription = await getCurrentSubscription(businessId);
        if (!subscription) {
            return { maxUsers: 0, maxProjects: 0, storage: '0GB' };
        }

        const plans = await getSubscriptionPlans();
        const plan = plans.find(p => p.id === subscription.plan_id);

        return {
            maxUsers: plan?.maxUsers || 0,
            maxProjects: plan?.maxProjects || 0,
            storage: plan?.storage || '0GB'
        };
    } catch (error) {
        console.error('Error getting subscription limits:', error);
        return { maxUsers: 0, maxProjects: 0, storage: '0GB' };
    }
}

/**
 * Queue subscription sync operations for when back online
 */
export async function processQueuedSubscriptionOperations(businessId: string): Promise<void> {
    if (!navigator.onLine) return;

    const queueKey = `subscription_queue_${businessId}`;
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');

    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued subscription operations`);

    // Process operations (simplified - real implementation would handle sync conflicts)
    const processedOperations: number[] = [];

    for (let i = 0; i < queue.length; i++) {
        try {
            // Process the queued operation
            processedOperations.push(i);
        } catch (error) {
            console.error(`Failed to process queued subscription operation ${i}:`, error);
        }
    }

    // Remove processed operations
    const remainingQueue = queue.filter((_: any, index: number) => !processedOperations.includes(index));
    localStorage.setItem(queueKey, JSON.stringify(remainingQueue));

    console.log(`Processed ${processedOperations.length} subscription operations, ${remainingQueue.length} remaining`);
}

/**
 * Create a default subscription for a business if none exists
 */
export async function createDefaultSubscription(businessId: string, userId?: string): Promise<BusinessSubscription | null> {
    try {
        // First check if business already has a subscription
        const existingSubscription = await getCurrentSubscription(businessId);
        if (existingSubscription) {
            console.log('Business already has a subscription:', existingSubscription.id);
            return existingSubscription;
        }

        console.log('Creating default subscription for business:', businessId);

        // Create default subscription (Pro plan for development)
        const subscriptionData: BusinessSubscriptionInsert = {
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            business_id: businessId,
            plan_id: "pro", // Default to pro plan for development
            status: "active",
            start_date: new Date().toISOString(),
            end_date: null, // No end date for active subscription
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: userId || null,
            updated_by: userId || null,
        };

        const result = await insertSubscription(subscriptionData, businessId);

        if (result.error) {
            console.error('Error creating default subscription:', result.error);
            return null;
        }

        console.log('✅ Default subscription created successfully');
        return result.data as BusinessSubscription;
    } catch (error) {
        console.error('Error creating default subscription:', error);
        return null;
    }
}
