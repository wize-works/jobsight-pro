import { redirect } from 'next/navigation'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getUserBusiness } from "@/app/actions/business"
import type { Business } from "@/types/business"

export type WithBusinessResult = {
    business: Business;
    userId: string;
}

export async function withBusinessServer(allowRegistration: boolean = false): Promise<WithBusinessResult> {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();

    if (!user?.id) {
        console.error("[withBusinessServer] No user ID found");
        redirect('/');
    }

    try {
        const businessResponse = await getUserBusiness(user.id);

        // If the response indicates an authentication error
        if ('success' in businessResponse && !businessResponse.success) {
            console.error("[withBusinessServer] Business auth error:", businessResponse);

            // If registration is allowed, redirect to register instead of home
            if (allowRegistration) {
                redirect("/register");
            } else {
                redirect("/");
            }
        }

        // If no business found, redirect based on allowRegistration flag
        if (!businessResponse || 'success' in businessResponse) {
            console.error("[withBusinessServer] No business found for user:", user.id);

            if (allowRegistration) {
                redirect("/register");
            } else {
                redirect("/");
            }
        }

        // Check if user has an active subscription (optional check based on business requirements)
        try {
            const { getCurrentSubscription } = await import("@/app/actions/subscriptions");
            const subscription = await getCurrentSubscription();

            if (!subscription || subscription.status !== 'active') {
                console.warn("[withBusinessServer] No active subscription found for user:", user.id);
                // Allow access but could be modified based on business rules
                // redirect("/register"); // Uncomment if subscription is required for dashboard access
            }
        } catch (error) {
            console.error("[withBusinessServer] Error checking subscription:", error);
            // Continue without subscription check if there's an error
        }

        return {
            business: businessResponse,
            userId: user.id
        };
    } catch (error) {
        console.error("[withBusinessServer] Error:", error);
        redirect('/');
    }
}