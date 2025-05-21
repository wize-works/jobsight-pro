import type { NextRequest } from "next/server"
import { getKindeServerClient } from "@/lib/kinde"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Clear auth cookies
    cookies().delete("kinde_access_token")
    cookies().delete("kinde_refresh_token")

    const kindeClient = getKindeServerClient()
    if (!kindeClient) {
      return Response.redirect(`${request.nextUrl.origin}`)
    }

    // Generate logout URL
    const logoutUrl = kindeClient.logout()

    return Response.redirect(logoutUrl)
  } catch (error) {
    console.error("Logout error:", error)
    return Response.redirect(`${request.nextUrl.origin}`)
  }
}
