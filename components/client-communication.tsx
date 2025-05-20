"use client"

import type React from "react"

import { useState } from "react"

interface Communication {
  id: string
  type: string
  date: string
  subject: string
  summary: string
  contact: string
}

interface ClientCommunicationProps {
  clientId: string
  communications: Communication[]
}

export default function ClientCommunication({ clientId, communications }: ClientCommunicationProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [communicationType, setCommunicationType] = useState("Email")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // In a real app, you would submit the form data to your API
    setTimeout(() => {
      setIsSubmitting(false)
      setShowAddForm(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Communication History</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <i className="fas fa-plus mr-2"></i>
          Log Communication
        </button>
      </div>

      {showAddForm && (
        <div className="card bg-base-200 shadow-sm mb-6">
          <div className="card-body">
            <h3 className="font-semibold mb-4">Log New Communication</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Communication Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={communicationType}
                    onChange={(e) => setCommunicationType(e.target.value)}
                  >
                    <option value="Email">Email</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Video Call">Video Call</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Subject</span>
                  </label>
                  <input type="text" placeholder="Enter subject" className="input input-bordered w-full" />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Contact Person</span>
                  </label>
                  <input type="text" placeholder="Enter contact name" className="input input-bordered w-full" />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Summary</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Enter communication summary"
                  ></textarea>
                </div>

                {communicationType === "Email" && (
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text">Attach Email</span>
                    </label>
                    <input type="file" className="file-input file-input-bordered w-full" />
                  </div>
                )}

                {communicationType === "Meeting" && (
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text">Meeting Notes</span>
                    </label>
                    <textarea className="textarea textarea-bordered h-24" placeholder="Enter meeting notes"></textarea>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Communication"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Contact</th>
              <th>Summary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {communications.map((comm) => (
              <tr key={comm.id}>
                <td>{new Date(comm.date).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`badge ${
                      comm.type === "Email"
                        ? "badge-info"
                        : comm.type === "Meeting"
                          ? "badge-success"
                          : comm.type === "Phone Call"
                            ? "badge-warning"
                            : "badge-ghost"
                    }`}
                  >
                    {comm.type}
                  </span>
                </td>
                <td>{comm.subject}</td>
                <td>{comm.contact}</td>
                <td>
                  <span className="line-clamp-1">{comm.summary}</span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-ghost btn-square">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn btn-sm btn-ghost btn-square">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn btn-sm btn-ghost btn-square text-error">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {communications.length === 0 && (
        <div className="text-center py-4">
          <p className="text-base-content/70">No communication history found.</p>
          <button className="btn btn-primary mt-2" onClick={() => setShowAddForm(true)}>
            <i className="fas fa-plus mr-2"></i>
            Log First Communication
          </button>
        </div>
      )}
    </div>
  )
}
