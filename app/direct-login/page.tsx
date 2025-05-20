"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DirectLogin() {
  const router = useRouter()

  useEffect(() => {
    // Set the auth cookie directly
    document.cookie = "auth_session=mock_session_token; path=/; max-age=604800; SameSite=Lax"

    // Wait a moment to ensure the cookie is set
    setTimeout(() => {
      // Redirect to dashboard
      router.push("/dashboard")
    }, 1000)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <h1 className="text-2xl font-bold mb-4">Logging you in...</h1>
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
          <p className="mt-4">Setting authentication cookie and redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  )
}
