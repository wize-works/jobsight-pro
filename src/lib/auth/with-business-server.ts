import { redirect } from 'next/navigation'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getUserBusiness } from "@/app/actions/business"
import type { Business } from "@/types/business"
import { getActiveSubscription } from '../subscriptions-utils'

export type WithBusinessResult = {
    business: Business;
    userId: string;
}

export async function withBusinessServer(): Promise<WithBusinessResult> {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();

    if (!user?.id) {
        console.error("[withBusinessServer] No user ID found");
        redirect('/');
    }

    try {
        console.log("[withBusinessServer] Fetching business for user:", user.id);
        const businessResponse = await getUserBusiness(user.id);
        console.log("[withBusinessServer] Business response:", businessResponse);

        // If the response indicates an authentication error
        if ('success' in businessResponse && !businessResponse.success) {
            console.error("[withBusinessServer] Business auth error:", businessResponse);

            redirect("/register");
        }

        // If no business found, redirect based on allowRegistration flag
        if (!businessResponse || 'success' in businessResponse) {
            console.error("[withBusinessServer] No business found for user:", user.id);

            redirect("/register");
        }

        // Check if user has an active subscription (optional check based on business requirements)
        try {
            const subscription = await getActiveSubscription(businessResponse.id);

            if (!subscription || subscription.status !== 'active') {
                console.warn("[withBusinessServer] No active subscription found for user:", user.id);
                // Allow access but could be modified based on business rules
                redirect("/register"); // Uncomment if subscription is required for dashboard access
            }
        } catch (error) {
            console.error("[withBusinessServer] Error checking subscription:", error);
            // Continue without subscription check if there's an error
        }

        console.log("[withBusinessServer] Business found:", businessResponse);
        return {
            business: businessResponse,
            userId: user.id
        };
    } catch (error) {
        console.error("[withBusinessServer] Error:", error);
        redirect('/register');
    }
}