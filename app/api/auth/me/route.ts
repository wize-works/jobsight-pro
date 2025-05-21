import type { NextRequest } from "next/server"
import { getKindeServerClient } from "@/lib/kinde"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const accessToken = cookies().get("kinde_access_token")?.value

    if (!accessToken) {
      return Response.json({ authenticated: false }, { status: 401 })
    }

    const kindeClient = getKindeServerClient()
    if (!kindeClient) {
      return Response.json({ error: "Kinde not configured" }, { status: 500 })
    }

    // Get user info from Kinde
    const userInfo = await kindeClient.getUserInfo(accessToken)

    if (!userInfo.id) {
      return Response.json({ authenticated: false }, { status: 401 })
    }

    return Response.json(userInfo)
  } catch (error) {
    console.error("Error getting user info:", error)
    return Response.json({ error: "Failed to get user info" }, { status: 500 })
  }
}
