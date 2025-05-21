"use client"

import type React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"

export default function Login() {
  const { signIn } = useAuth()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    signIn()
  }

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center">
              <img src="/logo-full.png" alt="JobSight" className="h-12" />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-center mb-6">Log In to JobSight</h1>

          {error && (
            <div className="alert alert-error mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {error === "configuration"
                  ? "Authentication configuration error. Please contact support."
                  : error === "user_not_found"
                    ? "User not found. Please try again or create an account."
                    : error === "callback_failed"
                      ? "Authentication failed. Please try again."
                      : "Authentication error. Please try again."}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <button type="submit" className="btn btn-primary w-full">
              Continue with Kinde
            </button>
          </form>

          <div className="divider">OR</div>

          <div className="text-center">
            <p className="mb-4">Don&apos;t have an account?</p>
            <Link href="/register" className="btn btn-outline btn-block">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
