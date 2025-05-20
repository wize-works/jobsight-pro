"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function TestAuthPage() {
  const router = useRouter()
  const [authCookie, setAuthCookie] = useState<string | null>(null)

  useEffect(() => {
    // Check for auth cookie on client side
    const cookies = document.cookie.split(";")
    const authCookieStr = cookies.find((cookie) => cookie.trim().startsWith("auth_session="))
    setAuthCookie(authCookieStr ? authCookieStr.split("=")[1] : null)
  }, [])

  const setAuthCookieHandler = () => {
    document.cookie = "auth_session=mock_session_token; path=/; max-age=604800; SameSite=Lax"
    setAuthCookie("mock_session_token")
    router.refresh()
  }

  const clearAuthCookieHandler = () => {
    document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    setAuthCookie(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>

          <div className="bg-base-200 p-4 rounded-lg mb-4">
            <h2 className="font-bold">Auth Cookie Status:</h2>
            {authCookie ? (
              <div className="text-success">
                <p>✅ Auth cookie is present</p>
                <p>Value: {authCookie}</p>
              </div>
            ) : (
              <p className="text-error">❌ No auth cookie found</p>
            )}
          </div>

          <div className="space-y-4">
            <button onClick={setAuthCookieHandler} className="btn btn-primary w-full">
              Set Auth Cookie (Login)
            </button>

            <button onClick={clearAuthCookieHandler} className="btn btn-outline w-full">
              Clear Auth Cookie (Logout)
            </button>

            <Link href="/dashboard" className="btn btn-secondary w-full">
              Try Dashboard Access
            </Link>

            <Link href="/" className="btn btn-ghost w-full">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
