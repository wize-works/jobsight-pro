'use client';

import { useMemo } from 'react';
import { useSubscription } from './use-subscription';
import type { SubscriptionPlan } from '@/types/subscription';

export type FeatureName =
    | 'ai_assistance'
    | 'invoicing'
    | 'scheduling'
    | 'custom_branding'
    | 'report_exports'
    | 'priority_support'
    | 'user_limit'
    | 'storage_limit';

export interface FeatureLimits {
    maxUsers: number;
    maxStorageGB: number;
    hasAIAssistance: boolean;
    hasInvoicing: boolean;
    hasScheduling: boolean;
    hasCustomBranding: boolean;
    hasReportExports: boolean;
    hasPrioritySupport: boolean;
}

export interface FeatureGateResult {
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
    currentLimit?: number;
    planLimit?: number;
}

// Plan feature definitions based on the pricing JSON
const PLAN_FEATURES: Record<string, FeatureLimits> = {
    personal: {
        maxUsers: 1,
        maxStorageGB: 0.1, // 100MB
        hasAIAssistance: false,
        hasInvoicing: false,
        hasScheduling: false,
        hasCustomBranding: false,
        hasReportExports: false,
        hasPrioritySupport: false,
    },
    starter: {
        maxUsers: 3,
        maxStorageGB: 1, // 1GB
        hasAIAssistance: true,
        hasInvoicing: false,
        hasScheduling: false,
        hasCustomBranding: false,
        hasReportExports: false,
        hasPrioritySupport: false,
    },
    pro: {
        maxUsers: 10,
        maxStorageGB: 5, // 5GB
        hasAIAssistance: true,
        hasInvoicing: true,
        hasScheduling: true,
        hasCustomBranding: true,
        hasReportExports: false,
        hasPrioritySupport: false,
    },
    business: {
        maxUsers: 50,
        maxStorageGB: 20, // 20GB
        hasAIAssistance: true,
        hasInvoicing: true,
        hasScheduling: true,
        hasCustomBranding: true,
        hasReportExports: true,
        hasPrioritySupport: true,
    },
};

export const useFeatureGate = () => {
    const { currentSubscription, getCurrentPlan, hasActiveSubscription } = useSubscription();

    const currentPlan = getCurrentPlan();
    const planId = currentPlan?.id || 'personal'; // Default to personal if no subscription

    const featureLimits = useMemo((): FeatureLimits => {
        return PLAN_FEATURES[planId] || PLAN_FEATURES.personal;
    }, [planId]);

    const checkFeature = (feature: FeatureName, currentUsage?: number): FeatureGateResult => {
        if (!hasActiveSubscription() && planId !== 'personal') {
            return {
                allowed: false,
                reason: 'No active subscription',
                upgradeRequired: true,
            };
        }

        switch (feature) {
            case 'ai_assistance':
                return {
                    allowed: featureLimits.hasAIAssistance,
                    reason: featureLimits.hasAIAssistance ? undefined : 'AI assistance requires Starter plan or higher',
                    upgradeRequired: !featureLimits.hasAIAssistance,
                };

            case 'invoicing':
                return {
                    allowed: featureLimits.hasInvoicing,
                    reason: featureLimits.hasInvoicing ? undefined : 'Invoicing requires Pro plan or higher',
                    upgradeRequired: !featureLimits.hasInvoicing,
                };

            case 'scheduling':
                return {
                    allowed: featureLimits.hasScheduling,
                    reason: featureLimits.hasScheduling ? undefined : 'Scheduling requires Pro plan or higher',
                    upgradeRequired: !featureLimits.hasScheduling,
                };

            case 'custom_branding':
                return {
                    allowed: featureLimits.hasCustomBranding,
                    reason: featureLimits.hasCustomBranding ? undefined : 'Custom branding requires Pro plan or higher',
                    upgradeRequired: !featureLimits.hasCustomBranding,
                };

            case 'report_exports':
                return {
                    allowed: featureLimits.hasReportExports,
                    reason: featureLimits.hasReportExports ? undefined : 'Report exports require Business plan',
                    upgradeRequired: !featureLimits.hasReportExports,
                };

            case 'user_limit':
                const userAllowed = currentUsage ? currentUsage <= featureLimits.maxUsers : true;
                return {
                    allowed: userAllowed,
                    reason: userAllowed ? undefined : `User limit exceeded (${currentUsage}/${featureLimits.maxUsers})`,
                    upgradeRequired: !userAllowed,
                    currentLimit: currentUsage,
                    planLimit: featureLimits.maxUsers,
                };

            case 'storage_limit':
                const storageAllowed = currentUsage ? currentUsage <= featureLimits.maxStorageGB : true;
                return {
                    allowed: storageAllowed,
                    reason: storageAllowed ? undefined : `Storage limit exceeded (${currentUsage?.toFixed(2)}GB/${featureLimits.maxStorageGB}GB)`,
                    upgradeRequired: !storageAllowed,
                    currentLimit: currentUsage,
                    planLimit: featureLimits.maxStorageGB,
                };

            default:
                return {
                    allowed: false,
                    reason: 'Unknown feature',
                };
        }
    };

    const canUseFeature = (feature: FeatureName, currentUsage?: number): boolean => {
        return checkFeature(feature, currentUsage).allowed;
    };

    const getUpgradeMessage = (feature: FeatureName): string => {
        const result = checkFeature(feature);
        if (result.allowed) return '';

        switch (feature) {
            case 'ai_assistance':
                return 'Upgrade to Starter plan to unlock AI assistance';
            case 'invoicing':
            case 'scheduling':
            case 'custom_branding':
                return 'Upgrade to Pro plan to unlock invoicing, scheduling, and custom branding';
            case 'report_exports':
                return 'Upgrade to Business plan to unlock report exports';
            default:
                return 'Upgrade your plan to unlock this feature';
        }
    };

    const getNextPlanForFeature = (feature: FeatureName): SubscriptionPlan | null => {
        // Logic to determine which plan includes the feature
        switch (feature) {
            case 'ai_assistance':
                return currentPlan?.id === 'personal' ?
                    PLAN_FEATURES.starter && getCurrentPlan() : null;
            case 'invoicing':
            case 'scheduling':
            case 'custom_branding':
                return ['personal', 'starter'].includes(planId) ?
                    PLAN_FEATURES.pro && getCurrentPlan() : null;
            case 'report_exports':
                return ['personal', 'starter', 'pro'].includes(planId) ?
                    PLAN_FEATURES.business && getCurrentPlan() : null;
            default:
                return null;
        }
    };

    return {
        featureLimits,
        currentPlan,
        planId,
        checkFeature,
        canUseFeature,
        getUpgradeMessage,
        getNextPlanForFeature,
        hasActiveSubscription: hasActiveSubscription(),
    };
};
