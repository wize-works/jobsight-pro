
'use client';

import { useState, useEffect } from 'react';
import { getCurrentSubscription, getSubscriptionPlans } from '@/app/actions/subscriptions';
import type { BusinessSubscription, SubscriptionPlan } from '@/types/subscription';
import { useBusiness } from '@/lib/business-context';

export const useSubscription = () => {
    const { businessId } = useBusiness();
    const [currentSubscription, setCurrentSubscription] = useState<BusinessSubscription | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSubscriptionData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [subscription, subscriptionPlans] = await Promise.all([
                getCurrentSubscription(businessId),
                getSubscriptionPlans()
            ]);

            setCurrentSubscription(subscription);
            setPlans(subscriptionPlans);
        } catch (err) {
            console.error('Error loading subscription data:', err);
            setError('Failed to load subscription data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSubscriptionData();
    }, []);

    const getCurrentPlan = (): SubscriptionPlan | null => {
        if (!currentSubscription) return null;
        return plans.find(plan => plan.id === currentSubscription.plan_id) || null;
    };

    const isPlanActive = (planId: string): boolean => {
        return currentSubscription?.plan_id === planId && currentSubscription?.status === 'active';
    };

    const hasActiveSubscription = (): boolean => {
        return currentSubscription?.status === 'active';
    };

    return {
        currentSubscription,
        plans,
        isLoading,
        error,
        getCurrentPlan,
        isPlanActive,
        hasActiveSubscription,
        refreshData: loadSubscriptionData
    };
};
