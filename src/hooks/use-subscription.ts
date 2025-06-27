
'use client';

import { useState, useEffect } from 'react';
import { getCurrentSubscription, getSubscriptionPlans, createDefaultSubscription } from '@/lib/actions/subscriptions-client';
import { getCurrentSubscription as getServerCurrentSubscription, getSubscriptionPlans as getServerSubscriptionPlans } from '@/app/actions/subscriptions';
import type { BusinessSubscription, SubscriptionPlan } from '@/types/subscription';
import { useBusiness } from '@/lib/business-context';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export const useSubscription = () => {
    const { businessId, loading: businessLoading } = useBusiness();
    const { user } = useKindeBrowserClient();
    const [currentSubscription, setCurrentSubscription] = useState<BusinessSubscription | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); const loadSubscriptionData = async () => {
        // Don't load if business is still loading or businessId is empty
        if (businessLoading || !businessId) {
            console.log('🔍 Subscription: Waiting for business context', { businessLoading, businessId });
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            console.log('🔍 Loading subscription data for business:', businessId);

            // Try client actions first (offline-first)
            let subscription = await getCurrentSubscription(businessId);
            let subscriptionPlans = await getSubscriptionPlans();

            // If client action returns null, fallback to server actions
            if (!subscription) {
                console.log('⚠️ Client subscription action returned null, trying server action...');
                subscription = await getServerCurrentSubscription(businessId);

                if (subscription) {
                    console.log('✅ Server action found subscription, syncing to offline storage');
                } else {
                    console.log('⚠️ No subscription found in server either. Creating default subscription...');
                    // Auto-create default subscription for businesses without one
                    if (user?.id) {
                        subscription = await createDefaultSubscription(businessId, user.id);
                        if (subscription) {
                            console.log('✅ Default subscription created successfully');
                        } else {
                            console.error('❌ Failed to create default subscription');
                        }
                    }
                }
            } else {
                console.log('✅ Client action found subscription from offline storage');
            }

            // Fallback for subscription plans if needed
            if (!subscriptionPlans || subscriptionPlans.length === 0) {
                console.log('⚠️ Client plans action returned empty, trying server action...');
                const serverPlans = await getServerSubscriptionPlans();

                if (serverPlans && serverPlans.length > 0) {
                    console.log('✅ Server action found subscription plans');
                    subscriptionPlans = serverPlans as any; // Type cast for compatibility
                }
            }

            console.log('🔍 Subscription Debug:', {
                businessId,
                subscription,
                subscriptionPlans: subscriptionPlans?.map(p => ({ id: p.id, name: p.name }))
            });

            setCurrentSubscription(subscription);
            setPlans(subscriptionPlans as any);
        } catch (err) {
            console.error('Error loading subscription data:', err);
            setError('Failed to load subscription data');
        } finally {
            setIsLoading(false);
        }
    }; useEffect(() => {
        loadSubscriptionData();
    }, [businessId, businessLoading]);

    const getCurrentPlan = (): SubscriptionPlan | null => {
        if (!currentSubscription) {
            console.log('🔍 getCurrentPlan: No current subscription');
            return null;
        }

        const foundPlan = plans.find(plan => plan.id === currentSubscription.plan_id);
        console.log('🔍 getCurrentPlan:', {
            currentSubscriptionPlanId: currentSubscription.plan_id,
            availablePlans: plans.map(p => p.id),
            foundPlan: foundPlan ? { id: foundPlan.id, name: foundPlan.name } : null
        });

        return foundPlan || null;
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
