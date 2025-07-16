import { createServerClient } from './supabase';

export interface BusinessSetupInfo {
    needsSetup: boolean;
    isBusinessOwner: boolean;
    businessSetupPending: boolean;
    userId: string;
}

export async function getBusinessSetupInfo(userId: string): Promise<BusinessSetupInfo> {
    const supabase = createServerClient();

    const defaultResponse: BusinessSetupInfo = {
        needsSetup: false,
        isBusinessOwner: false,
        businessSetupPending: false,
        userId
    };

    if (!supabase) {
        console.log('[getBusinessSetupInfo] No Supabase client, returning default');
        return defaultResponse;
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('business_id, businesses!users_business_id_fkey(*)')
            .eq('auth_id', userId)
            .single();

        if (error) {
            console.error('[getBusinessSetupInfo] Error fetching user:', error);
            return defaultResponse;
        }

        if (!user?.business_id) {
            console.log('[getBusinessSetupInfo] No business_id found for user');
            return defaultResponse;
        }

        const business = user.businesses as any;
        if (!business) {
            console.log('[getBusinessSetupInfo] No business data found');
            return defaultResponse;
        }

        // Check if user is the business owner
        const isBusinessOwner = business.owner_id === userId;

        // Check if business setup is pending
        // Make sure we're explicitly checking for true/false, not truthy/falsy
        let businessSetupPending = true;
        if (business.setup_completed === true) {
            businessSetupPending = false;
        } else {
            // If it's explicitly false or null/undefined, consider setup pending
            businessSetupPending = true;
        }

        // Only business owners can complete setup
        // If user is not owner, needsSetup is always false
        const needsSetup = isBusinessOwner && businessSetupPending;

        return {
            needsSetup,
            isBusinessOwner,
            businessSetupPending,
            userId
        };

    } catch (error) {
        console.error('[getBusinessSetupInfo] Error checking user setup status:', error);
        return defaultResponse;
    }
}

// Keep the original function for backward compatibility
export async function checkIfUserNeedsSetup(userId: string): Promise<boolean> {
    const setupInfo = await getBusinessSetupInfo(userId);
    return setupInfo.needsSetup;
}
