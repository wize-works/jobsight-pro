import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("Register API route called")

  // Set a mock auth cookie
  cookies().set({
    name: "auth_session",
    value: "mock_session_token",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })

  console.log("Auth cookie set in register route")

  // Redirect to onboarding
  return NextResponse.redirect(new URL("/onboarding", request.url))
}
