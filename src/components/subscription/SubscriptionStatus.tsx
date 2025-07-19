'use client';

import React from 'react';
import { useFeatureGate } from '@/hooks/use-feature-gate';

interface SubscriptionStatusProps {
    variant?: 'badge' | 'card' | 'inline';
    showUpgradeButton?: boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
    variant = 'badge',
    showUpgradeButton = false,
}) => {
    const {
        currentPlan,
        isSubscriptionActive,
        isInGracePeriod,
        daysUntilExpiry,
        upgradeUrl,
        getUserLimit,
        getStorageLimit,
    } = useFeatureGate();

    const planNames = {
        personal: 'Personal',
        starter: 'Starter',
        pro: 'Pro',
        business: 'Business',
        enterprise: 'Enterprise',
    };

    const planColors = {
        personal: 'badge-neutral',
        starter: 'badge-primary',
        pro: 'badge-secondary',
        business: 'badge-accent',
        enterprise: 'badge-warning',
    };

    const formatStorage = (mb: number): string => {
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(0)}GB`;
        }
        return `${mb}MB`;
    };

    const getStatusBadge = () => {
        if (!isSubscriptionActive) {
            return <span className="badge badge-error badge-sm">Inactive</span>;
        }
        if (isInGracePeriod) {
            return <span className="badge badge-warning badge-sm">Past Due</span>;
        }
        return <span className="badge badge-success badge-sm">Active</span>;
    };

    const getExpiryWarning = () => {
        if (daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            return (
                <div className="text-warning text-xs mt-1">
                    <i className="far fa-exclamation-triangle mr-1"></i>
                    Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                </div>
            );
        }
        if (daysUntilExpiry !== null && daysUntilExpiry <= 0) {
            return (
                <div className="text-error text-xs mt-1">
                    <i className="far fa-exclamation-circle mr-1"></i>
                    Subscription expired
                </div>
            );
        }
        return null;
    };

    if (variant === 'badge') {
        return (
            <div className="flex items-center gap-2">
                <span className={`badge ${planColors[currentPlan]} badge-sm`}>
                    {planNames[currentPlan]}
                </span>
                {getStatusBadge()}
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{planNames[currentPlan]} Plan</span>
                {getStatusBadge()}
                {getExpiryWarning()}
                {showUpgradeButton && currentPlan !== 'enterprise' && (
                    <button
                        onClick={() => window.open(upgradeUrl, '_blank')}
                        className="btn btn-xs btn-primary"
                    >
                        <i className="far fa-arrow-up mr-1"></i>
                        Upgrade
                    </button>
                )}
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="card-title text-base">
                            <i className="far fa-credit-card mr-2"></i>
                            Subscription
                        </h3>
                        {getStatusBadge()}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/70">Current Plan:</span>
                            <span className={`badge ${planColors[currentPlan]} badge-sm`}>
                                {planNames[currentPlan]}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/70">Users:</span>
                            <span>Up to {getUserLimit()}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-base-content/70">Storage:</span>
                            <span>{formatStorage(getStorageLimit())}</span>
                        </div>
                    </div>

                    {getExpiryWarning()}

                    {showUpgradeButton && currentPlan !== 'enterprise' && (
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
        );
    }

    return null;
};

export default SubscriptionStatus;
