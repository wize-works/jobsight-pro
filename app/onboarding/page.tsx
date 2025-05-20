"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import Link from "next/link"

export default function Onboarding() {
  const router = useRouter()
  const { user } = useKindeBrowserClient()
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")

  const handleContinue = () => {
    if (step === 1 && businessName && businessType) {
      setStep(2)
    } else if (step === 2 && selectedPlan) {
      // In a real app, you would save this data to your database
      // and potentially redirect to Stripe for payment
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <Link href="/" className="flex items-center justify-center mb-6">
            <i className="fas fa-hard-hat text-primary text-3xl mr-2"></i>
            <h1 className="text-2xl font-bold">JobSight</h1>
          </Link>

          <div className="flex justify-center mb-8">
            <ul className="steps steps-horizontal w-full">
              <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Business Info</li>
              <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Choose Plan</li>
              <li className={`step ${step >= 3 ? "step-primary" : ""}`}>Complete</li>
            </ul>
          </div>

          {step === 1 && (
            <>
              <h2 className="card-title text-2xl mb-6 text-center">Tell us about your business</h2>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Business Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your business name"
                  className="input input-bordered"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Business Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  <option value="" disabled>
                    Select business type
                  </option>
                  <option value="construction">Construction</option>
                  <option value="electrical">Electrical</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="hvac">HVAC</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="card-title text-2xl mb-6 text-center">Choose your plan</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`card bg-base-200 cursor-pointer hover:shadow-md transition-shadow ${selectedPlan === "tier1" ? "border-2 border-primary" : ""}`}
                  onClick={() => setSelectedPlan("tier1")}
                >
                  <div className="card-body p-4">
                    <h3 className="card-title text-lg">Tier 1</h3>
                    <p className="text-2xl font-bold">
                      $49<span className="text-sm font-normal">/mo</span>
                    </p>
                    <p className="text-xs">Up to 5 users</p>
                    <p className="text-xs">10 active projects</p>
                  </div>
                </div>

                <div
                  className={`card bg-base-200 cursor-pointer hover:shadow-md transition-shadow ${selectedPlan === "tier2" ? "border-2 border-primary" : ""}`}
                  onClick={() => setSelectedPlan("tier2")}
                >
                  <div className="card-body p-4">
                    <div className="badge badge-primary mb-1">Popular</div>
                    <h3 className="card-title text-lg">Tier 2</h3>
                    <p className="text-2xl font-bold">
                      $99<span className="text-sm font-normal">/mo</span>
                    </p>
                    <p className="text-xs">Up to 15 users</p>
                    <p className="text-xs">Unlimited projects</p>
                  </div>
                </div>

                <div
                  className={`card bg-base-200 cursor-pointer hover:shadow-md transition-shadow ${selectedPlan === "tier3" ? "border-2 border-primary" : ""}`}
                  onClick={() => setSelectedPlan("tier3")}
                >
                  <div className="card-body p-4">
                    <h3 className="card-title text-lg">Tier 3</h3>
                    <p className="text-2xl font-bold">
                      $199<span className="text-sm font-normal">/mo</span>
                    </p>
                    <p className="text-xs">Unlimited users</p>
                    <p className="text-xs">Unlimited projects</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm">All plans include a 14-day free trial. No credit card required.</p>
              </div>
            </>
          )}

          <div className="form-control mt-6">
            <button
              className="btn btn-primary"
              onClick={handleContinue}
              disabled={(step === 1 && (!businessName || !businessType)) || (step === 2 && !selectedPlan)}
            >
              {step === 1 ? "Continue" : "Start Free Trial"}
            </button>
          </div>

          {step === 1 && (
            <p className="text-center mt-4 text-sm">
              Already have an organization?{" "}
              <Link href="/join-organization" className="link link-primary">
                Join here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
