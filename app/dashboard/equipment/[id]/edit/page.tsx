"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EditEquipmentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const equipmentId = Number.parseInt(params.id)

  const [equipmentData, setEquipmentData] = useState({
    id: equipmentId,
    name: "Excavator #EX-101",
    type: "Heavy Equipment",
    model: "CAT 320",
    manufacturer: "Caterpillar",
    serialNumber: "EX101-2023-05678",
    purchaseDate: "2023-05-10",
    notes: "Regular maintenance required every 2 months",
  })

  const [isLoading, setIsLoading] = useState(false)

  // Load the correct equipment data based on ID
  useEffect(() => {
    // In a real app, this would be an API call
    console.log(`Loading equipment with ID: ${equipmentId} for editing`)
  }, [equipmentId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEquipmentData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // In a real app, this would be an API call to update the equipment
    setTimeout(() => {
      setIsLoading(false)
      // Navigate back to equipment detail page
      router.push(`/dashboard/equipment/${equipmentId}`)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Equipment</h1>
          <p className="text-base-content/70">Update equipment information</p>
        </div>
        <Link href={`/dashboard/equipment/${equipmentId}`} className="btn btn-ghost">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Equipment
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Equipment Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={equipmentData.name}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Equipment Type</span>
              </label>
              <select
                name="type"
                value={equipmentData.type}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="Heavy Equipment">Heavy Equipment</option>
                <option value="Power Equipment">Power Equipment</option>
                <option value="Power Tools">Power Tools</option>
                <option value="Hand Tools">Hand Tools</option>
                <option value="Safety Equipment">Safety Equipment</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Manufacturer</span>
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={equipmentData.manufacturer}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Model</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={equipmentData.model}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Serial Number</span>
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={equipmentData.serialNumber}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Purchase Date</span>
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={equipmentData.purchaseDate}
                  onChange={handleChange}
                  className="input input-bordered"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Notes</span>
              </label>
              <textarea
                name="notes"
                value={equipmentData.notes}
                onChange={handleChange}
                className="textarea textarea-bordered h-32"
                placeholder="Additional information about this equipment"
              ></textarea>
            </div>

            <div className="form-control mt-8">
              <div className="flex flex-col md:flex-row gap-4 justify-end">
                <Link href={`/dashboard/equipment/${equipmentId}`} className="btn btn-ghost">
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
