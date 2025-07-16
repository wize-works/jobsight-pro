'use client';

import { useState, useEffect } from 'react';
import {
    SubscriptionsAPI,
    SubscriptionResponse,
    SubscriptionPlansResponse,
    CreateSubscriptionRequest,
    CreateSubscriptionResponse,
    CancelSubscriptionRequest,
    CancelSubscriptionResponse,
    subscriptionsAPI,
    subscriptionUtils
} from '@/lib/api/subscriptions';
import type {
    BusinessSubscription,
    SubscriptionPlan,
    BillingInterval,
} from "@/types/subscription";

/**
 * Hook for managing current subscription
 */
export function useCurrentSubscription(businessId: string) {
    const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await subscriptionsAPI.getCurrentSubscription(businessId);
            if (result.success) {
                setSubscription(result.subscription || null);
            } else {
                setError(result.error || 'Failed to fetch subscription');
                setSubscription(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
            setSubscription(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId) {
            fetchSubscription();
        }
    }, [businessId]);

    return { subscription, loading, error, refetch: fetchSubscription };
}

/**
 * Hook for managing subscription plans
 */
export function useSubscriptionPlans() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await subscriptionsAPI.getSubscriptionPlans();
            if (result.success) {
                setPlans(result.plans || []);
            } else {
                setError(result.error || 'Failed to fetch subscription plans');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch subscription plans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    return { plans, loading, error, refetch: fetchPlans };
}

/**
 * Hook for creating subscriptions
 */
export function useCreateSubscription() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createSubscription = async (data: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await subscriptionsAPI.createSubscription(data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createSubscription, loading, error };
}

/**
 * Hook for canceling subscriptions
 */
export function useCancelSubscription() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cancelSubscription = async (data: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await subscriptionsAPI.cancelSubscription(data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { cancelSubscription, loading, error };
}

/**
 * Hook for subscription analytics
 */
export function useSubscriptionAnalytics(subscription: BusinessSubscription | null, plans: SubscriptionPlan[]) {
    const analytics = {
        // Status checks
        isActive: subscriptionUtils.isActive(subscription),
        isTrialing: subscriptionUtils.isTrialing(subscription),
        isCanceled: subscriptionUtils.isCanceled(subscription),

        // Display info
        status: subscription ? subscriptionUtils.getStatusDisplay(subscription.status || 'unknown') : 'No Subscription',
        statusColor: subscription ? subscriptionUtils.getStatusColor(subscription.status || 'unknown') : 'gray',

        // Plan info
        currentPlan: subscription ? subscriptionUtils.getPlanById(subscription.plan_id, plans) : null,
        planName: subscription ? subscriptionUtils.getPlanDisplayName(subscription.plan_id, plans) : 'No Plan',

        // Date info
        startDate: subscription?.start_date ? subscriptionUtils.formatDate(subscription.start_date) : null,
        endDate: subscription?.end_date ? subscriptionUtils.formatDate(subscription.end_date) : null,
        daysRemaining: subscriptionUtils.getDaysRemaining(subscription),

        // Billing info
        stripeCustomerId: subscription?.stripe_customer_id || null,
        stripeSubscriptionId: subscription?.stripe_subscription_id || null,

        // Metadata
        createdAt: subscription?.created_at ? subscriptionUtils.formatDate(subscription.created_at) : null,
        updatedAt: subscription?.updated_at ? subscriptionUtils.formatDate(subscription.updated_at) : null,

        // Helper functions
        hasAccess: subscriptionUtils.isActive(subscription),
        needsUpgrade: !subscriptionUtils.isActive(subscription),
        canCancel: subscriptionUtils.isActive(subscription) && !subscriptionUtils.isCanceled(subscription)
    };

    return analytics;
}

/**
 * Hook for plan comparison
 */
export function usePlanComparison(plans: SubscriptionPlan[]) {
    const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('monthly');

    const planComparison = plans.map(plan => ({
        ...plan,
        displayPrice: subscriptionUtils.formatPlanPrice(
            subscriptionUtils.getPlanPrice(plan.id, selectedInterval, plans),
            selectedInterval
        ),
        actualPrice: subscriptionUtils.getPlanPrice(plan.id, selectedInterval, plans),
        annualSavings: subscriptionUtils.calculateAnnualSavings(plan),
        annualSavingsPercentage: subscriptionUtils.calculateAnnualSavingsPercentage(plan),
        tier: subscriptionUtils.getPlanTier(plan),
        isRecommended: subscriptionUtils.getRecommendedPlan(plans)?.id === plan.id
    }));

    const sortedPlans = planComparison.sort((a, b) => subscriptionUtils.comparePlans(a, b));

    return {
        plans: sortedPlans,
        selectedInterval,
        setSelectedInterval,
        recommendedPlan: subscriptionUtils.getRecommendedPlan(plans)
    };
}

/**
 * Combined subscription management hook
 */
export function useSubscriptionManager(businessId: string) {
    const { subscription, loading: subscriptionLoading, error: subscriptionError, refetch: refetchSubscription } = useCurrentSubscription(businessId);
    const { plans, loading: plansLoading, error: plansError, refetch: refetchPlans } = useSubscriptionPlans();
    const { createSubscription, loading: createLoading, error: createError } = useCreateSubscription();
    const { cancelSubscription, loading: cancelLoading, error: cancelError } = useCancelSubscription();

    const analytics = useSubscriptionAnalytics(subscription, plans);
    const planComparison = usePlanComparison(plans);

    // Combined loading state
    const loading = subscriptionLoading || plansLoading || createLoading || cancelLoading;

    // Combined error state
    const error = subscriptionError || plansError || createError || cancelError;

    const createOrUpdateSubscription = async (planId: string, billingInterval: BillingInterval) => {
        const result = await createSubscription({
            businessId,
            planId,
            billingInterval
        });

        if (result.success) {
            await refetchSubscription();
        }

        return result;
    };

    const cancelCurrentSubscription = async () => {
        const result = await cancelSubscription({ businessId });

        if (result.success) {
            await refetchSubscription();
        }

        return result;
    };

    const refreshData = async () => {
        await Promise.all([refetchSubscription(), refetchPlans()]);
    };

    const canUpgradeTo = (targetPlanId: string) => {
        if (!subscription) return true;
        return subscriptionUtils.canUpgrade(subscription.plan_id, targetPlanId, plans);
    };

    const canDowngradeTo = (targetPlanId: string) => {
        if (!subscription) return false;
        return subscriptionUtils.canDowngrade(subscription.plan_id, targetPlanId, plans);
    };

    return {
        // Data
        subscription,
        plans,
        analytics,
        planComparison,

        // Loading and error states
        loading,
        error,

        // Actions
        createOrUpdateSubscription,
        cancelCurrentSubscription,
        refreshData,

        // Helpers
        canUpgradeTo,
        canDowngradeTo,

        // Individual hook methods
        createSubscription,
        cancelSubscription,
        refetchSubscription,
        refetchPlans
    };
}

/**
 * Hook for subscription feature access
 */
export function useSubscriptionFeatures(businessId: string) {
    const { subscription, plans, analytics } = useSubscriptionManager(businessId);

    const hasFeature = (featureKey: string): boolean => {
        if (!subscription || !analytics.isActive) return false;

        const currentPlan = plans.find(p => p.id === subscription.plan_id);
        if (!currentPlan) return false;

        return subscriptionUtils.hasPlanFeature(currentPlan, featureKey);
    };

    const getFeatureLimit = (featureKey: string): number | null => {
        if (!subscription || !analytics.isActive) return null;

        const currentPlan = plans.find(p => p.id === subscription.plan_id);
        if (!currentPlan) return null;

        return subscriptionUtils.getPlanFeatureLimit(currentPlan, featureKey);
    };

    const requiresUpgrade = (featureKey: string): boolean => {
        return !hasFeature(featureKey) && analytics.hasAccess;
    };

    return {
        hasFeature,
        getFeatureLimit,
        requiresUpgrade,
        hasAccess: analytics.hasAccess,
        needsUpgrade: analytics.needsUpgrade
    };
}

/**
 * Hook for subscription billing info
 */
export function useSubscriptionBilling(businessId: string) {
    const { subscription, plans, analytics } = useSubscriptionManager(businessId);

    const billingInfo = {
        // Current plan pricing
        currentPlanPrice: subscription && plans.length > 0 ?
            subscriptionUtils.getPlanPrice(subscription.plan_id, 'monthly', plans) : 0,

        // Billing dates
        nextBillingDate: subscription?.end_date || null,
        billingCycle: 'monthly' as BillingInterval, // This would come from Stripe in real implementation

        // Savings calculation
        annualSavings: subscription && plans.length > 0 ?
            subscriptionUtils.calculateAnnualSavings(
                subscriptionUtils.getPlanById(subscription.plan_id, plans) || plans[0]
            ) : 0,

        // Payment info
        stripeCustomerId: subscription?.stripe_customer_id,
        stripeSubscriptionId: subscription?.stripe_subscription_id,

        // Status
        isActive: analytics.isActive,
        isTrialing: analytics.isTrialing,
        isCanceled: analytics.isCanceled,
        daysRemaining: analytics.daysRemaining
    };

    return billingInfo;
}
