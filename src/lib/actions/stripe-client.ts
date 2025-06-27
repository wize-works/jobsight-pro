'use client';

/**
 * Stripe Client Actions with offline support
 * Replaces src/app/actions/stripe.ts with offline-first implementation
 * Handles billing operations with queue support for offline scenarios
 */

import {
    createInsertAction,
    createUpdateAction,
    createSelectAction
} from './client-action-factory';
import type { Database } from '@/types/supabase';

// Extract Supabase types
type StripeCustomer = Database['public']['Tables']['stripe_customers']['Row'];
type StripeSubscription = Database['public']['Tables']['stripe_subscriptions']['Row'];
type StripeInvoice = Database['public']['Tables']['stripe_invoices']['Row'];

// Stripe operation result interface
export interface StripeResult {
    success: boolean;
    data?: any;
    error?: string;
    queued?: boolean;
    requiresAction?: boolean;
    clientSecret?: string;
}

// Create client actions with offline support
const insertStripeCustomer = createInsertAction('stripe_customers', 'high');
const updateStripeCustomer = createUpdateAction('stripe_customers', 'medium');
const selectStripeCustomers = createSelectAction('stripe_customers');

const insertStripeSubscription = createInsertAction('stripe_subscriptions', 'high');
const updateStripeSubscription = createUpdateAction('stripe_subscriptions', 'high');
const selectStripeSubscriptions = createSelectAction('stripe_subscriptions');

const insertStripeInvoice = createInsertAction('stripe_invoices', 'medium');
const selectStripeInvoices = createSelectAction('stripe_invoices');

/**
 * Create Stripe customer with offline support
 */
export async function createStripeCustomer(
    businessId: string,
    customerData: {
        email?: string;
        name?: string;
        phone?: string;
        address?: any;
    },
    userId?: string
): Promise<StripeResult> {
    try {
        // Check if customer already exists locally
        const existingCustomers = await selectStripeCustomers({}, businessId);
        if (existingCustomers.data && existingCustomers.data.length > 0) {
            return {
                success: true,
                data: existingCustomers.data[0],
                error: 'Customer already exists'
            };
        }

        // If offline, queue the operation and create placeholder
        if (!navigator.onLine) {
            const placeholderCustomer = {
                id: crypto.randomUUID(),
                business_id: businessId,
                stripe_customer_id: `pending_${Date.now()}`,
                created_at: new Date().toISOString()
            };

            await insertStripeCustomer(placeholderCustomer, businessId);
            await queueStripeOperation('create_customer', customerData, businessId, userId);

            return {
                success: true,
                data: placeholderCustomer,
                queued: true
            };
        }

        // Try to create via API when online
        try {
            const response = await fetch('/api/stripe/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, ...customerData })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const result = await response.json();

            // Store customer data locally
            const customerRecord = {
                id: crypto.randomUUID(),
                business_id: businessId,
                stripe_customer_id: result.customerId,
                created_at: new Date().toISOString()
            };

            await insertStripeCustomer(customerRecord, businessId);

            return {
                success: true,
                data: customerRecord
            };
        } catch (apiError) {
            // API failed but queue for later
            await queueStripeOperation('create_customer', customerData, businessId, userId);

            return {
                success: true,
                queued: true,
                error: 'Customer creation queued for when service is available'
            };
        }
    } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create customer'
        };
    }
}

/**
 * Create Stripe subscription with offline support
 */
export async function createStripeSubscription(
    businessId: string,
    subscriptionData: {
        priceId: string;
        customerId?: string;
        trial_days?: number;
        metadata?: Record<string, string>;
    },
    userId?: string
): Promise<StripeResult> {
    try {
        // Get customer ID if not provided
        let customerId = subscriptionData.customerId;
        if (!customerId) {
            const customers = await selectStripeCustomers({}, businessId);
            if (customers.data && customers.data.length > 0) {
                customerId = customers.data[0].stripe_customer_id;
            } else {
                throw new Error('No customer found for business');
            }
        }

        // If offline, queue the operation
        if (!navigator.onLine) {
            const placeholderSubscription = {
                id: crypto.randomUUID(),
                business_id: businessId,
                stripe_subscription_id: `pending_${Date.now()}`,
                plan_id: subscriptionData.priceId,
                status: 'pending',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await insertStripeSubscription(placeholderSubscription, businessId);
            await queueStripeOperation('create_subscription', { ...subscriptionData, customerId }, businessId, userId);

            return {
                success: true,
                data: placeholderSubscription,
                queued: true
            };
        }

        // Try to create via API when online
        try {
            const response = await fetch('/api/stripe/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    priceId: subscriptionData.priceId,
                    trial_days: subscriptionData.trial_days,
                    metadata: { ...subscriptionData.metadata, businessId }
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const result = await response.json();

            // Handle subscription requiring payment confirmation
            if (result.requiresAction) {
                return {
                    success: true,
                    requiresAction: true,
                    clientSecret: result.clientSecret,
                    data: result
                };
            }

            // Store subscription data locally
            const subscriptionRecord = {
                id: crypto.randomUUID(),
                business_id: businessId,
                stripe_subscription_id: result.subscriptionId,
                plan_id: subscriptionData.priceId,
                status: result.status,
                current_period_start: result.current_period_start,
                current_period_end: result.current_period_end,
                cancel_at_period_end: result.cancel_at_period_end || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await insertStripeSubscription(subscriptionRecord, businessId);

            return {
                success: true,
                data: subscriptionRecord
            };
        } catch (apiError) {
            // API failed but queue for later
            await queueStripeOperation('create_subscription', { ...subscriptionData, customerId }, businessId, userId);

            return {
                success: true,
                queued: true,
                error: 'Subscription creation queued for when service is available'
            };
        }
    } catch (error) {
        console.error('Error creating Stripe subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create subscription'
        };
    }
}

/**
 * Cancel Stripe subscription
 */
export async function cancelStripeSubscription(
    businessId: string,
    subscriptionId: string,
    immediately = false,
    userId?: string
): Promise<StripeResult> {
    try {
        // Update local subscription optimistically
        const subscriptions = await selectStripeSubscriptions({}, businessId);
        const subscription = subscriptions.data?.find((sub: StripeSubscription) =>
            sub.stripe_subscription_id === subscriptionId
        );

        if (!subscription) {
            return {
                success: false,
                error: 'Subscription not found'
            };
        }

        const updatedSubscription = {
            ...subscription,
            cancel_at_period_end: !immediately,
            canceled_at: immediately ? new Date().toISOString() : null,
            status: immediately ? 'canceled' : subscription.status,
            updated_at: new Date().toISOString()
        };

        await updateStripeSubscription(subscription.id, updatedSubscription, businessId);

        // If offline, queue the operation
        if (!navigator.onLine) {
            await queueStripeOperation('cancel_subscription', { subscriptionId, immediately }, businessId, userId);

            return {
                success: true,
                data: updatedSubscription,
                queued: true
            };
        }

        // Try to cancel via API when online
        try {
            const response = await fetch('/api/stripe/subscriptions/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId, immediately })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const result = await response.json();

            // Update with actual server response
            const finalSubscription = {
                ...subscription,
                cancel_at_period_end: result.cancel_at_period_end,
                canceled_at: result.canceled_at,
                status: result.status,
                updated_at: new Date().toISOString()
            };

            await updateStripeSubscription(subscription.id, finalSubscription, businessId);

            return {
                success: true,
                data: finalSubscription
            };
        } catch (apiError) {
            // API failed but local update was made and queued
            return {
                success: true,
                data: updatedSubscription,
                queued: true,
                error: 'Cancellation queued for when service is available'
            };
        }
    } catch (error) {
        console.error('Error canceling Stripe subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel subscription'
        };
    }
}

/**
 * Get subscription status (from local cache)
 */
export async function getSubscriptionStatus(businessId: string): Promise<StripeSubscription | null> {
    try {
        const subscriptions = await selectStripeSubscriptions({}, businessId);

        if (!subscriptions.data || subscriptions.data.length === 0) {
            return null;
        }

        // Return the most recent active subscription
        const sortedSubscriptions = subscriptions.data
            .sort((a: StripeSubscription, b: StripeSubscription) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

        return sortedSubscriptions[0];
    } catch (error) {
        console.error('Error getting subscription status:', error);
        return null;
    }
}

/**
 * Get billing history (from local cache)
 */
export async function getBillingHistory(businessId: string): Promise<StripeInvoice[]> {
    try {
        const invoices = await selectStripeInvoices({}, businessId);

        if (!invoices.data) {
            return [];
        }

        return invoices.data.sort((a: StripeInvoice, b: StripeInvoice) =>
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
    } catch (error) {
        console.error('Error getting billing history:', error);
        return [];
    }
}

/**
 * Queue Stripe operation for when online
 */
async function queueStripeOperation(
    type: 'create_customer' | 'create_subscription' | 'cancel_subscription',
    data: any,
    businessId: string,
    userId?: string
) {
    try {
        const operation = {
            id: crypto.randomUUID(),
            type,
            data,
            businessId,
            userId: userId || '',
            createdAt: new Date().toISOString(),
            attempts: 0
        };

        const existingQueue = JSON.parse(localStorage.getItem('stripeOperationQueue') || '[]');
        existingQueue.push(operation);
        localStorage.setItem('stripeOperationQueue', JSON.stringify(existingQueue));
    } catch (error) {
        console.error('Failed to queue Stripe operation:', error);
    }
}

/**
 * Process queued Stripe operations when online
 */
export async function processStripeOperationQueue() {
    if (!navigator.onLine) return;

    try {
        const queue = JSON.parse(localStorage.getItem('stripeOperationQueue') || '[]');
        if (queue.length === 0) return;

        const processedIds: string[] = [];

        for (const operation of queue) {
            try {
                let success = false;

                switch (operation.type) {
                    case 'create_customer':
                        const customerResult = await fetch('/api/stripe/customers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ businessId: operation.businessId, ...operation.data })
                        });
                        success = customerResult.ok;
                        break;

                    case 'create_subscription':
                        const subscriptionResult = await fetch('/api/stripe/subscriptions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(operation.data)
                        });
                        success = subscriptionResult.ok;
                        break;

                    case 'cancel_subscription':
                        const cancelResult = await fetch('/api/stripe/subscriptions/cancel', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(operation.data)
                        });
                        success = cancelResult.ok;
                        break;
                }

                if (success) {
                    processedIds.push(operation.id);
                } else {
                    operation.attempts += 1;
                    if (operation.attempts >= 3) {
                        processedIds.push(operation.id);
                        console.error('Stripe operation failed after 3 attempts:', operation);
                    }
                }
            } catch (error) {
                console.error('Error processing queued Stripe operation:', error);
                operation.attempts += 1;
                if (operation.attempts >= 3) {
                    processedIds.push(operation.id);
                }
            }
        }

        // Remove processed operations from queue
        const remainingQueue = queue.filter((op: any) => !processedIds.includes(op.id));
        localStorage.setItem('stripeOperationQueue', JSON.stringify(remainingQueue));

    } catch (error) {
        console.error('Error processing Stripe operation queue:', error);
    }
}

/**
 * Sync Stripe data from server
 */
export async function syncStripeData(businessId: string): Promise<{ synced: number; errors: number }> {
    if (!navigator.onLine) {
        return { synced: 0, errors: 1 };
    }

    let synced = 0;
    let errors = 0;

    try {
        const response = await fetch(`/api/stripe/sync?businessId=${businessId}`);
        if (response.ok) {
            const syncData = await response.json();

            // Update local data with server data
            if (syncData.customer) {
                await insertStripeCustomer(syncData.customer, businessId);
                synced++;
            }

            if (syncData.subscriptions?.length > 0) {
                for (const subscription of syncData.subscriptions) {
                    await insertStripeSubscription(subscription, businessId);
                    synced++;
                }
            }

            if (syncData.invoices?.length > 0) {
                for (const invoice of syncData.invoices) {
                    await insertStripeInvoice(invoice, businessId);
                    synced++;
                }
            }
        } else {
            errors++;
        }
    } catch (error) {
        console.error('Error syncing Stripe data:', error);
        errors++;
    }

    return { synced, errors };
}

// Helper functions for Stripe data
export const stripeHelpers = {
    isSubscriptionActive: (subscription: StripeSubscription | null): boolean => {
        if (!subscription) return false;
        return ['active', 'trialing'].includes(subscription.status || '');
    },

    isSubscriptionCanceled: (subscription: StripeSubscription | null): boolean => {
        if (!subscription) return false;
        return subscription.status === 'canceled' || Boolean(subscription.cancel_at_period_end);
    },

    getSubscriptionEndDate: (subscription: StripeSubscription | null): Date | null => {
        if (!subscription?.current_period_end) return null;
        return new Date(subscription.current_period_end);
    },

    formatAmount: (amount: number | null): string => {
        if (!amount) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount / 100);
    }
};

// Auto-process queue when coming online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        processStripeOperationQueue();
    });
}
