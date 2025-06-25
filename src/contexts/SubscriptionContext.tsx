'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { BusinessSubscription, SubscriptionPlan } from '@/types/subscription';

interface SubscriptionContextType {
    currentSubscription: BusinessSubscription | null;
    plans: SubscriptionPlan[];
    isLoading: boolean;
    error: string | null;
    getCurrentPlan: () => SubscriptionPlan | null;
    isPlanActive: (planId: string) => boolean;
    hasActiveSubscription: () => boolean;
    refreshData: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscriptionContext = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
    }
    return context;
};

interface SubscriptionProviderProps {
    children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
    const subscriptionData = useSubscription();

    return (
        <SubscriptionContext.Provider value={subscriptionData}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export default SubscriptionProvider;
