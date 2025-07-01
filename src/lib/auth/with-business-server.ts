import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserBusiness } from "@/app/actions/business"
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
        const businessResponse = await getUserBusiness(userId);

        // If the response indicates an authentication error
        if (!businessResponse.id && 'error' in businessResponse) {
            console.error("[withBusinessServer] Business auth error:", businessResponse);

            redirect("/register");
        }

        // If no business found, redirect based on allowRegistration flag
        if (!businessResponse || 'error' in businessResponse) {
            console.error("[withBusinessServer] No business found for user:", userId);

            redirect("/register");
        }
        let subscription = {} as BusinessSubscription;
        // Check if user has an active subscription (optional check based on business requirements)
        try {
            subscription = await getActiveSubscription(businessResponse.id);

            if (!subscription || subscription.status !== 'active') {
                console.warn("[withBusinessServer] No active subscription found for user:", userId);
                // Allow access but could be modified based on business rules
                redirect("/register"); // Uncomment if subscription is required for dashboard access
            }
        } catch (error) {
            console.error("[withBusinessServer] Error checking subscription:", error);
            // Continue without subscription check if there's an error
        }

        console.log("[withBusinessServer] Business found");
        return {
            business: businessResponse,
            subscription: subscription,
            userId: userId
        };
    } catch (error) {
        console.error("[withBusinessServer] Error:", error);
        redirect('/sign-in');
    }
}