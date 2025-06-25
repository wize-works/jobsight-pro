'use client';

import { BusinessSubscriptionPlan } from '@/types/business_subscriptions';

// User limits by plan
export const USER_LIMITS = {
    personal: 1,
    starter: 3,
    pro: 10,
    business: 50,
    enterprise: 100,
} as const;

// Storage limits by plan (in MB)
export const STORAGE_LIMITS = {
    personal: 100,
    starter: 1024, // 1GB
    pro: 5120, // 5GB
    business: 20480, // 20GB
    enterprise: 51200, // 50GB
} as const;

// Feature definitions based on pricing structure
export const PLAN_FEATURES = {
    personal: [
        'basic_project_management',
        'crew_tracking',
        'equipment_tracking',
        'mobile_access',
        'core_features'
        // Note: AI assistant NOT included in personal plan
    ],
    starter: [
        'ai_assistant',
        'basic_reporting',
        'email_support',
        'enhanced_storage'
    ],
    pro: [
        'ai_assistant', // AI available in pro
        'invoicing',
        'scheduling',
        'custom_branding',
        'advanced_features'
    ],
    business: [
        'ai_assistant', // AI available in business
        'advanced_analytics',
        'priority_support',
        'report_exports',
        'team_management'
    ], enterprise: [
        'ai_assistant', // AI available in enterprise
        'custom_integrations',
        'dedicated_support',
        'unlimited_features',
        'enterprise_security'
    ]
} as const;

// Plan hierarchy for upgrade logic
export const PLAN_HIERARCHY: Record<BusinessSubscriptionPlan, number> = {
    personal: 0,
    starter: 1,
    pro: 2,
    business: 3,
    enterprise: 4,
};

export function getUserLimit(plan: BusinessSubscriptionPlan): number {
    return USER_LIMITS[plan];
}

export function getStorageLimit(plan: BusinessSubscriptionPlan): number {
    return STORAGE_LIMITS[plan];
}

export function getPlanFeatures(plan: BusinessSubscriptionPlan): readonly string[] {
    return PLAN_FEATURES[plan] || [];
}

export function canUserAddMembers(
    currentPlan: BusinessSubscriptionPlan,
    currentUserCount: number,
    usersToAdd: number = 1
): boolean {
    const limit = getUserLimit(currentPlan);
    return (currentUserCount + usersToAdd) <= limit;
}

export function canUploadFile(
    currentPlan: BusinessSubscriptionPlan,
    currentStorageUsed: number,
    fileSizeInMB: number
): boolean {
    const limit = getStorageLimit(currentPlan);
    return (currentStorageUsed + fileSizeInMB) <= limit;
}

export function getNextPlan(currentPlan: BusinessSubscriptionPlan): BusinessSubscriptionPlan | null {
    const currentLevel = PLAN_HIERARCHY[currentPlan];
    const nextLevel = currentLevel + 1;

    const nextPlan = Object.entries(PLAN_HIERARCHY).find(
        ([, level]) => level === nextLevel
    )?.[0] as BusinessSubscriptionPlan;

    return nextPlan || null;
}

export function formatStorageSize(sizeInMB: number): string {
    if (sizeInMB >= 1024) {
        return `${(sizeInMB / 1024).toFixed(0)}GB`;
    }
    return `${sizeInMB}MB`;
}

export function calculateStorageUsagePercentage(
    usedMB: number,
    plan: BusinessSubscriptionPlan
): number {
    const limit = getStorageLimit(plan);
    return Math.min((usedMB / limit) * 100, 100);
}

export function getPlanDisplayName(plan: BusinessSubscriptionPlan): string {
    const names = {
        personal: 'Personal',
        starter: 'Starter',
        pro: 'Pro',
        business: 'Business',
        enterprise: 'Enterprise',
    };
    return names[plan];
}

export function getPlanColor(plan: BusinessSubscriptionPlan): string {
    const colors = {
        personal: 'badge-neutral',
        starter: 'badge-primary',
        pro: 'badge-secondary',
        business: 'badge-accent',
        enterprise: 'badge-warning',
    };
    return colors[plan];
}

export default {
    USER_LIMITS,
    STORAGE_LIMITS,
    PLAN_FEATURES,
    PLAN_HIERARCHY,
    getUserLimit,
    getStorageLimit,
    getPlanFeatures,
    canUserAddMembers,
    canUploadFile,
    getNextPlan,
    formatStorageSize,
    calculateStorageUsagePercentage,
    getPlanDisplayName,
    getPlanColor,
};
