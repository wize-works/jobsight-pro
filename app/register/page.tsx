"use client"

import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function Register() {
  const { signUp, isSignedIn } = useAuth()
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

      <div className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-8">Create Your JobSight Account</h1>

          {error && (
            <div className="alert alert-error mb-4">
              <span>Registration error: {error.replace(/_/g, " ")}</span>
            </div>
          )}

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">1. Choose your plan</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card cursor-pointer border-2 border-primary">
                  <div className="card-body p-4">
                    <h3 className="font-bold text-lg">Starter</h3>
                    <p className="text-xl">
                      $9.99
                      <span className="text-sm text-base-content/70">/mo</span>
                    </p>
                    <p className="text-sm">1 user included</p>
                  </div>
                </div>

                <div className="card cursor-pointer border-2 border-base-300">
                  <div className="card-body p-4">
                    <h3 className="font-bold text-lg">Pro</h3>
                    <p className="text-xl">
                      $49
                      <span className="text-sm text-base-content/70">/mo</span>
                    </p>
                    <p className="text-sm">10 users included</p>
                  </div>
                </div>

                <div className="card cursor-pointer border-2 border-base-300">
                  <div className="card-body p-4">
                    <h3 className="font-bold text-lg">Business</h3>
                    <p className="text-xl">
                      $149
                      <span className="text-sm text-base-content/70">/mo</span>
                    </p>
                    <p className="text-sm">50 users included</p>
                  </div>
                </div>

                <div className="card cursor-pointer border-2 border-base-300">
                  <div className="card-body p-4">
                    <h3 className="font-bold text-lg">Enterprise</h3>
                    <p className="text-xl">
                      $500
                      <span className="text-sm text-base-content/70">/mo</span>
                    </p>
                    <p className="text-sm">Unlimited users</p>
                  </div>
                </div>
              </div>

              <h2 className="card-title text-xl mb-4">2. Create your account</h2>

              <div className="form-control mt-6">
                <button onClick={signUp} className="btn btn-primary">
                  Sign Up with Kinde
                </button>
              </div>

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

              <p className="text-center mt-6">
                Already have an account?{" "}
                <Link href="/login" className="link link-primary">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
