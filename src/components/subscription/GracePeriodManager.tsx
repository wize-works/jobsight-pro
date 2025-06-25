"use client";

import React, { useState, useEffect } from 'react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { BusinessSubscriptionPlan } from '@/types/business_subscriptions';
import Link from 'next/link';

interface GracePeriodManagerProps {
    className?: string;
}

export const GracePeriodManager: React.FC<GracePeriodManagerProps> = ({
    className = ''
}) => {
    const { currentSubscription, getCurrentPlan, hasActiveSubscription } = useSubscriptionContext();
    const [gracePeriodInfo, setGracePeriodInfo] = useState<{
        isInGracePeriod: boolean;
        daysRemaining: number;
        reason: 'payment_failed' | 'subscription_ended' | null;
    }>({
        isInGracePeriod: false,
        daysRemaining: 0,
        reason: null
    });

    useEffect(() => {
        if (!currentSubscription) return;

        // Calculate grace period based on subscription status
        const now = new Date();
        let gracePeriodEnd: Date | null = null;
        let reason: 'payment_failed' | 'subscription_ended' | null = null;

        // For payment failures (past_due status)
        if (currentSubscription.status === 'past_due') {
            // Grace period of 7 days from when payment failed
            // For now, we'll use updated_at as proxy for when status changed
            if (currentSubscription.updated_at) {
                gracePeriodEnd = new Date(currentSubscription.updated_at);
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
                reason = 'payment_failed';
            }
        }

        // For subscription ended (but in grace period)
        else if (currentSubscription.status === 'canceled' && currentSubscription.end_date) {
            // Grace period of 14 days after subscription end
            gracePeriodEnd = new Date(currentSubscription.end_date);
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14);
            reason = 'subscription_ended';
        }

        if (gracePeriodEnd && gracePeriodEnd > now) {
            const daysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            setGracePeriodInfo({
                isInGracePeriod: true,
                daysRemaining,
                reason
            });
        } else {
            setGracePeriodInfo({
                isInGracePeriod: false,
                daysRemaining: 0,
                reason: null
            });
        }
    }, [currentSubscription]);

    if (!gracePeriodInfo.isInGracePeriod) {
        return null;
    }

    const { daysRemaining, reason } = gracePeriodInfo;
    const isUrgent = daysRemaining <= 3;

    const getAlertClass = () => {
        if (isUrgent) return 'alert-error';
        return 'alert-warning';
    };

    const getIcon = () => {
        if (reason === 'payment_failed') return 'far fa-credit-card';
        return 'far fa-clock';
    };

    const getTitle = () => {
        if (reason === 'payment_failed') return 'Payment Failed - Grace Period Active';
        return 'Subscription Ended - Grace Period Active';
    };

    const getDescription = () => {
        if (reason === 'payment_failed') {
            return `Your payment couldn't be processed. You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining to update your payment method before losing access to premium features.`;
        }
        return `Your subscription has ended. You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining to resubscribe before losing access to your data and premium features.`;
    };

    const getActionButton = () => {
        if (reason === 'payment_failed') {
            return (
                <Link href="/dashboard/business?tab=subscription" className="btn btn-sm btn-error">
                    <i className="far fa-credit-card"></i>
                    Update Payment
                </Link>
            );
        }
        return (
            <Link href="/dashboard/business?tab=subscription" className="btn btn-sm btn-warning">
                <i className="far fa-redo"></i>
                Resubscribe
            </Link>
        );
    };

    return (
        <div className={`alert ${getAlertClass()} shadow-lg ${className}`}>
            <i className={`${getIcon()} text-xl`}></i>
            <div>
                <h3 className="font-bold">{getTitle()}</h3>
                <div className="text-sm">
                    {getDescription()}
                </div>
                {isUrgent && (
                    <div className="text-xs mt-1 font-semibold">
                        ⚠️ Urgent: Only {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining!
                    </div>
                )}
            </div>
            <div className="flex-none">
                {getActionButton()}
            </div>
        </div>
    );
};

interface TrialPeriodManagerProps {
    className?: string;
}

export const TrialPeriodManager: React.FC<TrialPeriodManagerProps> = ({
    className = ''
}) => {
    const { currentSubscription, getCurrentPlan } = useSubscriptionContext();
    const [trialInfo, setTrialInfo] = useState<{
        isInTrial: boolean;
        daysRemaining: number;
        trialEnd: Date | null;
    }>({
        isInTrial: false,
        daysRemaining: 0,
        trialEnd: null
    });

    useEffect(() => {
        // Check if user is in trial period
        // For now, we'll consider starter plan users as potential trial users
        // In a real implementation, you'd have trial_start_date and trial_end_date fields

        const currentPlan = getCurrentPlan();
        const isStarterPlan = currentPlan?.id === 'starter';

        if (isStarterPlan && currentSubscription?.created_at) {
            const trialStart = new Date(currentSubscription.created_at);
            const trialEnd = new Date(trialStart);
            trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

            const now = new Date();

            if (now < trialEnd) {
                const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                setTrialInfo({
                    isInTrial: true,
                    daysRemaining,
                    trialEnd
                });
            } else {
                setTrialInfo({
                    isInTrial: false,
                    daysRemaining: 0,
                    trialEnd: null
                });
            }
        } else {
            setTrialInfo({
                isInTrial: false,
                daysRemaining: 0,
                trialEnd: null
            });
        }
    }, [currentSubscription, getCurrentPlan]);

    if (!trialInfo.isInTrial) {
        return null;
    }

    const { daysRemaining } = trialInfo;
    const isEndingSoon = daysRemaining <= 3;

    return (
        <div className={`alert ${isEndingSoon ? 'alert-warning' : 'alert-info'} shadow-lg ${className}`}>
            <i className="far fa-clock text-xl"></i>
            <div>
                <h3 className="font-bold">Free Trial Active</h3>
                <div className="text-sm">
                    You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in your free trial.
                    {isEndingSoon && ' Upgrade now to continue using premium features.'}
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
};

interface PaymentRetryManagerProps {
    className?: string;
}

export const PaymentRetryManager: React.FC<PaymentRetryManagerProps> = ({
    className = ''
}) => {
    const { currentSubscription } = useSubscriptionContext();
    const [retryCount, setRetryCount] = useState(0);
    const [nextRetryDate, setNextRetryDate] = useState<Date | null>(null);

    useEffect(() => {
        // In a real implementation, you'd track retry attempts
        // For now, we'll simulate retry logic for past_due subscriptions
        if (currentSubscription?.status === 'past_due') {
            // Simulate retry schedule: Day 1, 3, 7, 14
            const statusChangeDate = currentSubscription.updated_at
                ? new Date(currentSubscription.updated_at)
                : new Date();

            const daysSinceFailure = Math.floor(
                (Date.now() - statusChangeDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            let nextRetry: Date | null = null;
            let currentRetryCount = 0;

            if (daysSinceFailure < 1) {
                nextRetry = new Date(statusChangeDate);
                nextRetry.setDate(nextRetry.getDate() + 1);
                currentRetryCount = 0;
            } else if (daysSinceFailure < 3) {
                nextRetry = new Date(statusChangeDate);
                nextRetry.setDate(nextRetry.getDate() + 3);
                currentRetryCount = 1;
            } else if (daysSinceFailure < 7) {
                nextRetry = new Date(statusChangeDate);
                nextRetry.setDate(nextRetry.getDate() + 7);
                currentRetryCount = 2;
            } else if (daysSinceFailure < 14) {
                nextRetry = new Date(statusChangeDate);
                nextRetry.setDate(nextRetry.getDate() + 14);
                currentRetryCount = 3;
            }

            setRetryCount(currentRetryCount);
            setNextRetryDate(nextRetry);
        } else {
            setRetryCount(0);
            setNextRetryDate(null);
        }
    }, [currentSubscription]);

    if (!nextRetryDate || currentSubscription?.status !== 'past_due') {
        return null;
    }

    const hoursUntilRetry = Math.max(0, Math.ceil(
        (nextRetryDate.getTime() - Date.now()) / (1000 * 60 * 60)
    ));

    return (
        <div className={`alert alert-info shadow-lg ${className}`}>
            <i className="far fa-sync text-xl"></i>
            <div>
                <h3 className="font-bold">Payment Retry Scheduled</h3>
                <div className="text-sm">
                    We'll automatically retry your payment in {hoursUntilRetry} hour{hoursUntilRetry !== 1 ? 's' : ''}.
                    This is retry attempt {retryCount + 1} of 4.
                </div>
                <div className="text-xs mt-1">
                    You can also update your payment method to try immediately.
                </div>
            </div>
            <div className="flex-none">
                <Link href="/dashboard/business?tab=subscription" className="btn btn-sm btn-info">
                    <i className="far fa-credit-card"></i>
                    Update Payment
                </Link>
            </div>
        </div>
    );
};
