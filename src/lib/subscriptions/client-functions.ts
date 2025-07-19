import type {
    BusinessSubscription,
    SubscriptionPlan,
    BillingInterval,
} from "@/types/subscription";

/**
 * Client function to get current subscription for a business
 */
export async function getCurrentSubscription(businessId: string): Promise<BusinessSubscription | null> {
    try {
        const url = new URL('/api/subscriptions', window.location.origin);
        url.searchParams.set('action', 'get-current-subscription');
        url.searchParams.set('businessId', businessId);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch current subscription:', response.statusText);
            return null;
        }

        const data = await response.json();
        return data.subscription || null;
    } catch (error) {
        console.error('Error fetching current subscription:', error);
        return null;
    }
}

/**
 * Client function to get subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
        const url = new URL('/api/subscriptions', window.location.origin);
        url.searchParams.set('action', 'get-subscription-plans');

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch subscription plans:', response.statusText);
            return [];
        }

        const data = await response.json();
        return data.plans || [];
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        return [];
    }
}

/**
 * Client function to create or update subscription for a business
 */
export async function createSubscription(
    businessId: string,
    planId: string,
    billingInterval: BillingInterval,
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create-subscription',
                businessId,
                planId,
                billingInterval,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.error || 'Failed to create subscription'
            };
        }

        const data = await response.json();
        return { success: data.success || true };
    } catch (error) {
        console.error('Error creating subscription:', error);
        return {
            success: false,
            error: 'Failed to create subscription'
        };
    }
}

/**
 * Client function to cancel subscription for a business
 */
export async function cancelSubscription(businessId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const response = await fetch('/api/subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'cancel-subscription',
                businessId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.error || 'Failed to cancel subscription'
            };
        }

        const data = await response.json();
        return { success: data.success || true };
    } catch (error) {
        console.error('Error canceling subscription:', error);
        return {
            success: false,
            error: 'Failed to cancel subscription'
        };
    }
}
