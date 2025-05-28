import { redirect } from 'next/navigation'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getUserBusiness } from "@/app/actions/business"
import type { Business } from "@/types/business"

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
        const businessResponse = await getUserBusiness(user.id);

        // If the response indicates an authentication error
        if ('success' in businessResponse && !businessResponse.success) {
            console.error("[withBusinessServer] Business auth error:", businessResponse);
            redirect("/");
        }

        // If user has no business, redirect to business setup
        if (!businessResponse || !('id' in businessResponse)) {
            console.error("[withBusinessServer] No business data found for user:", user.id);
            redirect("/dashboard/business");
        }

        return {
            business: businessResponse,
            userId: user.id
        };
    } catch (error) {
        console.error("[withBusinessServer] Error in business check:", error);
        redirect('/');
    }
}
