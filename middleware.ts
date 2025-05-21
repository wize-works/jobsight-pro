import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("kinde_access_token")?.value

  // Check if the user is trying to access a protected route
  if (request.nextUrl.pathname.startsWith("/dashboard") && !accessToken) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
