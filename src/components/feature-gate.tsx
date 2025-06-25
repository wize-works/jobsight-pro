'use client';

import React, { ReactNode } from 'react';
import { useFeatureGate, type FeatureName } from '@/hooks/use-feature-gate';

interface FeatureGateProps {
    feature: FeatureName;
    currentUsage?: number;
    children: ReactNode;
    fallback?: ReactNode;
    showUpgradePrompt?: boolean;
    className?: string;
}

interface UpgradePromptProps {
    feature: FeatureName;
    message: string;
    className?: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, message, className = '' }) => {
    return (
        <div className={`bg-warning/10 border border-warning/20 rounded-lg p-4 ${className}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
                        <i className='far fa-lock text-warning text-xl'></i>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-base-content">
                        Feature Locked
                    </h3>
                    <p className="mt-1 text-sm text-base-content/70">
                        {message}
                    </p>
                    <div className="mt-3">
                        <button className="btn btn-warning btn-sm">
                            <i className='far fa-arrow-up mr-1'></i>
                            Upgrade Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UsageLimitPrompt: React.FC<{
    current: number;
    limit: number;
    feature: FeatureName;
    className?: string;
}> = ({ current, limit, feature, className = '' }) => {
    const usagePercent = (current / limit) * 100;
    const isNearLimit = usagePercent >= 80;
    const isOverLimit = current >= limit;

    return (
        <div className={`bg-base-200 border rounded-lg p-4 ${className}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOverLimit ? 'bg-error/20' : isNearLimit ? 'bg-warning/20' : 'bg-info/20'}`}>
                        <i className='far fa-triangle-exclamation text-xl' />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-base-content">
                        {isOverLimit ? 'Limit Exceeded' : isNearLimit ? 'Approaching Limit' : 'Usage Info'}
                    </h3>
                    <p className="mt-1 text-sm text-base-content/70">
                        {feature === 'user_limit' ?
                            `Using ${current} of ${limit} users` :
                            feature === 'storage_limit' ?
                                `Using ${current.toFixed(2)}GB of ${limit}GB storage` :
                                `${current} / ${limit}`
                        }
                    </p>
                    <div className="mt-2">
                        <div className="w-full bg-base-300 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${isOverLimit ? 'bg-error' : isNearLimit ? 'bg-warning' : 'bg-primary'
                                    }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                        </div>
                    </div>
                    {isOverLimit && (
                        <div className="mt-3">
                            <button className="btn btn-error btn-sm">
                                <i className='far fa-arrow-up mr-1'></i>
                                Upgrade to Continue
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const FeatureGate: React.FC<FeatureGateProps> = ({
    feature,
    currentUsage,
    children,
    fallback,
    showUpgradePrompt = true,
    className = '',
}) => {
    const { checkFeature, getUpgradeMessage } = useFeatureGate();

    const result = checkFeature(feature, currentUsage);

    if (result.allowed) {
        return <>{children}</>;
    }

    // If fallback is provided, use it
    if (fallback) {
        return <>{fallback}</>;
    }

    // If usage limit exceeded, show usage prompt
    if (currentUsage !== undefined && result.currentLimit !== undefined && result.planLimit !== undefined) {
        return (
            <UsageLimitPrompt
                current={result.currentLimit}
                limit={result.planLimit}
                feature={feature}
                className={className}
            />
        );
    }

    // Show upgrade prompt by default
    if (showUpgradePrompt) {
        return (
            <UpgradePrompt
                feature={feature}
                message={getUpgradeMessage(feature)}
                className={className}
            />
        );
    }

    // Return nothing if no fallback and no upgrade prompt
    return null;
};

// Hook for conditional rendering in components
export const useFeatureAccess = (feature: FeatureName, currentUsage?: number) => {
    const { checkFeature } = useFeatureGate();
    return checkFeature(feature, currentUsage);
};

// Higher-order component for protecting entire routes/pages
export const withFeatureGate = <P extends object>(
    Component: React.ComponentType<P>,
    feature: FeatureName,
    fallbackComponent?: React.ComponentType<P>
) => {
    const WrappedComponent = (props: P) => {
        const { canUseFeature } = useFeatureGate();

        if (canUseFeature(feature)) {
            return <Component {...props} />;
        }

        if (fallbackComponent) {
            const FallbackComponent = fallbackComponent;
            return <FallbackComponent {...props} />;
        }

        return (
            <FeatureGate feature={feature}>
                <Component {...props} />
            </FeatureGate>
        );
    };

    WrappedComponent.displayName = `withFeatureGate(${Component.displayName || Component.name})`;
    return WrappedComponent;
};

export default FeatureGate;
