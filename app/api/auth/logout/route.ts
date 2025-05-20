import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("Logout API route called")

  // Clear the auth cookie
  cookies().delete("auth_session")

  console.log("Auth cookie deleted in logout route")

  // Redirect to home page
  return NextResponse.redirect(new URL("/", request.url))
}
