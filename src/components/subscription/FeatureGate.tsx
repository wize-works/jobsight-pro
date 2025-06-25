'use client';

import React from 'react';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { BusinessSubscriptionPlan } from '@/types/business_subscriptions';

interface FeatureGateProps {
    feature: 'ai_assistant' | 'invoicing' | 'scheduling' | 'custom_branding' | 'advanced_analytics' | 'priority_support';
    requiredPlan: BusinessSubscriptionPlan;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showUpgradePrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
    feature,
    requiredPlan,
    children,
    fallback,
    showUpgradePrompt = true,
}) => {
    const { hasFeature, currentPlan, upgradeUrl } = useFeatureGate();

    const hasAccess = hasFeature(feature);

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (!showUpgradePrompt) {
        return null;
    }

    const featureNames = {
        ai_assistant: 'AI Assistant',
        invoicing: 'Invoicing',
        scheduling: 'Scheduling',
        custom_branding: 'Custom Branding',
        advanced_analytics: 'Advanced Analytics',
        priority_support: 'Priority Support',
    };

    const planNames = {
        personal: 'Personal',
        starter: 'Starter',
        pro: 'Pro',
        business: 'Business',
        enterprise: 'Enterprise',
    };

    return (
        <div className="flex items-center justify-center p-6 bg-base-200 rounded-lg border-2 border-dashed border-base-300">
            <div className="text-center">
                <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 flex items-center justify-center bg-warning/20 rounded-full">
                        <i className="far fa-lock text-warning text-xl"></i>
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-base-content mb-2">
                    {featureNames[feature]} Not Available
                </h3>        <p className="text-base-content/70 mb-4 max-w-sm">
                    This feature requires a {planNames[requiredPlan]} plan or higher.
                    {currentPlan && planNames[currentPlan as keyof typeof planNames] && (
                        <span> You're currently on the {planNames[currentPlan as keyof typeof planNames]} plan.</span>
                    )}
                </p>
                <div className="space-y-2">
                    <button
                        onClick={() => window.open(upgradeUrl, '_blank')}
                        className="btn btn-primary btn-sm"
                    >
                        <i className="far fa-arrow-up mr-2"></i>
                        Upgrade to {planNames[requiredPlan]}
                    </button>
                    <div className="text-xs text-base-content/50">
                        <i className="far fa-info-circle mr-1"></i>
                        Unlock this feature and more with an upgrade
                    </div>
                </div>
            </div>
        </div>
    );
};

// Quick access component for inline feature checks
export const FeatureCheck: React.FC<{
    feature: FeatureGateProps['feature'];
    children: React.ReactNode;
}> = ({ feature, children }) => {
    const { hasFeature } = useFeatureGate();

    return hasFeature(feature) ? <>{children}</> : null;
};

export default FeatureGate;
