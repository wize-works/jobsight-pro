import { KindeServerClient } from "@kinde-oss/sdk-server-nextjs"
import { cookies } from "next/headers"

export function getKindeServerClient() {
  const cookieStore = cookies()

  if (!process.env.KINDE_DOMAIN || !process.env.KINDE_CLIENT_ID || !process.env.KINDE_CLIENT_SECRET) {
    console.error("Missing Kinde environment variables")
    return null
  }

  return new KindeServerClient({
    domain: process.env.KINDE_DOMAIN,
    clientId: process.env.KINDE_CLIENT_ID,
    clientSecret: process.env.KINDE_CLIENT_SECRET,
    redirectURL: process.env.KINDE_REDIRECT_URI || "http://localhost:3000/api/auth/kinde/callback",
    logoutRedirectURL: process.env.KINDE_LOGOUT_REDIRECT_URI || "http://localhost:3000",
    cookieStore,
  })
}
