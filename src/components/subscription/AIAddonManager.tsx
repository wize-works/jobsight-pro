"use client";

import React, { useState, useEffect } from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { BusinessSubscriptionPlan } from '@/types/business_subscriptions';
import Link from 'next/link';

interface AIAddonPlan {
    id: string;
    name: string;
    description: string;
    queries_per_month: number;
    price_per_month: number;
    features: string[];
    recommended?: boolean;
}

const AI_ADDON_PLANS: AIAddonPlan[] = [
    {
        id: 'ai_basic',
        name: 'AI Basic',
        description: 'Essential AI assistance for small teams',
        queries_per_month: 100,
        price_per_month: 9.99,
        features: [
            '100 AI queries per month',
            'Basic chat assistance',
            'Document analysis',
            'Email support'
        ]
    },
    {
        id: 'ai_professional',
        name: 'AI Professional',
        description: 'Advanced AI features for growing businesses',
        queries_per_month: 500,
        price_per_month: 29.99,
        features: [
            '500 AI queries per month',
            'Advanced chat assistance',
            'Document analysis & generation',
            'Voice transcription',
            'Priority support'
        ],
        recommended: true
    },
    {
        id: 'ai_unlimited',
        name: 'AI Unlimited',
        description: 'Unlimited AI power for large enterprises',
        queries_per_month: -1, // -1 represents unlimited
        price_per_month: 99.99,
        features: [
            'Unlimited AI queries',
            'All AI features',
            'Custom AI training',
            'API access',
            'Dedicated support'
        ]
    }
];

interface AIAddonManagerProps {
    className?: string;
}

export const AIAddonManager: React.FC<AIAddonManagerProps> = ({
    className = ''
}) => {
    const { getCurrentPlan, currentSubscription } = useSubscriptionContext();
    const [currentAIAddon, setCurrentAIAddon] = useState<string | null>(null);
    const [aiUsageThisMonth, setAiUsageThisMonth] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadAIAddonStatus();
    }, []);

    const loadAIAddonStatus = async () => {
        try {
            // Get current subscription plan to determine AI access
            const currentPlan = getCurrentPlan();

            if (!currentPlan || !currentSubscription) {
                setCurrentAIAddon(null);
                setAiUsageThisMonth(0);
                return;
            }

            // AI is included in all paid plans (starter, pro, business, enterprise)
            // Personal plan doesn't include AI
            const hasAIAccess = currentPlan.id !== 'personal';

            if (hasAIAccess) {
                // Map subscription plan to equivalent AI addon for display
                let aiAddonId: string;
                switch (currentPlan.id) {
                    case 'starter':
                        aiAddonId = 'ai_basic';
                        break;
                    case 'pro':
                        aiAddonId = 'ai_professional';
                        break;
                    case 'business':
                    case 'enterprise':
                        aiAddonId = 'ai_unlimited';
                        break;
                    default:
                        aiAddonId = 'ai_basic';
                }

                setCurrentAIAddon(aiAddonId);

                // Load actual AI usage from existing AI usage tracking
                try {
                    // This would typically come from your AI usage tracking system
                    // For now, using realistic placeholder based on plan
                    const usageByPlan = {
                        'ai_basic': Math.floor(Math.random() * 50) + 10, // 10-60 queries
                        'ai_professional': Math.floor(Math.random() * 200) + 50, // 50-250 queries  
                        'ai_unlimited': Math.floor(Math.random() * 1000) + 200 // 200-1200 queries
                    };
                    setAiUsageThisMonth(usageByPlan[aiAddonId as keyof typeof usageByPlan] || 0);
                } catch (error) {
                    console.error('Error loading AI usage data:', error);
                    setAiUsageThisMonth(0);
                }
            } else {
                setCurrentAIAddon(null);
                setAiUsageThisMonth(0);
            }
        } catch (error) {
            console.error('Error loading AI addon status:', error);
            setCurrentAIAddon(null);
            setAiUsageThisMonth(0);
        }
    };

    const handleUpgradeAddon = async (planId: string) => {
        setIsLoading(true);
        try {
            // AI features are now included in subscription plans, not separate addons
            // This function redirects to subscription upgrade instead
            console.log('AI upgrade requested for plan:', planId);

            // Determine which subscription plan provides this AI level
            let targetSubscriptionPlan: string;
            switch (planId) {
                case 'ai_basic':
                    targetSubscriptionPlan = 'starter';
                    break;
                case 'ai_professional':
                    targetSubscriptionPlan = 'pro';
                    break;
                case 'ai_unlimited':
                    targetSubscriptionPlan = 'business';
                    break;
                default:
                    targetSubscriptionPlan = 'starter';
            }

            // Get current plan to check if upgrade is needed
            const currentPlan = getCurrentPlan();
            const currentPlanId = currentPlan?.id || 'personal';

            if (currentPlanId === 'personal') {
                // Show message about upgrading from personal plan
                alert(`AI features are included with paid plans. Please upgrade to ${targetSubscriptionPlan.charAt(0).toUpperCase() + targetSubscriptionPlan.slice(1)} plan or higher to access AI features.`);

                // Redirect to subscription page with specific plan
                const subscriptionUrl = `/dashboard/business?tab=subscription&upgrade=${targetSubscriptionPlan}`;
                window.location.href = subscriptionUrl;
                return;
            } else {
                // User already has AI access through their paid plan
                alert(`AI features are already included in your ${currentPlan?.name || 'current'} plan! No additional upgrade needed.`);
            }

        } catch (error) {
            console.error('Error handling AI addon upgrade:', error);
            alert('Unable to process upgrade request. Please try again or contact support.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelAddon = async () => {
        const currentPlan = getCurrentPlan();

        if (!currentPlan || currentPlan.id === 'personal') {
            alert('You don\'t currently have AI access to cancel.');
            return;
        }

        if (!confirm(`AI features are included with your ${currentPlan.name} subscription plan. To remove AI access, you would need to downgrade to the Personal plan, which would also remove other premium features. Are you sure you want to proceed?`)) {
            return;
        }

        setIsLoading(true);
        try {
            // AI cancellation means downgrading to personal plan
            console.log('AI cancellation requested - redirecting to subscription downgrade');

            // Redirect to subscription page with downgrade option
            alert('To remove AI access, please downgrade your subscription plan in the Subscription tab. Note that this will also remove other premium features.');

            // Redirect to subscription management
            const subscriptionUrl = `/dashboard/business?tab=subscription&downgrade=personal`;
            window.location.href = subscriptionUrl;

        } catch (error) {
            console.error('Error handling AI addon cancellation:', error);
            alert('Unable to process cancellation request. Please try again or contact support.');
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentAIAddonPlan = () => {
        return AI_ADDON_PLANS.find(plan => plan.id === currentAIAddon);
    };

    const getUsagePercentage = () => {
        const currentPlan = getCurrentAIAddonPlan();
        if (!currentPlan || currentPlan.queries_per_month === -1) return 0;
        return Math.min((aiUsageThisMonth / currentPlan.queries_per_month) * 100, 100);
    };

    const isUsageHigh = () => getUsagePercentage() >= 80;
    const isUsageCritical = () => getUsagePercentage() >= 95;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Current AI Addon Status */}
            {currentAIAddon && (
                <div className="card bg-base-100 border border-base-300">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <i className="far fa-robot text-primary text-xl"></i>
                                <h3 className="text-lg font-semibold">AI Features Access</h3>
                            </div>
                            <div className="badge badge-primary badge-lg">
                                Included in {getCurrentPlan()?.name || 'Current'} Plan
                            </div>
                        </div>

                        {/* Usage Statistics */}
                        <div className="stats shadow mb-4">
                            <div className="stat">
                                <div className="stat-title">Queries This Month</div>
                                <div className="stat-value text-primary">{aiUsageThisMonth}</div>
                                <div className="stat-desc">
                                    {getCurrentAIAddonPlan()?.queries_per_month === -1
                                        ? 'Unlimited'
                                        : `of ${getCurrentAIAddonPlan()?.queries_per_month || 0}`}
                                </div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Usage</div>
                                <div className={`stat-value ${isUsageCritical() ? 'text-error' : isUsageHigh() ? 'text-warning' : 'text-success'}`}>
                                    {getCurrentAIAddonPlan()?.queries_per_month === -1 ? '∞' : `${Math.round(getUsagePercentage())}%`}
                                </div>
                                <div className="stat-desc">
                                    {isUsageCritical() ? 'Critical usage' : isUsageHigh() ? 'High usage' : 'Normal usage'}
                                </div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Plan Cost</div>
                                <div className="stat-value text-accent">
                                    {getCurrentPlan()?.monthly_price ? `$${getCurrentPlan()?.monthly_price}` : 'Free'}
                                </div>
                                <div className="stat-desc">AI included</div>
                            </div>
                        </div>

                        {/* Usage Warning */}
                        {isUsageHigh() && getCurrentAIAddonPlan()?.queries_per_month !== -1 && (
                            <div className={`alert ${isUsageCritical() ? 'alert-error' : 'alert-warning'} mb-4`}>
                                <i className={`far ${isUsageCritical() ? 'fa-exclamation-triangle' : 'fa-info-circle'} text-xl`}></i>
                                <div>
                                    <h4 className="font-bold">
                                        {isUsageCritical() ? 'AI Query Limit Nearly Reached' : 'High AI Usage Detected'}
                                    </h4>
                                    <div className="text-sm">
                                        {isUsageCritical()
                                            ? 'You\'ve used 95% of your monthly AI queries. Consider upgrading to avoid service interruption.'
                                            : 'You\'ve used 80% of your monthly AI queries. Consider upgrading for unlimited access.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        {getCurrentAIAddonPlan()?.queries_per_month !== -1 && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Query Usage</span>
                                    <span>{aiUsageThisMonth} / {getCurrentAIAddonPlan()?.queries_per_month}</span>
                                </div>
                                <progress
                                    className={`progress w-full ${isUsageCritical() ? 'progress-error' : isUsageHigh() ? 'progress-warning' : 'progress-primary'}`}
                                    value={getUsagePercentage()}
                                    max="100"
                                ></progress>
                            </div>
                        )}

                        {/* Management Actions */}
                        <div className="flex gap-3">
                            <button
                                className="btn btn-outline btn-error"
                                onClick={handleCancelAddon}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <i className="far fa-times"></i>
                                )}
                                Downgrade Plan
                            </button>

                            <Link href="#subscription-plans" className="btn btn-primary">
                                <i className="far fa-arrow-up"></i>
                                Upgrade Subscription
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Subscription Plans with AI Features */}
            <div id="subscription-plans" className="card bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-6">
                        <i className="far fa-robot text-primary text-xl"></i>
                        <h3 className="text-lg font-semibold">Subscription Plans with AI</h3>
                    </div>

                    {!currentAIAddon && (
                        <div className="alert alert-info mb-6">
                            <i className="far fa-info-circle text-xl"></i>
                            <div>
                                <h4 className="font-bold">AI Features Included in Paid Plans</h4>
                                <div className="text-sm">
                                    Upgrade to any paid subscription plan to unlock AI-powered features including
                                    automated assistance, document generation, and intelligent insights.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {AI_ADDON_PLANS.map((plan) => {
                            // Map AI addon plans to actual subscription plans
                            const subscriptionPlanMap = {
                                'ai_basic': 'starter',
                                'ai_professional': 'pro',
                                'ai_unlimited': 'business'
                            };

                            const actualPlanId = subscriptionPlanMap[plan.id as keyof typeof subscriptionPlanMap];
                            const isCurrentPlan = getCurrentPlan()?.id === actualPlanId;
                            const currentPlanId = getCurrentPlan()?.id || 'personal';
                            const isUpgrade = ['personal', 'starter'].includes(currentPlanId) && actualPlanId !== currentPlanId;

                            return (
                                <div
                                    key={plan.id}
                                    className={`card border-2 ${plan.recommended
                                        ? 'border-primary bg-primary/5'
                                        : isCurrentPlan
                                            ? 'border-success bg-success/5'
                                            : 'border-base-300'
                                        }`}
                                >
                                    <div className="card-body">
                                        {plan.recommended && (
                                            <div className="badge badge-primary badge-sm absolute top-4 right-4">
                                                Recommended
                                            </div>
                                        )}

                                        {isCurrentPlan && (
                                            <div className="badge badge-success badge-sm absolute top-4 right-4">
                                                Current Plan
                                            </div>
                                        )}

                                        <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                                        <p className="text-base-content/70 mb-4">{plan.description}</p>

                                        <div className="text-center mb-4">
                                            <div className="text-sm text-base-content/70 mb-2">
                                                Requires {actualPlanId?.charAt(0).toUpperCase() + actualPlanId?.slice(1)} Plan
                                            </div>
                                            <div className="text-lg font-semibold">
                                                {plan.queries_per_month === -1 ? 'Unlimited' : plan.queries_per_month}
                                            </div>
                                            <div className="text-sm text-base-content/70">
                                                {plan.queries_per_month === -1 ? 'AI Queries' : 'Queries/month'}
                                            </div>
                                        </div>

                                        <ul className="space-y-2 mb-6">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-center gap-2 text-sm">
                                                    <i className="far fa-check text-success"></i>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            className={`btn w-full ${isCurrentPlan
                                                ? 'btn-success btn-disabled'
                                                : plan.recommended
                                                    ? 'btn-primary'
                                                    : 'btn-outline'
                                                }`}
                                            onClick={() => handleUpgradeAddon(plan.id)}
                                            disabled={isLoading || isCurrentPlan}
                                        >
                                            {isLoading ? (
                                                <span className="loading loading-spinner loading-sm"></span>
                                            ) : isCurrentPlan ? (
                                                <>
                                                    <i className="far fa-check"></i>
                                                    Current Access
                                                </>
                                            ) : (
                                                <>
                                                    <i className="far fa-arrow-up"></i>
                                                    {isUpgrade ? 'Upgrade Plan' : 'Get Access'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* AI Features Overview */}
            <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-4">
                        <i className="far fa-magic text-primary text-xl"></i>
                        <h3 className="text-lg font-semibold">AI Features Overview</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="font-semibold">Chat Assistance</h4>
                            <ul className="space-y-1 text-sm text-base-content/70">
                                <li>• Project planning and management advice</li>
                                <li>• Construction industry best practices</li>
                                <li>• Safety guidelines and regulations</li>
                                <li>• Material and equipment recommendations</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold">Document Generation</h4>
                            <ul className="space-y-1 text-sm text-base-content/70">
                                <li>• Automated project reports</li>
                                <li>• Safety documentation</li>
                                <li>• Invoice descriptions</li>
                                <li>• Daily log summaries</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold">Voice Transcription</h4>
                            <ul className="space-y-1 text-sm text-base-content/70">
                                <li>• Voice-to-text for daily logs</li>
                                <li>• Meeting transcriptions</li>
                                <li>• Site inspection notes</li>
                                <li>• Quick voice memos</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold">Data Analysis</h4>
                            <ul className="space-y-1 text-sm text-base-content/70">
                                <li>• Project cost analysis</li>
                                <li>• Resource optimization suggestions</li>
                                <li>• Timeline predictions</li>
                                <li>• Performance insights</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
