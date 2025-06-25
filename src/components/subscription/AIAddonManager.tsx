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
            // TODO: Load actual AI addon subscription from database
            // For now, using placeholder data
            setCurrentAIAddon('ai_basic');
            setAiUsageThisMonth(23); // 23 queries used this month
        } catch (error) {
            console.error('Error loading AI addon status:', error);
        }
    };

    const handleUpgradeAddon = async (planId: string) => {
        setIsLoading(true);
        try {
            // TODO: Implement actual AI addon upgrade/purchase
            console.log('Upgrading to AI addon:', planId);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setCurrentAIAddon(planId);

            // Show success message
            alert(`Successfully upgraded to ${AI_ADDON_PLANS.find(p => p.id === planId)?.name}!`);
        } catch (error) {
            console.error('Error upgrading AI addon:', error);
            alert('Failed to upgrade AI addon. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelAddon = async () => {
        if (!confirm('Are you sure you want to cancel your AI addon? You will lose access to premium AI features at the end of your billing period.')) {
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Implement actual AI addon cancellation
            console.log('Canceling AI addon');

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setCurrentAIAddon(null);

            alert('AI addon canceled successfully. You will retain access until the end of your billing period.');
        } catch (error) {
            console.error('Error canceling AI addon:', error);
            alert('Failed to cancel AI addon. Please try again.');
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
                                <h3 className="text-lg font-semibold">Current AI Addon</h3>
                            </div>
                            <div className="badge badge-primary badge-lg">
                                {getCurrentAIAddonPlan()?.name || 'Unknown Plan'}
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
                                <div className="stat-title">Monthly Cost</div>
                                <div className="stat-value text-accent">${getCurrentAIAddonPlan()?.price_per_month || 0}</div>
                                <div className="stat-desc">Per month</div>
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
                                Cancel Addon
                            </button>

                            <Link href="#ai-plans" className="btn btn-primary">
                                <i className="far fa-arrow-up"></i>
                                Upgrade Plan
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Addon Plans */}
            <div id="ai-plans" className="card bg-base-100 border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-6">
                        <i className="far fa-robot text-primary text-xl"></i>
                        <h3 className="text-lg font-semibold">AI Addon Plans</h3>
                    </div>

                    {!currentAIAddon && (
                        <div className="alert alert-info mb-6">
                            <i className="far fa-info-circle text-xl"></i>
                            <div>
                                <h4 className="font-bold">Enhance Your JobSight Experience</h4>
                                <div className="text-sm">
                                    Add AI-powered features to your subscription for automated assistance,
                                    document generation, and intelligent insights.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {AI_ADDON_PLANS.map((plan) => (
                            <div
                                key={plan.id}
                                className={`card border-2 ${plan.recommended
                                        ? 'border-primary bg-primary/5'
                                        : currentAIAddon === plan.id
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

                                    {currentAIAddon === plan.id && (
                                        <div className="badge badge-success badge-sm absolute top-4 right-4">
                                            Current Plan
                                        </div>
                                    )}

                                    <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                                    <p className="text-base-content/70 mb-4">{plan.description}</p>

                                    <div className="text-3xl font-bold text-primary mb-4">
                                        ${plan.price_per_month}
                                        <span className="text-sm font-normal text-base-content/70">/month</span>
                                    </div>

                                    <div className="text-center mb-4">
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
                                        className={`btn w-full ${currentAIAddon === plan.id
                                                ? 'btn-success btn-disabled'
                                                : plan.recommended
                                                    ? 'btn-primary'
                                                    : 'btn-outline'
                                            }`}
                                        onClick={() => handleUpgradeAddon(plan.id)}
                                        disabled={isLoading || currentAIAddon === plan.id}
                                    >
                                        {isLoading ? (
                                            <span className="loading loading-spinner loading-sm"></span>
                                        ) : currentAIAddon === plan.id ? (
                                            <>
                                                <i className="far fa-check"></i>
                                                Current Plan
                                            </>
                                        ) : (
                                            <>
                                                <i className="far fa-plus"></i>
                                                {currentAIAddon ? 'Switch to Plan' : 'Add Addon'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
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
