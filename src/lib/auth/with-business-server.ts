
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

        // If user has no business, handle based on context
        if (!businessResponse || !('id' in businessResponse)) {
            if (allowRegistration) {
                // For registration flows, allow the process to continue
                console.log("[withBusinessServer] User in registration flow, no business yet");
                throw new Error("User has no business - in registration flow");
            } else {
                // For dashboard/protected routes, redirect to business setup
                console.error("[withBusinessServer] No business data found for user:", user.id);
                redirect("/register");
            }
        }

        return {
            business: businessResponse,
            userId: user.id
        };
    } catch (error) {
        if (allowRegistration) {
            // Re-throw the error for registration flows to handle
            throw error;
        }
        console.error("[withBusinessServer] Error in business check:", error);
        redirect('/register');
    }
}
