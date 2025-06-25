// Debug component to check subscription data
'use client';

import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

export const SubscriptionDebug = () => {
    const { currentSubscription, getCurrentPlan, hasActiveSubscription, isLoading } = useSubscriptionContext();

    if (isLoading) return <div>Loading...</div>;

    const currentPlan = getCurrentPlan();

    return (
        <div className="p-4 bg-gray-100 rounded-lg text-sm">
            <h3 className="font-bold mb-2">Subscription Debug Info:</h3>
            <div><strong>Current Subscription:</strong> {JSON.stringify(currentSubscription, null, 2)}</div>
            <div><strong>Current Plan:</strong> {JSON.stringify(currentPlan, null, 2)}</div>
            <div><strong>Has Active Subscription:</strong> {hasActiveSubscription().toString()}</div>
        </div>
    );
};
