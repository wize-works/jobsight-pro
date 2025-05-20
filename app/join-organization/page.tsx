"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import Link from "next/link"

export default function JoinOrganization() {
  const router = useRouter()
  const { user } = useKindeBrowserClient()
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleJoin = () => {
    if (!inviteCode) return

    setIsLoading(true)
    setError("")

    // In a real app, you would validate the invite code against your database
    setTimeout(() => {
      setIsLoading(false)

      // For demo purposes, we'll accept any code that starts with "JOB"
      if (inviteCode.startsWith("JOB")) {
        router.push("/dashboard")
      } else {
        setError("Invalid invite code. Please check and try again.")
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <Link href="/" className="flex items-center justify-center mb-6">
            <i className="fas fa-hard-hat text-primary text-3xl mr-2"></i>
            <h1 className="text-2xl font-bold">JobSight</h1>
          </Link>

          <h2 className="card-title text-2xl mb-6 text-center">Join an Organization</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Invitation Code</span>
            </label>
            <input
              type="text"
              placeholder="Enter your invitation code"
              className="input input-bordered"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            {error && <p className="text-error text-sm mt-1">{error}</p>}
          </div>

          <div className="form-control mt-6">
            <button
              className={`btn btn-primary ${isLoading ? "loading" : ""}`}
              onClick={handleJoin}
              disabled={!inviteCode || isLoading}
            >
              {isLoading ? "Joining..." : "Join Organization"}
            </button>
          </div>

          <p className="text-center mt-6">
            Need to create a new organization?{" "}
            <Link href="/onboarding" className="link link-primary">
              Create here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
