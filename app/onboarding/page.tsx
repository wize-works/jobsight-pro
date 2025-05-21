"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { createBusiness } from "./actions"
import { toast } from "sonner"

export default function Onboarding() {
  const { user, isLoaded, signIn } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "General Contractor",
    phoneNumber: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      signIn()
    }
  }, [isLoaded, user, signIn])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step < 3) {
      setStep(step + 1)
      return
    }

    if (!user) {
      toast.error("You must be logged in to complete onboarding")
      signIn()
      return
    }

    setIsSubmitting(true)

    try {
      await createBusiness({
        userId: user.id, // This is our database UUID
        businessName: formData.businessName,
        businessType: formData.businessType,
        phoneNumber: formData.phoneNumber,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      })

      toast.success("Business profile created successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating business:", error)
      toast.error("Failed to create business profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    if (!user) {
      toast.error("You must be logged in to complete onboarding")
      signIn()
      return
    }

    setIsSubmitting(true)

    try {
      // Create a default business using the user's first name
      const defaultBusinessName = `${user.firstName}'s Company`

      await createBusiness({
        userId: user.id, // This is our database UUID
        businessName: defaultBusinessName,
        businessType: "General Contractor", // Default type
        phoneNumber: "",
        website: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
        email: user.email, // Use the user's email as the business email
      })

      toast.success("Quick setup completed! You can update your business details later.")
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating default business:", error)
      toast.error("Failed to complete setup. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Authentication Required</h2>
            <p>You need to be logged in to access this page.</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary" onClick={signIn}>
                Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-3xl">
        <div className="card-body">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center">
              <img src="/logo-full.png" alt="JobSight" className="h-12" />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h1>

          <ul className="steps steps-horizontal w-full mb-8">
            <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Business Info</li>
            <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Address</li>
            <li className={`step ${step >= 3 ? "step-primary" : ""}`}>Preferences</li>
          </ul>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Business Information</h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Business Name</span>
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Business Type</span>
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    required
                  >
                    <option>General Contractor</option>
                    <option>Specialty Contractor</option>
                    <option>Home Builder</option>
                    <option>Remodeler</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Website (Optional)</span>
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="input input-bordered"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Business Address</h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Street Address</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">City</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">State/Province</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Zip/Postal Code</span>
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Country</span>
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="select select-bordered w-full"
                    required
                  >
                    <option>United States</option>
                    <option>Canada</option>
                    <option>Mexico</option>
                    <option>United Kingdom</option>
                    <option>Australia</option>
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Preferences</h2>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Enable email notifications</span>
                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Enable mobile push notifications</span>
                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Share anonymous usage data to help improve JobSight</span>
                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Subscribe to newsletter</span>
                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)}>
                  Back
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex gap-2">
                <button type="button" className="btn btn-outline" onClick={handleSkip} disabled={isSubmitting}>
                  {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Skip for now"}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : step < 3 ? (
                    "Next"
                  ) : (
                    "Complete Setup"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
