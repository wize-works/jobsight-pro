import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'
import type { Business } from "@/types/business"
import { getActiveSubscription } from '../subscriptions-utils'
import { BusinessSubscription } from '@/types/subscription'

export type WithBusinessResult = {
    business: Business;
    subscription: BusinessSubscription;
    userId: string;
}

export async function withBusinessServer(): Promise<WithBusinessResult> {
    const { userId } = await auth();

    if (!userId) {
        console.error("[withBusinessServer] No user ID found");
        redirect('/sign-in');
    }

    try {
        const supabase = createServerClient();
        if (!supabase) {
            console.error("[withBusinessServer] Supabase client not initialized");
            redirect('/sign-in');
        }

        // Get user's business ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('business_id')
            .eq('auth_id', userId)
            .single();

        if (userError || !userData?.business_id) {
            console.error("[withBusinessServer] No business found for user:", userId);
            redirect("/sign-up");
        }

        // Get business details
        const { data: businessData, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', userData.business_id)
            .single();

        if (businessError || !businessData) {
            console.error("[withBusinessServer] Error fetching business:", businessError);
            redirect("/sign-up");
        }

        let subscription = {} as BusinessSubscription;
        // Check if user has an active subscription (optional check based on business requirements)
        try {
            subscription = await getActiveSubscription(businessData.id);

            if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
                console.warn("[withBusinessServer] No active subscription found for user:", userId);
                // Allow access but could be modified based on business rules
                redirect("/sign-up"); // Uncomment if subscription is required for dashboard access
            }
        } catch (error) {
            console.error("[withBusinessServer] Error checking subscription:", error);
            // Continue without subscription check if there's an error
        }

        console.log("[withBusinessServer] Business found");
        return {
            business: businessData,
            subscription: subscription,
            userId: userId
        };
    } catch (error) {
        console.error("[withBusinessServer] Error:", error);
        redirect('/sign-in');
    }
}