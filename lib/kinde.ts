import { KindeSDK } from "@kinde-oss/sdk"

// Initialize the Kinde SDK
export const getKindeServerClient = () => {
  const KINDE_DOMAIN = process.env.KINDE_DOMAIN || ""
  const KINDE_CLIENT_ID = process.env.KINDE_CLIENT_ID || ""
  const KINDE_CLIENT_SECRET = process.env.KINDE_CLIENT_SECRET || ""
  const KINDE_REDIRECT_URI = process.env.KINDE_REDIRECT_URI || "http://localhost:3000/api/auth/kinde/callback"
  const KINDE_LOGOUT_REDIRECT_URI = process.env.KINDE_LOGOUT_REDIRECT_URI || "http://localhost:3000"

  if (!KINDE_DOMAIN || !KINDE_CLIENT_ID || !KINDE_CLIENT_SECRET) {
    console.warn("Kinde environment variables are not set")
    return null
  }

  return new KindeSDK({
    domain: KINDE_DOMAIN,
    clientId: KINDE_CLIENT_ID,
    clientSecret: KINDE_CLIENT_SECRET,
    redirectUri: KINDE_REDIRECT_URI,
    logoutRedirectUri: KINDE_LOGOUT_REDIRECT_URI,
  })
}
