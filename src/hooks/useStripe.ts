'use client';

import { useState, useEffect } from 'react';
import {
    StripeAPI,
    StripeCustomerResponse,
    StripeCheckoutSessionResponse,
    StripeBillingPortalResponse,
    StripeSubscriptionResponse,
    StripeSubscriptionUpdateResponse,
    StripeSubscriptionCancelResponse,
    CreateCheckoutSessionRequest,
    UpdateSubscriptionRequest,
    stripeAPI,
    stripeUtils
} from '@/lib/api/stripe';

/**
 * Hook for creating Stripe customer
 */
export function useStripeCustomer() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createCustomer = async (): Promise<StripeCustomerResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await stripeAPI.createCustomer();
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createCustomer, loading, error };
}

/**
 * Hook for creating Stripe checkout session
 */
export function useStripeCheckout() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createCheckoutSession = async (data: CreateCheckoutSessionRequest): Promise<StripeCheckoutSessionResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await stripeAPI.createCheckoutSession(data);

            // Auto-redirect to Stripe checkout if successful
            if (result.success && result.sessionUrl) {
                stripeUtils.redirectToStripe(result.sessionUrl);
            }

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout session';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createCheckoutSession, loading, error };
}

/**
 * Hook for creating Stripe billing portal session
 */
export function useStripeBillingPortal() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createBillingPortalSession = async (): Promise<StripeBillingPortalResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await stripeAPI.createBillingPortalSession();

            // Auto-redirect to Stripe billing portal if successful
            if (result.success && result.sessionUrl) {
                stripeUtils.redirectToStripe(result.sessionUrl);
            }

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create billing portal session';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createBillingPortalSession, loading, error };
}

/**
 * Hook for managing Stripe subscription
 */
export function useStripeSubscription() {
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await stripeAPI.getSubscription();
            if (result.success) {
                setSubscription(result.subscription);
            } else {
                setError(result.error || 'Failed to fetch subscription');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
        } finally {
            setLoading(false);
        }
    };

    const updateSubscription = async (data: UpdateSubscriptionRequest): Promise<StripeSubscriptionUpdateResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await stripeAPI.updateSubscription(data);

            if (result.success) {
                // Refresh subscription data
                await fetchSubscription();
            }

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const cancelSubscription = async (): Promise<StripeSubscriptionCancelResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await stripeAPI.cancelSubscription();

            if (result.success) {
                // Refresh subscription data
                await fetchSubscription();
            }

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    return {
        subscription,
        loading,
        error,
        updateSubscription,
        cancelSubscription,
        refetch: fetchSubscription
    };
}

/**
 * Hook for subscription analytics and status
 */
export function useStripeSubscriptionAnalytics(subscription: any) {
    const analytics = {
        // Status checks
        isActive: stripeUtils.isActive(subscription),
        isTrialing: stripeUtils.isTrialing(subscription),
        isCanceled: stripeUtils.isCanceled(subscription),

        // Dates
        trialEndDate: stripeUtils.getTrialEndDate(subscription),
        currentPeriodEndDate: stripeUtils.getCurrentPeriodEndDate(subscription),
        daysUntilEnd: subscription?.current_period_end
            ? stripeUtils.getDaysUntilEnd(new Date(subscription.current_period_end * 1000).toISOString())
            : null,

        // Display formatting
        status: stripeUtils.formatSubscriptionStatus(subscription?.status),
        statusColor: stripeUtils.getSubscriptionStatusColor(subscription?.status),

        // Billing info
        billingInterval: subscription?.items?.data?.[0]?.price?.recurring?.interval,
        formattedBillingInterval: subscription?.items?.data?.[0]?.price?.recurring?.interval
            ? stripeUtils.formatBillingInterval(subscription.items.data[0].price.recurring.interval)
            : 'Unknown',

        // Price info
        amount: subscription?.items?.data?.[0]?.price?.unit_amount,
        currency: subscription?.items?.data?.[0]?.price?.currency,
        formattedAmount: subscription?.items?.data?.[0]?.price?.unit_amount
            ? stripeUtils.formatPrice(subscription.items.data[0].price.unit_amount, subscription.items.data[0].price.currency)
            : 'Unknown',

        // Trial info
        trialDaysRemaining: subscription?.trial_end
            ? Math.max(0, Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
            : null,

        // Cancellation info
        willCancelAtPeriodEnd: subscription?.cancel_at_period_end,
        canceledAt: subscription?.canceled_at ? new Date(subscription.canceled_at * 1000) : null,

        // Payment method
        defaultPaymentMethod: subscription?.default_payment_method,

        // Metadata
        metadata: subscription?.metadata || {},

        // Customer info
        customerId: subscription?.customer
    };

    return analytics;
}

/**
 * Combined hook for complete Stripe subscription management
 */
export function useStripeSubscriptionManager() {
    const { createCustomer, loading: customerLoading, error: customerError } = useStripeCustomer();
    const { createCheckoutSession, loading: checkoutLoading, error: checkoutError } = useStripeCheckout();
    const { createBillingPortalSession, loading: billingLoading, error: billingError } = useStripeBillingPortal();
    const {
        subscription,
        loading: subscriptionLoading,
        error: subscriptionError,
        updateSubscription,
        cancelSubscription,
        refetch: refetchSubscription
    } = useStripeSubscription();

    const analytics = useStripeSubscriptionAnalytics(subscription);

    // Combined loading state
    const loading = customerLoading || checkoutLoading || billingLoading || subscriptionLoading;

    // Combined error state
    const error = customerError || checkoutError || billingError || subscriptionError;

    const startSubscription = async (planId: string, billingInterval: "monthly" | "annual") => {
        // First ensure customer exists
        const customerResult = await createCustomer();
        if (!customerResult.success) {
            return customerResult;
        }

        // Then create checkout session
        return await createCheckoutSession({ planId, billingInterval });
    };

    const manageBilling = async () => {
        return await createBillingPortalSession();
    };

    const changePlan = async (planId: string, billingInterval: "monthly" | "annual") => {
        return await updateSubscription({ planId, billingInterval });
    };

    const cancelPlan = async () => {
        return await cancelSubscription();
    };

    const refreshSubscription = async () => {
        await refetchSubscription();
    };

    return {
        // Data
        subscription,
        analytics,

        // Loading and error states
        loading,
        error,

        // Actions
        startSubscription,
        manageBilling,
        changePlan,
        cancelPlan,
        refreshSubscription,

        // Individual hook methods
        createCustomer,
        createCheckoutSession,
        createBillingPortalSession,
        updateSubscription,
        cancelSubscription
    };
}

/**
 * Hook for subscription plan comparison
 */
export function useStripeSubscriptionPlans(plans: any[]) {
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const { subscription } = useStripeSubscription();

    useEffect(() => {
        if (subscription?.items?.data?.[0]?.price?.id) {
            const priceId = subscription.items.data[0].price.id;
            const plan = stripeUtils.getPlanFromPriceId(priceId, plans);
            setCurrentPlan(plan);
        }
    }, [subscription, plans]);

    const getPlanComparison = () => {
        return plans.map(plan => ({
            ...plan,
            isCurrent: currentPlan?.id === plan.id,
            monthlyPrice: plan.stripe_monthly_price_id ?
                plans.find(p => p.stripe_monthly_price_id === plan.stripe_monthly_price_id)?.monthly_price : null,
            annualPrice: plan.stripe_annual_price_id ?
                plans.find(p => p.stripe_annual_price_id === plan.stripe_annual_price_id)?.annual_price : null,
            savings: plan.annual_price && plan.monthly_price ?
                (plan.monthly_price * 12) - plan.annual_price : null
        }));
    };

    return {
        currentPlan,
        planComparison: getPlanComparison(),
        getCurrentBillingInterval: () => {
            if (!subscription?.items?.data?.[0]?.price?.id) return null;
            return stripeUtils.getBillingIntervalFromPriceId(subscription.items.data[0].price.id, plans);
        }
    };
}
