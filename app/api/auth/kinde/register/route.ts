import type { NextRequest } from "next/server"
import { getKindeServerClient } from "@/lib/kinde"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const redirectUri = searchParams.get("redirect_uri")

  try {
    const kindeClient = getKindeServerClient()
    if (!kindeClient) {
      return Response.redirect(`${request.nextUrl.origin}/register?error=kinde_not_configured`)
    }

    // Generate register URL
    const registerUrl = kindeClient.register({
      redirect_uri: redirectUri || undefined,
    })

    return Response.redirect(registerUrl)
  } catch (error) {
    console.error("Register error:", error)
    return Response.redirect(`${request.nextUrl.origin}/register?error=register_failed`)
  }
}
