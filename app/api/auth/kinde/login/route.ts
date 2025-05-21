import type { NextRequest } from "next/server"
import { getKindeServerClient } from "@/lib/kinde"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const redirectUri = searchParams.get("redirect_uri")

  try {
    const kindeClient = getKindeServerClient()
    if (!kindeClient) {
      return Response.redirect(`${request.nextUrl.origin}/login?error=kinde_not_configured`)
    }

    // Generate login URL
    const loginUrl = kindeClient.login({
      redirect_uri: redirectUri || undefined,
    })

    return Response.redirect(loginUrl)
  } catch (error) {
    console.error("Login error:", error)
    return Response.redirect(`${request.nextUrl.origin}/login?error=login_failed`)
  }
}
