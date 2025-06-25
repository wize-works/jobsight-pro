"use client";

import React from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { BusinessSubscriptionPlan } from '@/types/business_subscriptions';
import Link from 'next/link';
import { GracePeriodManager, TrialPeriodManager, PaymentRetryManager } from './GracePeriodManager';

interface SubscriptionStatusIndicatorProps {
    className?: string;
    showDetails?: boolean;
    showUpgradeButton?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const planLabels: Record<BusinessSubscriptionPlan, string> = {
    starter: 'starter',
    personal: 'Personal',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise'
};

const planColors: Record<BusinessSubscriptionPlan, string> = {
    personal: 'badge-neutral',
    starter: 'badge-info',
    pro: 'badge-primary',
    business: 'badge-secondary',
    enterprise: 'badge-success'
};

export const SubscriptionStatusIndicator: React.FC<SubscriptionStatusIndicatorProps> = ({
    className = '',
    showDetails = false,
    showUpgradeButton = false,
    size = 'md'
}) => {
    const { getCurrentPlan, hasActiveSubscription, currentSubscription, isLoading } = useSubscriptionContext();

    if (isLoading) {
        return (
            <div className={`skeleton h-6 w-16 ${className}`}></div>
        );
    }

    const currentPlan = getCurrentPlan();
    const planType = currentPlan?.id as BusinessSubscriptionPlan || 'starter';
    const isActive = hasActiveSubscription();

    const badgeSize = {
        sm: 'badge-sm',
        md: '',
        lg: 'badge-lg'
    }[size];

    if (!showDetails) {
        return (
            <div className={`badge ${planColors[planType]} ${badgeSize} ${className}`}>
                {planLabels[planType]}
                {!isActive && planType !== 'starter' && (
                    <span className="ml-1">
                        <i className="far fa-exclamation-triangle text-xs"></i>
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="flex items-center gap-2">
                <div className={`badge ${planColors[planType]} ${badgeSize}`}>
                    {planLabels[planType]}
                </div>

                {!isActive && planType !== 'starter' && (
                    <div className="tooltip tooltip-bottom" data-tip="Subscription inactive">
                        <i className="far fa-exclamation-triangle text-warning"></i>
                    </div>
                )}
                {isActive && currentSubscription?.status === 'canceled' && (
                    <div className="tooltip tooltip-bottom" data-tip="Subscription canceled">
                        <i className="far fa-calendar-times text-warning"></i>
                    </div>
                )}
            </div>

            {showDetails && (
                <div className="text-sm">
                    {isActive ? (
                        <div className="text-success">
                            <i className="far fa-check-circle mr-1"></i>
                            Active
                        </div>
                    ) : planType === 'personal' ? (
                        <div className="text-info">
                            <i className="far fa-info-circle mr-1"></i>
                            Free Plan
                        </div>
                    ) : (
                        <div className="text-warning">
                            <i className="far fa-exclamation-triangle mr-1"></i>
                            Inactive
                        </div>
                    )}
                </div>
            )}

            {showUpgradeButton && (planType === 'starter' || !isActive) && (
                <Link href="/dashboard/business?tab=subscription" className="btn btn-primary btn-sm">
                    <i className="far fa-arrow-up"></i>
                    {planType === 'starter' ? 'Upgrade' : 'Reactivate'}
                </Link>
            )}
        </div>
    );
};

interface SubscriptionStatusBannerProps {
    className?: string;
}

export const SubscriptionStatusBanner: React.FC<SubscriptionStatusBannerProps> = ({
    className = ''
}) => {
    const { getCurrentPlan, hasActiveSubscription, currentSubscription, isLoading } = useSubscriptionContext();

    if (isLoading) return null;

    // Show grace period, trial, or payment retry banners first (highest priority)
    return (
        <div className={className}>
            <GracePeriodManager className="mb-4" />
            <TrialPeriodManager className="mb-4" />
            <PaymentRetryManager className="mb-4" />
            <OriginalSubscriptionBanner />
        </div>
    );
};

const OriginalSubscriptionBanner: React.FC = () => {
    const { getCurrentPlan, hasActiveSubscription, currentSubscription, isLoading } = useSubscriptionContext();

    if (isLoading) return null;

    const currentPlan = getCurrentPlan();
    const planType = currentPlan?.id as BusinessSubscriptionPlan || 'starter';
    const isActive = hasActiveSubscription();
    // Don't show banner for active paid subscriptions
    if (isActive && planType !== 'starter') {
        // Only show if subscription is canceled
        if (currentSubscription?.status === 'canceled') {
            const endDate = currentSubscription?.end_date
                ? new Date(currentSubscription.end_date)
                : null;

            if (endDate) {
                const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                if (daysLeft <= 7) {
                    return (
                        <div className={`alert alert-warning shadow-lg`}>
                            <i className="far fa-calendar-times text-xl"></i>
                            <div>
                                <h3 className="font-bold">Subscription Ending Soon</h3>
                                <div className="text-sm">
                                    Your {planLabels[planType]} plan ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.
                                    Reactivate to continue using premium features.
                                </div>
                            </div>
                            <div className="flex-none">
                                <Link href="/dashboard/business?tab=subscription" className="btn btn-sm btn-warning">
                                    Reactivate
                                </Link>
                            </div>
                        </div>
                    );
                }
            }
        }
        return null;
    }

    // Show banner for free plan or inactive subscription
    if (planType === 'personal' && isActive) {
        return (
            <div className={`alert alert-info shadow-lg`}>
                <i className="far fa-info-circle text-xl"></i>
                <div>
                    <h3 className="font-bold">Welcome to JobSight Pro</h3>
                    <div className="text-sm">
                        You're on the personal plan. Upgrade to unlock advanced features like AI assistance,
                        custom branding, and unlimited projects.
                    </div>
                </div>
                <div className="flex-none">
                    <Link href="/dashboard/business?tab=subscription" className="btn btn-sm btn-primary">
                        <i className="far fa-arrow-up"></i>
                        Upgrade Now
                    </Link>
                </div>
            </div>
        );
    }

    if (isActive) {
        return (
            <div className={`alert alert-success shadow-lg`}>
                <i className="far fa-check-circle text-xl"></i>
                <div>
                    <h3 className="font-bold">Subscription Active</h3>
                    <div className="text-sm">
                        Your {planLabels[planType]} plan is active. Enjoy all premium features!
                    </div>
                </div>
                <div className="flex-none">
                    <Link href="/dashboard/business?tab=subscription" className="btn btn-sm btn-success">
                        <i className="far fa-trophy"></i>
                        Manage Plan
                    </Link>
                </div>
            </div>
        );
    }

    // Inactive paid subscription
    return (
        <div className={`alert alert-error shadow-lg`}>
            <i className="far fa-exclamation-triangle text-xl"></i>
            <div>
                <h3 className="font-bold">Subscription Inactive</h3>
                <div className="text-sm">
                    Your subscription is currently inactive. Reactivate to restore access to premium features.
                </div>
            </div>
            <div className="flex-none">
                <Link href="/dashboard/business?tab=subscription" className="btn btn-sm btn-error">
                    <i className="far fa-redo"></i>
                    Reactivate
                </Link>
            </div>
        </div>
    );
};
