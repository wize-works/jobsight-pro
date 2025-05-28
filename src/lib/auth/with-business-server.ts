import { redirect } from 'next/navigation'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getUserBusiness } from "@/app/actions/business"
import type { Business } from "@/types/business"

export type WithBusinessResult = {
    business: Business;
    userId: string;
}

export async function withBusinessServer(): Promise<WithBusinessResult> {
    console.log("Starting withBusinessServer check...")
    const kindeSession = await getKindeServerSession()
    const user = await kindeSession.getUser()

    if (!user?.id) {
        console.error("[withBusinessServer] No user ID found")
        redirect('/')
    }

    try {
        console.log("[withBusinessServer] Getting business data for user:", user.id)
        const businessResponse = await getUserBusiness(user.id)

        // Log detailed business response for debugging
        console.log("[withBusinessServer] Business response:", JSON.stringify(businessResponse, null, 2))

        // If the response indicates an authentication error
        if ('success' in businessResponse && !businessResponse.success) {
            console.error("[withBusinessServer] Business auth error:", businessResponse)
            redirect("/")
        }

        // If user has no business, redirect to business setup
        if (!businessResponse || !('id' in businessResponse)) {
            console.error("[withBusinessServer] No business data found for user:", user.id)
            redirect("/dashboard/business")
        }

        console.log("[withBusinessServer] Successfully found business:", businessResponse.id)
        return {
            business: businessResponse,
            userId: user.id
        }
    } catch (error) {
        console.error("[withBusinessServer] Error in business check:", error)
        redirect('/')
    }
}
