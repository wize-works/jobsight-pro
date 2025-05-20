"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const equipmentId = Number.parseInt(params.id)

  const [equipment, setEquipment] = useState({
    id: equipmentId,
    name: "Excavator #EX-101",
    type: "Heavy Equipment",
    status: "In Use",
    assignedTo: "Riverside Apartments",
    location: "123 Riverside Dr",
    lastMaintenance: "2025-04-15",
    nextMaintenance: "2025-06-15",
    purchaseDate: "2023-05-10",
    serialNumber: "EX101-2023-05678",
    model: "CAT 320",
    manufacturer: "Caterpillar",
    notes: "Regular maintenance required every 2 months",
    maintenanceHistory: [
      {
        id: 1,
        date: "2025-04-15",
        type: "Routine",
        description: "Oil change, filter replacement, and general inspection",
        technician: "Mike Johnson",
        cost: 450,
      },
      {
        id: 2,
        date: "2025-02-10",
        type: "Repair",
        description: "Hydraulic system repair - replaced damaged hoses and fittings",
        technician: "Sarah Williams",
        cost: 1200,
      },
      {
        id: 3,
        date: "2024-12-05",
        type: "Routine",
        description: "Oil change, filter replacement, and general inspection",
        technician: "Mike Johnson",
        cost: 450,
      },
    ],
    documents: [
      {
        id: 1,
        name: "Warranty Information",
        type: "PDF",
        uploadDate: "2023-05-10",
      },
      {
        id: 2,
        name: "User Manual",
        type: "PDF",
        uploadDate: "2023-05-10",
      },
      {
        id: 3,
        name: "Service Records",
        type: "PDF",
        uploadDate: "2025-04-15",
      },
    ],
  })

  const [activeTab, setActiveTab] = useState("overview")
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(equipment.status)

  const [availableProjects, setAvailableProjects] = useState([
    { id: 1, name: "Riverside Apartments", location: "123 Riverside Dr" },
    { id: 2, name: "Downtown Office Tower", location: "456 Main St" },
    { id: 3, name: "Hillside Villas", location: "789 Hill Rd" },
    { id: 4, name: "Community Center", location: "101 Community Blvd" },
    { id: 5, name: "Parkview Residences", location: "202 Park Ave" },
  ])

  const [availableCrews, setAvailableCrews] = useState([
    { id: 1, name: "Team Alpha", type: "General Construction" },
    { id: 2, name: "Team Bravo", type: "Electrical" },
    { id: 3, name: "Team Charlie", type: "Plumbing" },
    { id: 4, name: "Team Delta", type: "Finishing" },
  ])

  const [assignmentType, setAssignmentType] = useState("project")
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null)

  const [newMaintenance, setNewMaintenance] = useState({
    date: "",
    type: "Routine",
    description: "",
    technician: "",
    cost: "",
  })

  // Load the correct equipment data based on ID
  useEffect(() => {
    // In a real app, this would be an API call
    console.log(`Loading equipment with ID: ${equipmentId}`)
  }, [equipmentId])

  const handleAssign = () => {
    if (selectedAssignment !== null) {
      let assignedName = ""
      let location = ""

      if (assignmentType === "project") {
        const project = availableProjects.find((p) => p.id === selectedAssignment)
        assignedName = project?.name || ""
        location = project?.location || ""
      } else {
        const crew = availableCrews.find((c) => c.id === selectedAssignment)
        assignedName = crew?.name || ""
        location = "With Crew"
      }

      setEquipment({
        ...equipment,
        status: "In Use",
        assignedTo: assignedName,
        location: location,
      })

      setShowAssignModal(false)
    }
  }

  const handleUnassign = () => {
    setEquipment({
      ...equipment,
      status: "Available",
      assignedTo: null,
      location: "Main Warehouse",
    })
  }

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault()

    const maintenance = {
      id: equipment.maintenanceHistory.length + 1,
      date: newMaintenance.date,
      type: newMaintenance.type,
      description: newMaintenance.description,
      technician: newMaintenance.technician,
      cost: Number.parseFloat(newMaintenance.cost),
    }

    // Calculate next maintenance date (2 months from current maintenance)
    const maintenanceDate = new Date(newMaintenance.date)
    const nextMaintenanceDate = new Date(maintenanceDate)
    nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 2)

    setEquipment({
      ...equipment,
      maintenanceHistory: [maintenance, ...equipment.maintenanceHistory],
      lastMaintenance: newMaintenance.date,
      nextMaintenance: nextMaintenanceDate.toISOString().split("T")[0],
      status: equipment.status === "Maintenance" ? "Available" : equipment.status,
    })

    setNewMaintenance({
      date: "",
      type: "Routine",
      description: "",
      technician: "",
      cost: "",
    })

    setShowMaintenanceModal(false)
  }

  const handleUpdateStatus = () => {
    setEquipment({
      ...equipment,
      status: selectedStatus,
      assignedTo:
        selectedStatus === "Available" || selectedStatus === "Maintenance" || selectedStatus === "Out of Service"
          ? null
          : equipment.assignedTo,
      location:
        selectedStatus === "Maintenance"
          ? "Service Center"
          : selectedStatus === "Out of Service"
            ? "Repair Yard"
            : selectedStatus === "Available"
              ? "Main Warehouse"
              : equipment.location,
    })

    setShowStatusModal(false)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Calculate equipment age
  const calculateAge = () => {
    const purchaseDate = new Date(equipment.purchaseDate)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - purchaseDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)

    return `${years} ${years === 1 ? "year" : "years"}, ${months} ${months === 1 ? "month" : "months"}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{equipment.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-base-content/70">{equipment.type}</span>
            <div
              className={`badge ${
                equipment.status === "Available"
                  ? "badge-success"
                  : equipment.status === "In Use"
                    ? "badge-primary"
                    : equipment.status === "Maintenance"
                      ? "badge-warning"
                      : "badge-error"
              }`}
            >
              {equipment.status}
            </div>
            {equipment.assignedTo && (
              <span className="text-sm">
                Assigned to: <span className="font-medium">{equipment.assignedTo}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              <i className="fas fa-ellipsis-v mr-2"></i>
              Actions
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a onClick={() => setShowStatusModal(true)}>Update Status</a>
              </li>
              <li>
                <a onClick={() => setShowMaintenanceModal(true)}>Log Maintenance</a>
              </li>
              <li>
                <Link href={`/dashboard/equipment/${equipmentId}/edit`}>Edit Details</Link>
              </li>
              <li>
                <a className="text-error">Delete Equipment</a>
              </li>
            </ul>
          </div>
          {equipment.assignedTo ? (
            <button className="btn btn-outline btn-error" onClick={handleUnassign}>
              <i className="fas fa-times mr-2"></i>
              Unassign
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
              <i className="fas fa-clipboard-check mr-2"></i>
              Assign
            </button>
          )}
        </div>
      </div>

      <div className="tabs tabs-boxed bg-base-200 p-1">
        <button
          className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "maintenance" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance
        </button>
        <button
          className={`tab ${activeTab === "documents" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          Documents
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Equipment Information</h2>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Manufacturer:</span>
                  <span>{equipment.manufacturer}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Model:</span>
                  <span>{equipment.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Serial Number:</span>
                  <span>{equipment.serialNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Purchase Date:</span>
                  <span>{equipment.purchaseDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Age:</span>
                  <span>{calculateAge()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <div
                    className={`badge ${
                      equipment.status === "Available"
                        ? "badge-success"
                        : equipment.status === "In Use"
                          ? "badge-primary"
                          : equipment.status === "Maintenance"
                            ? "badge-warning"
                            : "badge-error"
                    }`}
                  >
                    {equipment.status}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Current Location:</span>
                  <span>{equipment.location || "—"}</span>
                </div>
                {equipment.assignedTo && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Assigned To:</span>
                    <span>{equipment.assignedTo}</span>
                  </div>
                )}
              </div>

              {equipment.notes && (
                <div className="mt-6">
                  <h3 className="font-semibold">Notes:</h3>
                  <p className="mt-2 text-sm">{equipment.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Maintenance Status</h2>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Last Maintenance:</span>
                  <span>{equipment.lastMaintenance || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Next Scheduled:</span>
                  <span>{equipment.nextMaintenance || "—"}</span>
                </div>
              </div>

              {equipment.nextMaintenance && (
                <div className="mt-6">
                  <h3 className="font-semibold">Maintenance Schedule:</h3>
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="w-full bg-base-300 rounded-full h-2.5">
                        {/* Calculate days until next maintenance */}
                        {(() => {
                          const today = new Date()
                          const nextDate = new Date(equipment.nextMaintenance || "")
                          const lastDate = new Date(equipment.lastMaintenance || "")

                          const totalDays = (nextDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
                          const daysElapsed = (today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
                          const percentComplete = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100))

                          return (
                            <div
                              className={`h-2.5 rounded-full ${
                                percentComplete > 75 ? "bg-error" : percentComplete > 50 ? "bg-warning" : "bg-success"
                              }`}
                              style={{ width: `${percentComplete}%` }}
                            ></div>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span>{equipment.lastMaintenance}</span>
                      <span>{equipment.nextMaintenance}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="card-actions justify-end mt-6">
                <button className="btn btn-primary btn-sm" onClick={() => setShowMaintenanceModal(true)}>
                  <i className="fas fa-tools mr-2"></i>
                  Log Maintenance
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl md:col-span-2">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">Recent Maintenance History</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab("maintenance")}>
                  View Full History
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Technician</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.maintenanceHistory.slice(0, 3).map((item) => (
                      <tr key={item.id}>
                        <td>{item.date}</td>
                        <td>
                          <div
                            className={`badge ${
                              item.type === "Routine"
                                ? "badge-primary"
                                : item.type === "Repair"
                                  ? "badge-warning"
                                  : "badge-info"
                            }`}
                          >
                            {item.type}
                          </div>
                        </td>
                        <td>{item.description}</td>
                        <td>{item.technician}</td>
                        <td>{formatCurrency(item.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === "maintenance" && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Maintenance History</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowMaintenanceModal(true)}>
                <i className="fas fa-plus mr-2"></i>
                Log Maintenance
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Technician</th>
                    <th>Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.maintenanceHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>
                        <div
                          className={`badge ${
                            item.type === "Routine"
                              ? "badge-primary"
                              : item.type === "Repair"
                                ? "badge-warning"
                                : "badge-info"
                          }`}
                        >
                          {item.type}
                        </div>
                      </td>
                      <td>{item.description}</td>
                      <td>{item.technician}</td>
                      <td>{formatCurrency(item.cost)}</td>
                      <td>
                        <button className="btn btn-ghost btn-xs">
                          <i className="fas fa-edit"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-lg">Maintenance Summary</h3>
              <div className="stats shadow mt-2">
                <div className="stat">
                  <div className="stat-title">Total Records</div>
                  <div className="stat-value">{equipment.maintenanceHistory.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Total Cost</div>
                  <div className="stat-value text-primary">
                    {formatCurrency(equipment.maintenanceHistory.reduce((total, item) => total + item.cost, 0))}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Last Maintenance</div>
                  <div className="stat-value text-sm">{equipment.lastMaintenance || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Equipment Documents</h2>
              <button className="btn btn-primary btn-sm">
                <i className="fas fa-upload mr-2"></i>
                Upload Document
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Type</th>
                    <th>Upload Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.name}</td>
                      <td>
                        <div className="badge badge-ghost">{doc.type}</div>
                      </td>
                      <td>{doc.uploadDate}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-xs">
                            <i className="fas fa-download"></i>
                          </button>
                          <button className="btn btn-ghost btn-xs">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="btn btn-ghost btn-xs text-error">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {equipment.documents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <i className="fas fa-file-alt text-4xl text-base-content/30 mb-4"></i>
                <p className="text-base-content/50">No documents uploaded yet</p>
                <button className="btn btn-primary btn-sm mt-4">
                  <i className="fas fa-upload mr-2"></i>
                  Upload Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Assign Equipment</h3>
            <div className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Assign To</span>
                </label>
                <div className="flex gap-2">
                  <button
                    className={`btn flex-1 ${assignmentType === "project" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setAssignmentType("project")}
                  >
                    Project
                  </button>
                  <button
                    className={`btn flex-1 ${assignmentType === "crew" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setAssignmentType("crew")}
                  >
                    Crew
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Select {assignmentType === "project" ? "Project" : "Crew"}</span>
                </label>
                <select
                  value={selectedAssignment || ""}
                  onChange={(e) => setSelectedAssignment(e.target.value ? Number.parseInt(e.target.value) : null)}
                  className="select select-bordered"
                  required
                >
                  <option value="">Select a {assignmentType === "project" ? "project" : "crew"}</option>
                  {assignmentType === "project"
                    ? availableProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))
                    : availableCrews.map((crew) => (
                        <option key={crew.id} value={crew.id}>
                          {crew.name}
                        </option>
                      ))}
                </select>
              </div>

              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAssign} disabled={selectedAssignment === null}>
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Log Maintenance</h3>
            <form onSubmit={handleAddMaintenance} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date</span>
                </label>
                <input
                  type="date"
                  value={newMaintenance.date}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, date: e.target.value })}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Maintenance Type</span>
                </label>
                <select
                  value={newMaintenance.type}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, type: e.target.value })}
                  className="select select-bordered"
                  required
                >
                  <option value="Routine">Routine</option>
                  <option value="Repair">Repair</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Overhaul">Overhaul</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  value={newMaintenance.description}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
                  className="textarea textarea-bordered"
                  placeholder="Describe the maintenance performed"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Technician</span>
                  </label>
                  <input
                    type="text"
                    value={newMaintenance.technician}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, technician: e.target.value })}
                    className="input input-bordered"
                    placeholder="Name of technician"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Cost</span>
                  </label>
                  <div className="input-group">
                    <span>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newMaintenance.cost}
                      onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: e.target.value })}
                      className="input input-bordered w-full"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowMaintenanceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Update Equipment Status</h3>
            <div className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Current Status: </span>
                  <div
                    className={`badge ${
                      equipment.status === "Available"
                        ? "badge-success"
                        : equipment.status === "In Use"
                          ? "badge-primary"
                          : equipment.status === "Maintenance"
                            ? "badge-warning"
                            : "badge-error"
                    }`}
                  >
                    {equipment.status}
                  </div>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="select select-bordered"
                  required
                >
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>

              <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                <span>
                  Changing status to "Available", "Maintenance", or "Out of Service" will remove any current assignment.
                </span>
              </div>

              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpdateStatus}>
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
