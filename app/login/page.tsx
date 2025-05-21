"use client"

import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function Login() {
  const { signIn, isSignedIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  useEffect(() => {
    // If user is already signed in, redirect to dashboard
    if (isSignedIn) {
      router.push("/dashboard")
    }
  }, [isSignedIn, router])

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold text-center justify-center mb-6">Log in to JobSight</h2>

            {error && (
              <div className="alert alert-error mb-4">
                <span>Authentication error: {error.replace(/_/g, " ")}</span>
              </div>
            )}

            <div className="space-y-4">
              <button onClick={signIn} className="btn btn-primary btn-block">
                Log in with Kinde
              </button>

              <div className="divider">OR</div>

              <div className="space-y-3">
                <button className="btn btn-outline btn-block">
                  <i className="fab fa-google mr-2"></i> Continue with Google
                </button>
                <button className="btn btn-outline btn-block">
                  <i className="fab fa-apple mr-2"></i> Continue with Apple
                </button>
                <button className="btn btn-outline btn-block">
                  <i className="fab fa-facebook mr-2"></i> Continue with Facebook
                </button>
              </div>
            </div>

            <p className="text-center mt-6">
              Don't have an account?{" "}
              <Link href="/register" className="link link-primary">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
