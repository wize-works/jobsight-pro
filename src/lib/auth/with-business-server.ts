import { redirect } from 'next/navigation'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getUserBusiness } from "@/app/actions/business"
import type { Business } from "@/types/business"

export type WithBusinessResult = {
    business: Business;
    userId: string;
}

export async function withBusinessServer(): Promise<WithBusinessResult> {
    const kindeSession = await getKindeServerSession()
    const user = await kindeSession.getUser()

    if (!user?.id) {
        redirect('/')
    }

    const businessResponse = await getUserBusiness(user.id)

    // If the response indicates an authentication error
    if ('success' in businessResponse && !businessResponse.success) {
        redirect("/")
    }

    // If user has no business, redirect to business setup
    if (!businessResponse || !('id' in businessResponse)) {
        redirect("/dashboard/business")
    }

    return {
        business: businessResponse,
        userId: user.id
    }
}
