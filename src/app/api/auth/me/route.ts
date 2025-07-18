import type { NextRequest } from "next/server"
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return Response.json({ success: false, authenticated: false }, { status: 401 })
        }

        const supabase = createServerClient()
        if (!supabase) {
            return Response.json({ success: false, error: "Configuration error" }, { status: 500 })
        }

        // Get user info from Clerk
        const clerkUser = await currentUser()

        if (!clerkUser) {
            return Response.json({ success: false, authenticated: false }, { status: 401 })
        }

        // Get the user from our database
        const { data: dbUser, error } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", userId)
            .single()

        if (error) {
            console.error("Error fetching user from database:", error)
            // Return Clerk user data for new users
            return Response.json({
                success: true,
                id: userId,
                given_name: clerkUser.firstName,
                family_name: clerkUser.lastName,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                picture: clerkUser.imageUrl,
            }, { status: 200 })
        }

        // Return combined user object
        return Response.json({
            success: true,
            id: userId,
            given_name: clerkUser.firstName,
            family_name: clerkUser.lastName,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            picture: clerkUser.imageUrl,
            db_id: dbUser.id,
            business_id: dbUser.business_id,
            role: dbUser.role,
        }, { status: 200 })
    } catch (error) {
        console.error("Error getting user info:", error)
        return Response.json({ success: false, error: "Failed to get user info" }, { status: 500 })
    }
}
