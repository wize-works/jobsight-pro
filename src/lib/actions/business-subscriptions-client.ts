/**
 * Client-Side Business Subscriptions Actions
 * 
 * Replaces src/app/actions/business-subscriptions.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from '@/types/supabase';
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from './client-action-factory';
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for business subscriptions
type BusinessSubscription = Database['public']['Tables']['business_subscriptions']['Row'];
type BusinessSubscriptionInsert = Database['public']['Tables']['business_subscriptions']['Insert'];
type BusinessSubscriptionUpdate = Database['public']['Tables']['business_subscriptions']['Update'];

// Create client-side business subscription actions
const insertBusinessSubscription = createInsertAction('business_subscriptions', 'critical');
const updateBusinessSubscription = createUpdateAction('business_subscriptions', 'critical');
const deleteBusinessSubscription = createDeleteAction('business_subscriptions', 'critical');
const selectBusinessSubscriptions = createSelectAction('business_subscriptions');

/**
 * Get all business subscriptions for a business - works offline
 */
export const getBusinessSubscriptions = async (businessId: string): Promise<BusinessSubscription[]> => {
    try {
        const result = await selectBusinessSubscriptions({}, businessId);

        if (result.error) {
            console.error("Error fetching business subscriptions:", result.error);
            return [];
        }

        return (result.data || []) as BusinessSubscription[];
    } catch (err) {
        console.error("Error in getBusinessSubscriptions:", err);
        return [];
    }
};

/**
 * Get active subscription for a business - works offline
 */
export const getActiveSubscription = async (businessId: string): Promise<BusinessSubscription | null> => {
    try {
        const subscriptions = await getBusinessSubscriptions(businessId);
        const now = new Date();

        // Find active subscription (current date between start and end dates)
        const activeSubscription = subscriptions.find(sub => {
            if (sub.status !== 'active') return false;
            if (!sub.start_date) return false;

            const startDate = new Date(sub.start_date);
            const endDate = sub.end_date ? new Date(sub.end_date) : null;

            return startDate <= now && (!endDate || endDate >= now);
        });

        return activeSubscription || null;
    } catch (err) {
        console.error("Error in getActiveSubscription:", err);
        return null;
    }
};

/**
 * Create a new business subscription - works offline
 */
export const createBusinessSubscription = async (data: BusinessSubscriptionInsert): Promise<BusinessSubscription | null> => {
    try {
        if (!data.business_id) {
            throw new Error('Business ID is required for business subscription');
        }

        const subscriptionData = {
            ...data,
            id: data.id || uuidv4(),
            created_at: data.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertBusinessSubscription(subscriptionData, data.business_id);

        if (result.error) {
            console.error("Error creating business subscription:", result.error);
            return null;
        }

        return result.data as BusinessSubscription;
    } catch (err) {
        console.error("Error in createBusinessSubscription:", err);
        return null;
    }
};

/**
 * Update a business subscription - works offline
 */
export const updateBusinessSubscriptionById = async (id: string, data: Partial<BusinessSubscriptionUpdate>, businessId: string): Promise<BusinessSubscription | null> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateBusinessSubscription(updateData, businessId);

        if (result.error) {
            console.error("Error updating business subscription:", result.error);
            return null;
        }

        return result.data as BusinessSubscription;
    } catch (err) {
        console.error("Error in updateBusinessSubscriptionById:", err);
        return null;
    }
};

/**
 * Delete a business subscription - works offline
 */
export const removeBusinessSubscription = async (id: string, businessId: string): Promise<boolean> => {
    try {
        const result = await deleteBusinessSubscription({ id }, businessId);

        if (result.error) {
            console.error("Error deleting business subscription:", result.error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in removeBusinessSubscription:", err);
        return false;
    }
};

/**
 * Get a business subscription by ID - works offline
 */
export const getBusinessSubscriptionById = async (id: string, businessId: string): Promise<BusinessSubscription | null> => {
    try {
        const subscriptions = await getBusinessSubscriptions(businessId);
        return subscriptions.find(sub => sub.id === id) || null;
    } catch (err) {
        console.error("Error in getBusinessSubscriptionById:", err);
        return null;
    }
};

/**
 * Get subscription by Stripe subscription ID - works offline
 */
export const getSubscriptionByStripeId = async (businessId: string, stripeSubscriptionId: string): Promise<BusinessSubscription | null> => {
    try {
        const subscriptions = await getBusinessSubscriptions(businessId);
        return subscriptions.find(sub => sub.stripe_subscription_id === stripeSubscriptionId) || null;
    } catch (err) {
        console.error("Error in getSubscriptionByStripeId:", err);
        return null;
    }
};

/**
 * Update subscription status - works offline
 */
export const updateSubscriptionStatus = async (businessId: string, subscriptionId: string, status: string, userId?: string): Promise<BusinessSubscription | null> => {
    return await updateBusinessSubscriptionById(subscriptionId, {
        status,
        updated_by: userId || null,
    }, businessId);
};

/**
 * Cancel subscription - works offline
 */
export const cancelSubscription = async (businessId: string, subscriptionId: string, userId?: string): Promise<BusinessSubscription | null> => {
    const now = new Date().toISOString();
    return await updateBusinessSubscriptionById(subscriptionId, {
        status: 'cancelled',
        end_date: now,
        updated_by: userId || null,
    }, businessId);
};

/**
 * Renew subscription - works offline
 */
export const renewSubscription = async (businessId: string, subscriptionId: string, newEndDate: string, userId?: string): Promise<BusinessSubscription | null> => {
    return await updateBusinessSubscriptionById(subscriptionId, {
        status: 'active',
        end_date: newEndDate,
        updated_by: userId || null,
    }, businessId);
};

// Check if business has active subscription
export const hasActiveSubscription = async (businessId: string): Promise<boolean> => {
    const activeSubscription = await getActiveSubscription(businessId);
    return activeSubscription !== null;
};

// Get subscription status summary
export const getSubscriptionStatus = async (businessId: string): Promise<{
    hasActiveSubscription: boolean;
    currentPlan: string | null;
    expiresAt: string | null;
    status: string | null;
    daysRemaining: number | null;
}> => {
    try {
        const activeSubscription = await getActiveSubscription(businessId);

        if (!activeSubscription) {
            return {
                hasActiveSubscription: false,
                currentPlan: null,
                expiresAt: null,
                status: null,
                daysRemaining: null,
            };
        }

        const daysRemaining = activeSubscription.end_date
            ? Math.ceil((new Date(activeSubscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

        return {
            hasActiveSubscription: true,
            currentPlan: activeSubscription.plan_id,
            expiresAt: activeSubscription.end_date,
            status: activeSubscription.status,
            daysRemaining,
        };
    } catch (error) {
        console.error('Failed to get subscription status:', error);
        return {
            hasActiveSubscription: false,
            currentPlan: null,
            expiresAt: null,
            status: null,
            daysRemaining: null,
        };
    }
};

// Get subscription history
export const getSubscriptionHistory = async (businessId: string): Promise<BusinessSubscription[]> => {
    try {
        const subscriptions = await getBusinessSubscriptions(businessId);
        return subscriptions.sort((a, b) => {
            const aDate = new Date(a.created_at || 0).getTime();
            const bDate = new Date(b.created_at || 0).getTime();
            return bDate - aDate; // Most recent first
        });
    } catch (err) {
        console.error("Error in getSubscriptionHistory:", err);
        return [];
    }
};

// Get expiring subscriptions (within 30 days)
export const getExpiringSubscriptions = async (businessId: string): Promise<BusinessSubscription[]> => {
    try {
        const subscriptions = await getBusinessSubscriptions(businessId);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        return subscriptions.filter(sub => {
            if (sub.status !== 'active' || !sub.end_date) return false;
            const endDate = new Date(sub.end_date);
            return endDate <= thirtyDaysFromNow && endDate >= new Date();
        });
    } catch (err) {
        console.error("Error in getExpiringSubscriptions:", err);
        return [];
    }
};

// Bulk operations for business subscriptions
export const createMultipleSubscriptions = async (subscriptions: BusinessSubscriptionInsert[]): Promise<BusinessSubscription[]> => {
    const results: BusinessSubscription[] = [];
    for (const subscription of subscriptions) {
        try {
            const result = await createBusinessSubscription(subscription);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            console.error('Error creating business subscription:', error);
        }
    }
    return results;
};

// Analytics functions
export const getSubscriptionStats = async (businessId: string): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    expiredSubscriptions: number;
    subscriptionsByPlan: Record<string, number>;
    averageSubscriptionLength: number;
}> => {
    try {
        const subscriptions = await getBusinessSubscriptions(businessId);
        const now = new Date();

        const stats = {
            totalSubscriptions: subscriptions.length,
            activeSubscriptions: 0,
            cancelledSubscriptions: 0,
            expiredSubscriptions: 0,
            subscriptionsByPlan: {} as Record<string, number>,
            averageSubscriptionLength: 0,
        };

        let totalDuration = 0;
        let durationsCount = 0;

        subscriptions.forEach(sub => {
            // Count by status
            if (sub.status === 'active') stats.activeSubscriptions++;
            else if (sub.status === 'cancelled') stats.cancelledSubscriptions++;
            else if (sub.end_date && new Date(sub.end_date) < now) stats.expiredSubscriptions++;

            // Count by plan
            const plan = sub.plan_id || 'Unknown';
            stats.subscriptionsByPlan[plan] = (stats.subscriptionsByPlan[plan] || 0) + 1;

            // Calculate duration for average
            if (sub.start_date && sub.end_date) {
                const duration = new Date(sub.end_date).getTime() - new Date(sub.start_date).getTime();
                totalDuration += duration;
                durationsCount++;
            }
        });

        if (durationsCount > 0) {
            stats.averageSubscriptionLength = Math.round(totalDuration / durationsCount / (1000 * 60 * 60 * 24)); // Days
        }

        return stats;
    } catch (error) {
        console.error('Failed to get subscription stats:', error);
        return {
            totalSubscriptions: 0,
            activeSubscriptions: 0,
            cancelledSubscriptions: 0,
            expiredSubscriptions: 0,
            subscriptionsByPlan: {},
            averageSubscriptionLength: 0,
        };
    }
};

// Export compatibility functions for existing code
export {
    getBusinessSubscriptions as getAllBusinessSubscriptions,
    createBusinessSubscription as addBusinessSubscription,
    removeBusinessSubscription as deleteBusinessSubscription,
    getBusinessSubscriptionById as fetchBusinessSubscription,
};
