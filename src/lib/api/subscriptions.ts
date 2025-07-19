import type {
    BusinessSubscription,
    SubscriptionPlan,
    BillingInterval,
} from "@/types/subscription";

// TypeScript interfaces for subscription operations
export interface SubscriptionResponse {
    success: boolean;
    subscription?: BusinessSubscription;
    error?: string;
}

export interface SubscriptionPlansResponse {
    success: boolean;
    plans?: SubscriptionPlan[];
    error?: string;
}

export interface CreateSubscriptionRequest {
    businessId: string;
    planId: string;
    billingInterval: BillingInterval;
}

export interface CreateSubscriptionResponse {
    success: boolean;
    error?: string;
}

export interface CancelSubscriptionRequest {
    businessId: string;
}

export interface CancelSubscriptionResponse {
    success: boolean;
    error?: string;
}

export interface UpdateSubscriptionRequest {
    businessId: string;
    planId: string;
    billingInterval: BillingInterval;
}

export interface UpdateSubscriptionResponse {
    success: boolean;
    error?: string;
}

/**
 * API client for subscription operations
 */
export class SubscriptionsAPI {
    private readonly baseUrl = '/api/subscriptions';

    /**
     * Get current subscription for a business
     */
    async getCurrentSubscription(businessId: string): Promise<SubscriptionResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-current-subscription&businessId=${businessId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get all available subscription plans
     */
    async getSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
        const response = await fetch(`${this.baseUrl}?action=get-subscription-plans`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Create or update a subscription
     */
    async createSubscription(data: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create-subscription',
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(data: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'cancel-subscription',
                ...data
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Update an existing Stripe subscription
     */
    async updateSubscription(data: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResponse> {
        const requestBody = {
            action: 'update-subscription',
            ...data
        };

        console.log("Client API - Request body:", requestBody);

        const response = await fetch('/api/stripe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log("Client API - Response status:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
}

// Create singleton instance
export const subscriptionsAPI = new SubscriptionsAPI();

/**
 * Utility functions for subscription operations
 */
export const subscriptionUtils = {
    /**
     * Check if subscription is active
     */
    isActive: (subscription: BusinessSubscription | null): boolean => {
        if (!subscription) return false;
        return subscription.status === 'active' || subscription.status === 'trialing';
    },

    /**
     * Check if subscription is in trial
     */
    isTrialing: (subscription: BusinessSubscription | null): boolean => {
        if (!subscription) return false;
        return subscription.status === 'trialing';
    },

    /**
     * Check if subscription is canceled
     */
    isCanceled: (subscription: BusinessSubscription | null): boolean => {
        if (!subscription) return false;
        return subscription.status === 'canceled';
    },

    /**
     * Get subscription status display text
     */
    getStatusDisplay: (status: string): string => {
        switch (status) {
            case 'active':
                return 'Active';
            case 'trialing':
                return 'Trial';
            case 'canceled':
                return 'Canceled';
            case 'expired':
                return 'Expired';
            case 'pending':
                return 'Pending';
            default:
                return 'Unknown';
        }
    },

    /**
     * Get subscription status color
     */
    getStatusColor: (status: string): string => {
        switch (status) {
            case 'active':
                return 'green';
            case 'trialing':
                return 'blue';
            case 'canceled':
                return 'red';
            case 'expired':
                return 'red';
            case 'pending':
                return 'yellow';
            default:
                return 'gray';
        }
    },

    /**
     * Calculate days remaining in subscription
     */
    getDaysRemaining: (subscription: BusinessSubscription | null): number | null => {
        if (!subscription || !subscription.end_date) return null;

        const endDate = new Date(subscription.end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return Math.max(0, diffDays);
    },

    /**
     * Format subscription dates
     */
    formatDate: (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    },

    /**
     * Get plan by ID
     */
    getPlanById: (planId: string, plans: SubscriptionPlan[]): SubscriptionPlan | null => {
        return plans.find(plan => plan.id === planId) || null;
    },

    /**
     * Get plan display name
     */
    getPlanDisplayName: (planId: string, plans: SubscriptionPlan[]): string => {
        const plan = plans.find(p => p.id === planId);
        return plan?.name || 'Unknown Plan';
    },

    /**
     * Get plan price
     */
    getPlanPrice: (planId: string, billingInterval: BillingInterval, plans: SubscriptionPlan[]): number => {
        const plan = plans.find(p => p.id === planId);
        if (!plan) return 0;

        const monthlyPrice = typeof plan.monthly_price === 'number' ? plan.monthly_price : parseFloat(plan.monthly_price) || 0;
        const annualPrice = typeof plan.annual_price === 'number' ? plan.annual_price : parseFloat(plan.annual_price) || 0;

        return billingInterval === 'monthly' ? monthlyPrice : annualPrice;
    },

    /**
     * Format plan price
     */
    formatPlanPrice: (price: number, billingInterval: BillingInterval): string => {
        const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);

        return billingInterval === 'monthly' ? `${formattedPrice}/month` : `${formattedPrice}/year`;
    },

    /**
     * Calculate annual savings
     */
    calculateAnnualSavings: (plan: SubscriptionPlan): number => {
        const monthlyPrice = typeof plan.monthly_price === 'number' ? plan.monthly_price : parseFloat(plan.monthly_price) || 0;
        const annualPrice = typeof plan.annual_price === 'number' ? plan.annual_price : parseFloat(plan.annual_price) || 0;
        const annualMonthly = monthlyPrice * 12;
        return annualMonthly - annualPrice;
    },

    /**
     * Calculate annual savings percentage
     */
    calculateAnnualSavingsPercentage: (plan: SubscriptionPlan): number => {
        const monthlyPrice = typeof plan.monthly_price === 'number' ? plan.monthly_price : parseFloat(plan.monthly_price) || 0;
        const annualPrice = typeof plan.annual_price === 'number' ? plan.annual_price : parseFloat(plan.annual_price) || 0;
        const annualMonthly = monthlyPrice * 12;
        const savings = annualMonthly - annualPrice;
        return Math.round((savings / annualMonthly) * 100);
    },

    /**
     * Check if plan has feature
     */
    hasPlanFeature: (plan: SubscriptionPlan, featureKey: string): boolean => {
        return plan.features && (plan.features as any)[featureKey] === true;
    },

    /**
     * Get plan feature limit
     */
    getPlanFeatureLimit: (plan: SubscriptionPlan, featureKey: string): number | null => {
        if (!plan.features || !(plan.features as any)[featureKey]) return null;

        const feature = (plan.features as any)[featureKey];
        return typeof feature === 'number' ? feature : null;
    },

    /**
     * Compare plans
     */
    comparePlans: (plan1: SubscriptionPlan, plan2: SubscriptionPlan): number => {
        const price1 = typeof plan1.monthly_price === 'number' ? plan1.monthly_price : parseFloat(plan1.monthly_price) || 0;
        const price2 = typeof plan2.monthly_price === 'number' ? plan2.monthly_price : parseFloat(plan2.monthly_price) || 0;
        return price1 - price2;
    },

    /**
     * Get recommended plan
     */
    getRecommendedPlan: (plans: SubscriptionPlan[]): SubscriptionPlan | null => {
        // Find plan marked as recommended or middle-tier plan
        const recommendedPlan = plans.find(plan => (plan as any).recommended);
        if (recommendedPlan) return recommendedPlan;

        // Sort by price and return middle plan
        const sortedPlans = [...plans].sort((a, b) => {
            const priceA = typeof a.monthly_price === 'number' ? a.monthly_price : parseFloat(a.monthly_price) || 0;
            const priceB = typeof b.monthly_price === 'number' ? b.monthly_price : parseFloat(b.monthly_price) || 0;
            return priceA - priceB;
        });
        const middleIndex = Math.floor(sortedPlans.length / 2);
        return sortedPlans[middleIndex] || null;
    },

    /**
     * Check if upgrade is available
     */
    canUpgrade: (currentPlanId: string, targetPlanId: string, plans: SubscriptionPlan[]): boolean => {
        const currentPlan = plans.find(p => p.id === currentPlanId);
        const targetPlan = plans.find(p => p.id === targetPlanId);

        if (!currentPlan || !targetPlan) return false;

        return targetPlan.monthly_price > currentPlan.monthly_price;
    },

    /**
     * Check if downgrade is available
     */
    canDowngrade: (currentPlanId: string, targetPlanId: string, plans: SubscriptionPlan[]): boolean => {
        const currentPlan = plans.find(p => p.id === currentPlanId);
        const targetPlan = plans.find(p => p.id === targetPlanId);

        if (!currentPlan || !targetPlan) return false;

        return targetPlan.monthly_price < currentPlan.monthly_price;
    },

    /**
     * Get plan tier
     */
    getPlanTier: (plan: SubscriptionPlan): string => {
        const monthlyPrice = typeof plan.monthly_price === 'number' ? plan.monthly_price : parseFloat(plan.monthly_price) || 0;
        if (monthlyPrice === 0) return 'free';
        if (monthlyPrice < 50) return 'basic';
        if (monthlyPrice < 100) return 'professional';
        return 'enterprise';
    },

    /**
     * Validate billing interval
     */
    isValidBillingInterval: (interval: string): interval is BillingInterval => {
        return interval === 'monthly' || interval === 'annual';
    }
};
