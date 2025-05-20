"use client"

import type React from "react"

import { useState } from "react"

interface Contract {
  id: string
  name: string
  type: string
  date: string
  expiryDate: string
  value: number
  status: string
  signed: boolean
}

interface ClientContractsProps {
  clientId: string
  contracts: Contract[]
}

export default function ClientContracts({ clientId, contracts }: ClientContractsProps) {
  const [showAddForm, setShowAddForm] = useState(false)
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
        <h2 className="text-xl font-semibold">Contracts & Agreements</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <i className="fas fa-plus mr-2"></i>
          Add Contract
        </button>
      </div>

      {showAddForm && (
        <div className="card bg-base-200 shadow-sm mb-6">
          <div className="card-body">
            <h3 className="font-semibold mb-4">Add New Contract</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Contract Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter contract name"
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Contract Type</span>
                  </label>
                  <select className="select select-bordered w-full">
                    <option value="master">Master Service Agreement</option>
                    <option value="project">Project Contract</option>
                    <option value="maintenance">Maintenance Agreement</option>
                    <option value="nda">Non-Disclosure Agreement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Expiry Date</span>
                  </label>
                  <input type="date" className="input input-bordered w-full" />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Contract Value</span>
                  </label>
                  <div className="input-group">
                    <span>$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input input-bordered w-full"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select className="select select-bordered w-full">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="signed">Signed</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Upload Contract Document</span>
                  </label>
                  <input type="file" className="file-input file-input-bordered w-full" />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Notes</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Enter notes about this contract"
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox checkbox-primary" />
                    <span className="label-text">Send for electronic signature</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox checkbox-primary" />
                    <span className="label-text">Set renewal reminder</span>
                  </label>
                </div>
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
                    "Save Contract"
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
              <th>Contract Name</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
              <th>Value</th>
              <th>Status</th>
              <th>Signed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr key={contract.id}>
                <td className="font-medium">{contract.name}</td>
                <td>
                  <span
                    className={`badge ${
                      contract.type === "Master Service Agreement"
                        ? "badge-primary"
                        : contract.type === "Project Contract"
                          ? "badge-secondary"
                          : "badge-ghost"
                    }`}
                  >
                    {contract.type}
                  </span>
                </td>
                <td>{new Date(contract.date).toLocaleDateString()}</td>
                <td>{new Date(contract.expiryDate).toLocaleDateString()}</td>
                <td>${contract.value.toLocaleString()}</td>
                <td>
                  <span
                    className={`badge ${
                      contract.status === "Active"
                        ? "badge-success"
                        : contract.status === "Draft"
                          ? "badge-warning"
                          : contract.status === "Expired"
                            ? "badge-error"
                            : "badge-ghost"
                    }`}
                  >
                    {contract.status}
                  </span>
                </td>
                <td>
                  {contract.signed ? (
                    <i className="fas fa-check text-success"></i>
                  ) : (
                    <i className="fas fa-times text-error"></i>
                  )}
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-ghost btn-square">
                      <i className="fas fa-download"></i>
                    </button>
                    <button className="btn btn-sm btn-ghost btn-square">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn btn-sm btn-ghost btn-square">
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contracts.length === 0 && (
        <div className="text-center py-4">
          <p className="text-base-content/70">No contracts found for this client.</p>
          <button className="btn btn-primary mt-2" onClick={() => setShowAddForm(true)}>
            <i className="fas fa-plus mr-2"></i>
            Add First Contract
          </button>
        </div>
      )}
    </div>
  )
}
