'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { BusinessSubscriptionPlan } from '@/types/business_subscriptions';
import { useMemo } from 'react';

// Feature definitions based on pricing structure
const PLAN_FEATURES = {
    personal: ['basic_project_management', 'crew_tracking', 'equipment_tracking', 'mobile_access'],
    starter: ['ai_assistant', 'basic_reporting', 'email_support', 'all_personal_features'],
    pro: ['ai_assistant', 'invoicing', 'scheduling', 'custom_branding', 'all_starter_features'],
    business: ['ai_assistant', 'advanced_analytics', 'priority_support', 'report_exports', 'all_pro_features'],
    enterprise: ['ai_assistant', 'all_business_features', 'custom_integrations', 'dedicated_support']
} as const;

// Extract all possible feature names from the plan features
type AllFeatures = typeof PLAN_FEATURES[keyof typeof PLAN_FEATURES][number];
type LimitFeatures = 'user_limit' | 'storage_limit';
export type FeatureName = AllFeatures | LimitFeatures;

// Plan hierarchy for upgrade logic
const PLAN_HIERARCHY: Record<BusinessSubscriptionPlan, number> = {
    personal: 0,
    starter: 1,
    pro: 2,
    business: 3,
    enterprise: 4,
};

// Storage limits by plan (in MB)
const STORAGE_LIMITS = {
    personal: 100,
    starter: 1024, // 1GB
    pro: 5120, // 5GB
    business: 20480, // 20GB
    enterprise: 51200, // 50GB
} as const;

// User limits by plan
const USER_LIMITS = {
    personal: 1,
    starter: 3,
    pro: 10,
    business: 50,
    enterprise: 100,
} as const;

export function useFeatureGate() {
    const { currentSubscription, isLoading, error } = useSubscription();

    const currentPlan: BusinessSubscriptionPlan = useMemo(() => {
        if (!currentSubscription?.plan_id) return 'personal';
        return currentSubscription.plan_id as BusinessSubscriptionPlan;
    }, [currentSubscription?.plan_id]);

    const currentPlanLevel = PLAN_HIERARCHY[currentPlan];
    const hasFeature = (feature: string): boolean => {
        if (isLoading) return false;

        // Check if current plan includes the feature
        const planFeatures = PLAN_FEATURES[currentPlan] || [];

        // Hierarchical feature inheritance
        switch (feature) {
            case 'ai_assistant':
                return currentPlanLevel >= PLAN_HIERARCHY.starter;
            case 'invoicing':
            case 'scheduling':
            case 'custom_branding':
                return currentPlanLevel >= PLAN_HIERARCHY.pro;
            case 'advanced_analytics':
            case 'priority_support':
                return currentPlanLevel >= PLAN_HIERARCHY.business;
            case 'basic_project_management':
            case 'crew_tracking':
            case 'equipment_tracking':
            case 'mobile_access':
                return true; // Available on all plans
            default:
                return false;
        }
    };

    const canAddUsers = (currentUserCount: number, usersToAdd: number = 1): boolean => {
        const limit = USER_LIMITS[currentPlan];
        return (currentUserCount + usersToAdd) <= limit;
    };

    const canUploadFile = (currentStorageUsed: number, fileSizeInMB: number): boolean => {
        const limit = STORAGE_LIMITS[currentPlan];
        return (currentStorageUsed + fileSizeInMB) <= limit;
    };

    const getStorageLimit = (): number => {
        return STORAGE_LIMITS[currentPlan];
    };

    const getUserLimit = (): number => {
        return USER_LIMITS[currentPlan];
    };

    const getRequiredPlanForFeature = (feature: string): BusinessSubscriptionPlan => {
        switch (feature) {
            case 'ai_assistant':
                return 'starter';
            case 'invoicing':
            case 'scheduling':
            case 'custom_branding':
                return 'pro';
            case 'advanced_analytics':
            case 'priority_support':
                return 'business';
            default:
                return 'personal';
        }
    };

    const getUpgradeUrl = (targetPlan?: BusinessSubscriptionPlan): string => {
        // This would typically redirect to your billing/upgrade page
        const plan = targetPlan || 'pro';
        return `/dashboard/billing/upgrade?plan=${plan}`;
    };

    const checkFeature = (feature: FeatureName, currentUsage?: number) => {
        // Handle special limit features
        if (feature === 'user_limit') {
            const limit = getUserLimit();
            const current = currentUsage || 0;
            return {
                allowed: current < limit,
                currentLimit: current,
                planLimit: limit,
                message: current >= limit ? 'User limit reached' : undefined
            };
        }

        if (feature === 'storage_limit') {
            const limit = getStorageLimit();
            const current = currentUsage || 0;
            return {
                allowed: current < limit,
                currentLimit: current,
                planLimit: limit,
                message: current >= limit ? 'Storage limit reached' : undefined
            };
        }

        // Handle regular features
        const allowed = hasFeature(feature as string);
        return {
            allowed,
            message: allowed ? undefined : `Feature not available in ${currentPlan} plan`
        };
    };

    const getUpgradeMessage = (feature: FeatureName): string => {
        if (feature === 'user_limit') {
            return 'Upgrade to add more users to your business';
        }
        if (feature === 'storage_limit') {
            return 'Upgrade for more storage space';
        }

        const requiredPlan = getRequiredPlanForFeature(feature as string);
        return `Upgrade to ${requiredPlan} to access this feature`;
    };

    const canUseFeature = (feature: FeatureName): boolean => {
        return checkFeature(feature).allowed;
    };

    const isSubscriptionActive = (): boolean => {
        if (!currentSubscription) return false;
        return currentSubscription.status === 'active' || currentSubscription.status === 'trialing' || currentSubscription.status === 'past_due';
    };

    const isInGracePeriod = (): boolean => {
        return currentSubscription?.status === 'past_due';
    };

    const getDaysUntilExpiry = (): number | null => {
        if (!currentSubscription?.end_date) return null;
        const expiryDate = new Date(currentSubscription.end_date);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return {
        // Core functionality
        hasFeature,
        checkFeature,
        canUseFeature,
        currentPlan,
        subscription: currentSubscription,
        loading: isLoading,
        error,

        // Limits and checks
        canAddUsers,
        canUploadFile,
        getStorageLimit,
        getUserLimit,

        // Plan information
        getRequiredPlanForFeature,
        upgradeUrl: getUpgradeUrl(),
        getUpgradeMessage,

        // Subscription status
        isSubscriptionActive: isSubscriptionActive(),
        isInGracePeriod: isInGracePeriod(),
        daysUntilExpiry: getDaysUntilExpiry(),

        // Helper functions
        getUpgradeUrl,
    };
}

export default useFeatureGate;
