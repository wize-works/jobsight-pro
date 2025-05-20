import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Make sure we're exporting the correct handler function
export async function GET(request: NextRequest) {
  console.log("Login API route called")

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

  console.log("Auth cookie set in login route")

  // Redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard", request.url))
}
