// TypeScript interfaces for Stripe operations
export interface StripeCustomerResponse {
    success: boolean;
    customerId?: string;
    error?: string;
}

export interface StripeCheckoutSessionResponse {
    success: boolean;
    sessionUrl?: string;
    error?: string;
}

export interface StripeBillingPortalResponse {
    success: boolean;
    sessionUrl?: string;
    error?: string;
}

export interface StripeSubscriptionResponse {
    success: boolean;
    subscription?: any;
    error?: string;
}

export interface StripeSubscriptionUpdateResponse {
    success: boolean;
    error?: string;
}

export interface StripeSubscriptionCancelResponse {
    success: boolean;
    error?: string;
}

export interface CreateCheckoutSessionRequest {
    planId: string;
    billingInterval: "monthly" | "annual";
}

export interface UpdateSubscriptionRequest {
    planId: string;
    billingInterval: "monthly" | "annual";
}

/**
 * API client for Stripe operations
 */
export class StripeAPI {
    private readonly baseUrl = '/api/stripe';

    /**
     * Create or get existing Stripe customer
     */
    async createCustomer(): Promise<StripeCustomerResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create-customer'
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Create Stripe checkout session
     */
    async createCheckoutSession(data: CreateCheckoutSessionRequest): Promise<StripeCheckoutSessionResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create-checkout-session',
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Create Stripe billing portal session
     */
    async createBillingPortalSession(): Promise<StripeBillingPortalResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create-billing-portal-session'
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Update Stripe subscription
     */
    async updateSubscription(data: UpdateSubscriptionRequest): Promise<StripeSubscriptionUpdateResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update-subscription',
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Cancel Stripe subscription
     */
    async cancelSubscription(): Promise<StripeSubscriptionCancelResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'cancel-subscription'
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get current Stripe subscription
     */
    async getSubscription(): Promise<StripeSubscriptionResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-subscription`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
}

// Create singleton instance
export const stripeAPI = new StripeAPI();

/**
 * Utility functions for Stripe operations
 */
export const stripeUtils = {
    /**
     * Format price for display
     */
    formatPrice: (amount: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount / 100);
    },

    /**
     * Format subscription status for display
     */
    formatSubscriptionStatus: (status: string): string => {
        switch (status) {
            case 'active':
                return 'Active';
            case 'trialing':
                return 'Trial';
            case 'past_due':
                return 'Past Due';
            case 'canceled':
                return 'Canceled';
            case 'unpaid':
                return 'Unpaid';
            default:
                return 'Unknown';
        }
    },

    /**
     * Get subscription status color
     */
    getSubscriptionStatusColor: (status: string): string => {
        switch (status) {
            case 'active':
                return 'green';
            case 'trialing':
                return 'blue';
            case 'past_due':
                return 'orange';
            case 'canceled':
                return 'red';
            case 'unpaid':
                return 'red';
            default:
                return 'gray';
        }
    },

    /**
     * Calculate days until subscription ends
     */
    getDaysUntilEnd: (endDate: string): number => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Check if subscription is in trial
     */
    isTrialing: (subscription: any): boolean => {
        return subscription?.status === 'trialing';
    },

    /**
     * Check if subscription is active
     */
    isActive: (subscription: any): boolean => {
        return subscription?.status === 'active' || subscription?.status === 'trialing';
    },

    /**
     * Check if subscription is canceled
     */
    isCanceled: (subscription: any): boolean => {
        return subscription?.status === 'canceled' || subscription?.cancel_at_period_end;
    },

    /**
     * Get trial end date
     */
    getTrialEndDate: (subscription: any): Date | null => {
        if (!subscription?.trial_end) return null;
        return new Date(subscription.trial_end * 1000);
    },

    /**
     * Get current period end date
     */
    getCurrentPeriodEndDate: (subscription: any): Date | null => {
        if (!subscription?.current_period_end) return null;
        return new Date(subscription.current_period_end * 1000);
    },

    /**
     * Format billing interval
     */
    formatBillingInterval: (interval: string): string => {
        switch (interval) {
            case 'month':
                return 'Monthly';
            case 'year':
                return 'Annually';
            default:
                return interval;
        }
    },

    /**
     * Get plan name from price ID
     */
    getPlanFromPriceId: (priceId: string, plans: any[]): any => {
        return plans.find(plan =>
            plan.stripe_monthly_price_id === priceId ||
            plan.stripe_annual_price_id === priceId
        );
    },

    /**
     * Get billing interval from price ID
     */
    getBillingIntervalFromPriceId: (priceId: string, plans: any[]): string => {
        const plan = plans.find(p =>
            p.stripe_monthly_price_id === priceId ||
            p.stripe_annual_price_id === priceId
        );

        if (!plan) return 'unknown';

        return plan.stripe_monthly_price_id === priceId ? 'monthly' : 'annual';
    },

    /**
     * Redirect to Stripe checkout or billing portal
     */
    redirectToStripe: (url: string) => {
        window.location.href = url;
    },

    /**
     * Handle Stripe error
     */
    handleStripeError: (error: any): string => {
        if (error?.code) {
            switch (error.code) {
                case 'card_declined':
                    return 'Your card was declined. Please try a different payment method.';
                case 'expired_card':
                    return 'Your card has expired. Please use a different card.';
                case 'insufficient_funds':
                    return 'Insufficient funds. Please use a different payment method.';
                case 'processing_error':
                    return 'A processing error occurred. Please try again.';
                default:
                    return error.message || 'An error occurred with your payment.';
            }
        }
        return error?.message || 'An unexpected error occurred.';
    }
};
