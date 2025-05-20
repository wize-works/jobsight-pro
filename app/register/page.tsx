"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Register() {
  const router = useRouter()
  const [isRegistering, setIsRegistering] = useState(false)

  const handleRegister = async () => {
    setIsRegistering(true)

    try {
      // Set a client-side cookie
      document.cookie = "auth_session=mock_session_token; path=/; max-age=604800; SameSite=Lax"

      // Force a refresh to ensure the cookie is recognized
      router.refresh()

      // Navigate to onboarding
      router.push("/onboarding")
    } catch (error) {
      console.error("Registration error:", error)
      setIsRegistering(false)
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

          <h2 className="card-title text-2xl mb-6 text-center">Create your account</h2>

          <div className="alert alert-info mb-6">
            <i className="fas fa-info-circle"></i>
            <span>This is a mock registration system for preview purposes. Click any option to proceed.</span>
          </div>

          <div className="form-control mt-6">
            <button className="btn btn-primary w-full" onClick={handleRegister} disabled={isRegistering}>
              {isRegistering ? "Creating account..." : "Sign up with Kinde"}
            </button>
          </div>

          <div className="divider">OR</div>

          <div className="space-y-3">
            <button onClick={handleRegister} className="btn btn-outline w-full">
              <i className="fab fa-google mr-2"></i> Continue with Google
            </button>

            <button onClick={handleRegister} className="btn btn-outline w-full">
              <i className="fab fa-apple mr-2"></i> Continue with Apple
            </button>

            <button onClick={handleRegister} className="btn btn-outline w-full">
              <i className="fab fa-facebook mr-2"></i> Continue with Facebook
            </button>
          </div>

          <p className="text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="link link-primary">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
