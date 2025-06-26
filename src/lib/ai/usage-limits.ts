import { fetchByBusiness, fetchWithBusinessById } from "@/lib/db";
import { BusinessSubscriptionPlan } from '@/types/business_subscriptions';

// AI token limits by plan
export const AI_TOKEN_LIMITS = {
    personal: 0,        // No AI access
    starter: 10000,     // 10k tokens per month
    pro: 50000,         // 50k tokens per month  
    business: 200000,   // 200k tokens per month
    enterprise: 1000000 // 1M tokens per month
} as const;

export interface AIUsageStatus {
    currentUsage: number;
    limit: number;
    percentageUsed: number;
    canUseAI: boolean;
    remainingTokens: number;
}

export async function checkAIUsageLimit(businessId: string): Promise<AIUsageStatus> {
    try {
        // Get business subscription plan
        const { data: subscriptions, error: subError } = await fetchByBusiness(
            'business_subscriptions',
            businessId,
            ['plan_id'],
            {
                filter: { status: 'active' },
                limit: 1
            }
        );

        if (subError || !subscriptions || subscriptions.length === 0) {
            // Default to personal plan if no subscription found
            console.log('No active subscription found for business:', businessId);
            return {
                currentUsage: 0,
                limit: AI_TOKEN_LIMITS.personal,
                percentageUsed: 0,
                canUseAI: false,
                remainingTokens: 0
            };
        }

        const subscription = subscriptions[0];
        const plan = subscription.plan_id as BusinessSubscriptionPlan;
        const limit = AI_TOKEN_LIMITS[plan] || 0;

        console.log(`Business ${businessId} has plan: ${plan}, AI limit: ${limit}`);

        // Personal plan has no AI access
        if (plan === 'personal') {
            return {
                currentUsage: 0,
                limit: 0,
                percentageUsed: 0,
                canUseAI: false,
                remainingTokens: 0
            };
        }

        // Get current month usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: aiLogs, error: logsError } = await fetchByBusiness(
            'ai_logs',
            businessId,
            ['tokens_prompt', 'tokens_completion'],
            {
                filter: {
                    created_at: { gte: startOfMonth.toISOString() }
                }
            }
        );

        if (logsError) {
            console.error('Error fetching AI usage:', logsError);
            // Allow usage if we can't check (fail open)
            return {
                currentUsage: 0,
                limit,
                percentageUsed: 0,
                canUseAI: true,
                remainingTokens: limit
            };
        }

        // Calculate total tokens used this month
        const currentUsage = (aiLogs || []).reduce((total, log) => {
            return total + (log.tokens_prompt || 0) + (log.tokens_completion || 0);
        }, 0);

        const percentageUsed = limit > 0 ? (currentUsage / limit) * 100 : 0;
        const remainingTokens = Math.max(0, limit - currentUsage);
        const canUseAI = currentUsage < limit;

        return {
            currentUsage,
            limit,
            percentageUsed: Math.min(percentageUsed, 100),
            canUseAI,
            remainingTokens
        };

    } catch (error) {
        console.error('Error checking AI usage limit:', error);
        // Fail open - allow usage if there's an error checking
        return {
            currentUsage: 0,
            limit: AI_TOKEN_LIMITS.starter, // Default to starter limit
            percentageUsed: 0,
            canUseAI: true,
            remainingTokens: AI_TOKEN_LIMITS.starter
        };
    }
}

export function getAILimitForPlan(plan: BusinessSubscriptionPlan): number {
    return AI_TOKEN_LIMITS[plan] || 0;
}

export function estimateTokensFromText(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    // This is a conservative estimate for usage checking
    return Math.ceil(text.length / 4);
}
