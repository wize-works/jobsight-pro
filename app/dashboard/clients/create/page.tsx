"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function CreateClientPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // In a real app, you would submit the form data to your API
    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/dashboard/clients")
    }, 1500)
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-2xl font-bold">Add New Client</h1>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Company Information</h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Company Name</span>
                    <span className="label-text-alt text-error">Required</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Industry</span>
                  </label>
                  <select className="select select-bordered w-full">
                    <option value="">Select industry</option>
                    <option value="residential">Residential Construction</option>
                    <option value="commercial">Commercial Construction</option>
                    <option value="industrial">Industrial Construction</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="renovation">Renovation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Website</span>
                  </label>
                  <input type="url" placeholder="https://example.com" className="input input-bordered w-full" />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Company Address</span>
                  </label>
                  <textarea className="textarea textarea-bordered h-24" placeholder="Enter full address"></textarea>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Company Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Brief description of the company"
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Client Status</span>
                  </label>
                  <select className="select select-bordered w-full" defaultValue="active">
                    <option value="active">Active</option>
                    <option value="potential">Potential</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Primary Contact</h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Contact Name</span>
                    <span className="label-text-alt text-error">Required</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter contact name"
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Job Title</span>
                  </label>
                  <input type="text" placeholder="Enter job title" className="input input-bordered w-full" />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                    <span className="label-text-alt text-error">Required</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone Number</span>
                  </label>
                  <input type="tel" placeholder="Enter phone number" className="input input-bordered w-full" />
                </div>

                <h2 className="text-xl font-semibold mt-8">Additional Information</h2>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Referral Source</span>
                  </label>
                  <select className="select select-bordered w-full">
                    <option value="">Select referral source</option>
                    <option value="website">Website</option>
                    <option value="existing_client">Existing Client</option>
                    <option value="social_media">Social Media</option>
                    <option value="search_engine">Search Engine</option>
                    <option value="trade_show">Trade Show</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Notes</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Additional notes about this client"
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox checkbox-primary" />
                    <span className="label-text">Send welcome email to client</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox checkbox-primary" />
                    <span className="label-text">Create client portal access</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="flex justify-end gap-2 mt-6">
              <Link href="/dashboard/clients" className="btn btn-ghost">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save Client
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
