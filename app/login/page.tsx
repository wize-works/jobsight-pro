"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Login() {
  const router = useRouter()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async () => {
    setIsLoggingIn(true)

    try {
      // Set a client-side cookie
      document.cookie = "auth_session=mock_session_token; path=/; max-age=604800; SameSite=Lax"

      // Force a refresh to ensure the cookie is recognized
      router.refresh()

      // Navigate to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <Link href="/" className="flex items-center justify-center mb-6">
            <i className="fas fa-hard-hat text-primary text-3xl mr-2"></i>
            <h1 className="text-2xl font-bold">JobSight</h1>
          </Link>

          <h2 className="card-title text-2xl mb-6 text-center">Log in to your account</h2>

          <div className="alert alert-info mb-6">
            <i className="fas fa-info-circle"></i>
            <span>This is a mock authentication system for preview purposes. Click any login option to proceed.</span>
          </div>

          <div className="form-control mt-6">
            <button className="btn btn-primary w-full" onClick={handleLogin} disabled={isLoggingIn}>
              {isLoggingIn ? "Logging in..." : "Login with Kinde"}
            </button>
          </div>

          <div className="divider">OR</div>

          <div className="space-y-3">
            <button onClick={handleLogin} className="btn btn-outline w-full">
              <i className="fab fa-google mr-2"></i> Continue with Google
            </button>

            <button onClick={handleLogin} className="btn btn-outline w-full">
              <i className="fab fa-apple mr-2"></i> Continue with Apple
            </button>

            <button onClick={handleLogin} className="btn btn-outline w-full">
              <i className="fab fa-facebook mr-2"></i> Continue with Facebook
            </button>
          </div>

          <p className="text-center mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="link link-primary">
              Sign up
            </Link>
          </p>

          <div className="mt-4">
            <Link href="/test-auth" className="link link-secondary text-sm">
              Test Authentication Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
