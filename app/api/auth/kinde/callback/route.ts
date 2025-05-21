import type { NextRequest } from "next/server"
import { getKindeServerClient } from "@/lib/kinde"
import { getSupabaseServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  if (!code || !state) {
    return Response.redirect(`${request.nextUrl.origin}/login?error=missing_code_or_state`)
  }

  try {
    const kindeClient = getKindeServerClient()
    if (!kindeClient) {
      return Response.redirect(`${request.nextUrl.origin}/login?error=kinde_not_configured`)
    }

    // Exchange the authorization code for tokens
    const tokens = await kindeClient.getToken(code)

    // Get user info from Kinde
    const userInfo = await kindeClient.getUserInfo(tokens.access_token)

    if (!userInfo.id) {
      return Response.redirect(`${request.nextUrl.origin}/login?error=user_info_missing`)
    }

    // Store tokens in cookies
    cookies().set("kinde_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokens.expires_in,
      path: "/",
    })

    if (tokens.refresh_token) {
      cookies().set("kinde_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      })
    }

    // Check if user exists in our database
    const supabase = getSupabaseServerClient()
    if (!supabase) {
      return Response.redirect(`${request.nextUrl.origin}/login?error=database_not_configured`)
    }

    const { data: existingUser } = await supabase.from("users").select("*").eq("auth_id", userInfo.id).single()

    if (!existingUser) {
      // Create new user in our database
      const newUser = {
        id: uuidv4(),
        auth_id: userInfo.id,
        first_name: userInfo.given_name || "",
        last_name: userInfo.family_name || "",
        email: userInfo.email || "",
        avatar_url: userInfo.picture || "",
        role: "user", // Default role
      }

      const { error: insertError } = await supabase.from("users").insert([newUser])

      if (insertError) {
        console.error("Error creating user:", insertError)
        return Response.redirect(`${request.nextUrl.origin}/login?error=user_creation_failed`)
      }

      // Redirect new users to onboarding
      return Response.redirect(`${request.nextUrl.origin}/onboarding`)
    }

    // Redirect existing users to dashboard
    return Response.redirect(`${request.nextUrl.origin}/dashboard`)
  } catch (error) {
    console.error("Authentication error:", error)
    return Response.redirect(`${request.nextUrl.origin}/login?error=authentication_failed`)
  }
}
