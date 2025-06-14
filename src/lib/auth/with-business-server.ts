import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getUserBusiness } from "@/app/actions/business";
import type { Business } from "@/types/business";
import { getActiveSubscription } from "../subscriptions-utils";

export type WithBusinessResult =
    | { business: Business; userId: string }
    | { redirectTo: string };

export async function withBusinessServer(): Promise<WithBusinessResult> {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();

    if (!user?.id) {
        console.error("[withBusinessServer] No user ID found");
        return { redirectTo: "/" };
    }

    try {
        const businessResponse = await getUserBusiness(user.id);

        if ('success' in businessResponse && !businessResponse.success) {
            console.error("[withBusinessServer] Business auth error:", businessResponse);
            return { redirectTo: "/register" };
        }

        if (!businessResponse || 'success' in businessResponse) {
            console.error("[withBusinessServer] No business found for user:", user.id);
            return { redirectTo: "/register" };
        }

        try {
            const subscription = await getActiveSubscription(businessResponse.id);
            if (!subscription || subscription.status !== 'active') {
                console.warn("[withBusinessServer] No active subscription for user:", user.id);
                return { redirectTo: "/register" };
            }
        } catch (error) {
            console.error("[withBusinessServer] Subscription check failed:", error);
        }

        return {
            business: businessResponse,
            userId: user.id,
        };
    } catch (error) {
        console.error("[withBusinessServer] General error:", error);
        return { redirectTo: "/register" };
    }
}
