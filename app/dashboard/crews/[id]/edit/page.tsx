"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EditCrewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const crewId = Number.parseInt(params.id)

  const [crewData, setCrewData] = useState({
    id: crewId,
    name: "Team Alpha",
    type: "General Construction",
    description:
      "Our primary crew for general construction tasks. Experienced in foundations, framing, and general site work.",
    capacity: 6,
  })

  const [isLoading, setIsLoading] = useState(false)

  // Load the correct crew data based on ID
  useEffect(() => {
    // In a real app, this would be an API call
    console.log(`Loading crew with ID: ${crewId} for editing`)
  }, [crewId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCrewData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number.parseInt(value) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // In a real app, this would be an API call to update the crew
    setTimeout(() => {
      setIsLoading(false)
      // Navigate back to crew detail page
      router.push(`/dashboard/crews/${crewId}`)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Crew</h1>
          <p className="text-base-content/70">Update crew information</p>
        </div>
        <Link href={`/dashboard/crews/${crewId}`} className="btn btn-ghost">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Crew
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Crew Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={crewData.name}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Crew Type</span>
              </label>
              <select
                name="type"
                value={crewData.type}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="General Construction">General Construction</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Excavation">Excavation</option>
                <option value="Finishing">Finishing</option>
                <option value="Roofing">Roofing</option>
                <option value="Masonry">Masonry</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                name="description"
                value={crewData.description}
                onChange={handleChange}
                className="textarea textarea-bordered h-32"
                placeholder="Describe the crew's specialties and experience"
              ></textarea>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Maximum Capacity</span>
              </label>
              <input
                type="number"
                name="capacity"
                min="1"
                max="20"
                value={crewData.capacity}
                onChange={handleChange}
                className="input input-bordered w-full md:w-1/4"
                required
              />
              <label className="label">
                <span className="label-text-alt">Maximum number of members in this crew</span>
              </label>
            </div>

            <div className="form-control mt-8">
              <div className="flex flex-col md:flex-row gap-4 justify-end">
                <Link href={`/dashboard/crews/${crewId}`} className="btn btn-ghost">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? <span className="loading loading-spinner loading-sm"></span> : null}
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
