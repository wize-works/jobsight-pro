'use client';

import React, { useState, useEffect } from 'react';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { formatStorageSize, calculateStorageUsagePercentage, getPlanDisplayName } from '@/lib/subscription-limits';
import { checkAIUsageLimit, AI_TOKEN_LIMITS } from '@/lib/ai/usage-limits';
import { useBusiness } from '@/lib/business-context';

interface UsageData {
    userCount: number;
    storageUsedMB: number;
    invoicesThisMonth: number;
    aiQueriesThisMonth: number;
    projectsActive: number;
    dailyLogsThisMonth: number;
    aiTokensUsed?: number; // Make optional for backward compatibility
}

interface SubscriptionAnalyticsDashboardProps {
    usageData: UsageData;
}

export const SubscriptionAnalyticsDashboard: React.FC<SubscriptionAnalyticsDashboardProps> = ({
    usageData,
}) => {
    const { businessId } = useBusiness();
    const [aiUsage, setAiUsage] = useState({ currentUsage: 0, limit: 0, percentageUsed: 0, canUseAI: true, remainingTokens: 0 });
    const {
        currentPlan,
        getUserLimit,
        getStorageLimit,
        isSubscriptionActive,
        isInGracePeriod,
        daysUntilExpiry,
        hasFeature,
        upgradeUrl,
    } = useFeatureGate();

    // Load AI usage data
    useEffect(() => {
        async function loadAIUsage() {
            try {
                const usage = await checkAIUsageLimit(businessId);
                setAiUsage(usage);
            } catch (error) {
                console.error('Error loading AI usage:', error);
            }
        }

        if (hasFeature('ai_assistant')) {
            loadAIUsage();
        }
    }, [businessId, hasFeature]);

    const storageUsagePercentage = calculateStorageUsagePercentage(usageData.storageUsedMB, currentPlan);
    const userUsagePercentage = (usageData.userCount / getUserLimit()) * 100;

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-error';
        if (percentage >= 75) return 'bg-warning';
        return 'bg-success';
    };

    const getUsageTextColor = (percentage: number) => {
        if (percentage >= 90) return 'text-error';
        if (percentage >= 75) return 'text-warning';
        return 'text-success';
    };

    const features = [
        { key: 'ai_assistant', name: 'AI Assistant', available: hasFeature('ai_assistant') },
        { key: 'invoicing', name: 'Invoicing', available: hasFeature('invoicing') },
        { key: 'scheduling', name: 'Scheduling', available: hasFeature('scheduling') },
        { key: 'custom_branding', name: 'Custom Branding', available: hasFeature('custom_branding') },
        { key: 'advanced_analytics', name: 'Advanced Analytics', available: hasFeature('advanced_analytics') },
        { key: 'priority_support', name: 'Priority Support', available: hasFeature('priority_support') },
    ];

    return (
        <div className="space-y-6">
            {/* Subscription Status Header */}
            <div className={`alert ${isSubscriptionActive ? 'alert-success' : 'alert-error'}`}>
                <i className={`far ${isSubscriptionActive ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                <div>
                    <div className="font-medium">
                        {getPlanDisplayName(currentPlan)} Plan
                        {isInGracePeriod && ' (Grace Period)'}
                    </div>
                    <div className="text-sm">
                        {isSubscriptionActive
                            ? `Active subscription ${daysUntilExpiry !== null && daysUntilExpiry > 0 ? `• Renews in ${daysUntilExpiry} days` : ''}`
                            : 'Subscription inactive'
                        }
                    </div>
                </div>
                {!isSubscriptionActive && (
                    <button
                        onClick={() => window.open(upgradeUrl, '_blank')}
                        className="btn btn-sm btn-primary"
                    >
                        Reactivate
                    </button>
                )}
            </div>

            {/* Usage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Users */}
                <div className="stat bg-base-100 shadow">
                    <div className="stat-figure text-primary">
                        <i className="far fa-users text-2xl"></i>
                    </div>
                    <div className="stat-title">Users</div>
                    <div className="stat-value text-primary">
                        {usageData.userCount}/{getUserLimit()}
                    </div>
                    <div className="stat-desc">
                        <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                            <div
                                className={`h-2 rounded-full ${getUsageColor(userUsagePercentage)}`}
                                style={{ width: `${Math.min(userUsagePercentage, 100)}%` }}
                            ></div>
                        </div>
                        <span className={getUsageTextColor(userUsagePercentage)}>
                            {userUsagePercentage.toFixed(0)}% used
                        </span>
                    </div>
                </div>

                {/* Storage */}
                <div className="stat bg-base-100 shadow">
                    <div className="stat-figure text-secondary">
                        <i className="far fa-hdd text-2xl"></i>
                    </div>
                    <div className="stat-title">Storage</div>
                    <div className="stat-value text-secondary">
                        {formatStorageSize(usageData.storageUsedMB)}
                    </div>
                    <div className="stat-desc">
                        <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                            <div
                                className={`h-2 rounded-full ${getUsageColor(storageUsagePercentage)}`}
                                style={{ width: `${Math.min(storageUsagePercentage, 100)}%` }}
                            ></div>
                        </div>
                        <span className={getUsageTextColor(storageUsagePercentage)}>
                            of {formatStorageSize(getStorageLimit())}
                        </span>
                    </div>
                </div>                {/* AI Usage */}
                {hasFeature('ai_assistant') ? (
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-figure text-accent">
                            <i className="far fa-robot text-2xl"></i>
                        </div>
                        <div className="stat-title">AI Tokens</div>
                        <div className="stat-value text-accent">
                            {aiUsage.currentUsage.toLocaleString()}
                        </div>
                        <div className="stat-desc">
                            <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                                <div
                                    className={`h-2 rounded-full ${getUsageColor(aiUsage.percentageUsed)}`}
                                    style={{ width: `${Math.min(aiUsage.percentageUsed, 100)}%` }}
                                ></div>
                            </div>
                            <span className={getUsageTextColor(aiUsage.percentageUsed)}>
                                of {aiUsage.limit.toLocaleString()} this month
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="stat bg-base-100 shadow opacity-50">
                        <div className="stat-figure text-base-content">
                            <i className="far fa-lock text-2xl"></i>
                        </div>
                        <div className="stat-title">AI Assistant</div>
                        <div className="stat-value text-base-content">Locked</div>
                        <div className="stat-desc">Upgrade to access AI features</div>
                    </div>
                )}

                {/* Invoices */}
                <div className="stat bg-base-100 shadow">
                    <div className="stat-figure text-info">
                        <i className="far fa-file-invoice text-2xl"></i>
                    </div>
                    <div className="stat-title">Invoices</div>
                    <div className="stat-value text-info">{usageData.invoicesThisMonth}</div>
                    <div className="stat-desc">This month</div>
                </div>
            </div>

            {/* Feature Access Overview */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title">
                        <i className="far fa-star mr-2"></i>
                        Plan Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {features.map((feature) => (
                            <div key={feature.key} className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${feature.available ? 'bg-success' : 'bg-base-300'}`}></div>
                                <span className={feature.available ? 'text-base-content' : 'text-base-content/50'}>
                                    {feature.name}
                                </span>
                                {!feature.available && (
                                    <span className="badge badge-outline badge-xs">Locked</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h3 className="card-title">
                            <i className="far fa-chart-line mr-2"></i>
                            Activity Summary
                        </h3>
                        <div className="space-y-3 mt-4">
                            <div className="flex justify-between">
                                <span>Active Projects</span>
                                <span className="font-semibold">{usageData.projectsActive}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Daily Logs (This Month)</span>
                                <span className="font-semibold">{usageData.dailyLogsThisMonth}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Storage Usage</span>
                                <span className="font-semibold">{storageUsagePercentage.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h3 className="card-title">
                            <i className="far fa-lightbulb mr-2"></i>
                            Recommendations
                        </h3>
                        <div className="space-y-3 mt-4">
                            {userUsagePercentage >= 80 && (
                                <div className="alert alert-warning alert-sm">
                                    <i className="far fa-exclamation-triangle"></i>
                                    <span>Consider upgrading to add more users</span>
                                </div>
                            )}
                            {storageUsagePercentage >= 80 && (
                                <div className="alert alert-warning alert-sm">
                                    <i className="far fa-hdd"></i>
                                    <span>Storage is running low</span>
                                </div>)}
                            {hasFeature('ai_assistant') && aiUsage.percentageUsed >= 80 && (
                                <div className="alert alert-warning alert-sm">
                                    <i className="far fa-robot"></i>
                                    <span>AI token usage is high - {aiUsage.remainingTokens.toLocaleString()} tokens remaining</span>
                                </div>
                            )}
                            {!hasFeature('ai_assistant') && usageData.projectsActive > 5 && (
                                <div className="alert alert-info alert-sm">
                                    <i className="far fa-brain"></i>
                                    <span>AI Assistant could help manage your projects</span>
                                </div>
                            )}
                            {!hasFeature('invoicing') && usageData.projectsActive > 0 && (
                                <div className="alert alert-info alert-sm">
                                    <i className="far fa-file-invoice"></i>
                                    <span>Enable invoicing to monetize your projects</span>
                                </div>
                            )}
                        </div>

                        {(userUsagePercentage >= 80 || storageUsagePercentage >= 80 || (hasFeature('ai_assistant') && aiUsage.percentageUsed >= 80) || (!hasFeature('ai_assistant') && usageData.projectsActive > 5)) && (
                            <div className="card-actions justify-end mt-4">
                                <button
                                    onClick={() => window.open(upgradeUrl, '_blank')}
                                    className="btn btn-primary btn-sm"
                                >
                                    <i className="far fa-arrow-up mr-2"></i>
                                    Upgrade Plan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionAnalyticsDashboard;
