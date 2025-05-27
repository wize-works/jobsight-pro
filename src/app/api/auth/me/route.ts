import type { NextRequest } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
    try {
        const kindeClient = getKindeServerSession()
        const supabase = createServerClient()

        if (!kindeClient || !supabase) {
            return Response.json({ error: "Configuration error" }, { status: 500 })
        }

        // Get the user from Kinde
        const kindeUser = await kindeClient.getUser()

        if (!kindeUser || !kindeUser.id) {
            return Response.json({ authenticated: false }, { status: 401 })
        }

        // Get the user from our database
        const { data: dbUser, error } = await supabase.from("users").select("*").eq("auth_id", kindeUser.id).single()

        if (error) {
            console.error("Error fetching user from database:", error)
            // If the user doesn't exist in our database, return the Kinde user
            // The client will handle creating the user in our database
            return Response.json({
                id: kindeUser.id,
                given_name: kindeUser.given_name,
                family_name: kindeUser.family_name,
                email: kindeUser.email,
                picture: kindeUser.picture,
            })
        }

        // Return a combined user object with both Kinde and database information
        return Response.json({
            id: kindeUser.id, // Kinde ID
            given_name: kindeUser.given_name,
            family_name: kindeUser.family_name,
            email: kindeUser.email,
            picture: kindeUser.picture,
            db_id: dbUser.id, // Our database UUID
            business_id: dbUser.business_id,
            role: dbUser.role,
        })
    } catch (error) {
        console.error("Error getting user info:", error)
        return Response.json({ error: "Failed to get user info" }, { status: 500 })
    }
}
