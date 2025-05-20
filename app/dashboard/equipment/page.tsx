"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

// Equipment type definition
type Equipment = {
  id: number
  name: string
  type: string
  status: "Available" | "In Use" | "Maintenance" | "Out of Service"
  assignedTo: string | null
  location: string | null
  lastMaintenance: string | null
  nextMaintenance: string | null
  purchaseDate: string
  serialNumber: string
  model: string
  manufacturer: string
  notes: string
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([
    {
      id: 1,
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
    },
    {
      id: 2,
      name: "Cement Mixer #CM-203",
      type: "Heavy Equipment",
      status: "Available",
      assignedTo: null,
      location: "Main Warehouse",
      lastMaintenance: "2025-05-01",
      nextMaintenance: "2025-07-01",
      purchaseDate: "2024-01-15",
      serialNumber: "CM203-2024-12345",
      model: "MX-2000",
      manufacturer: "Concrete Solutions",
      notes: "New mixer, replaced old unit in January",
    },
    {
      id: 3,
      name: "Bulldozer #BD-105",
      type: "Heavy Equipment",
      status: "Maintenance",
      assignedTo: null,
      location: "Service Center",
      lastMaintenance: "2025-05-10",
      nextMaintenance: "2025-05-20",
      purchaseDate: "2022-08-22",
      serialNumber: "BD105-2022-98765",
      model: "D6 XE",
      manufacturer: "Caterpillar",
      notes: "Currently undergoing major hydraulic system repair",
    },
    {
      id: 4,
      name: "Portable Generator #PG-42",
      type: "Power Equipment",
      status: "In Use",
      assignedTo: "Downtown Office Tower",
      location: "456 Main St",
      lastMaintenance: "2025-04-30",
      nextMaintenance: "2025-06-30",
      purchaseDate: "2023-11-05",
      serialNumber: "PG42-2023-54321",
      model: "PowerPro 7500",
      manufacturer: "GenTech",
      notes: "Fuel efficiency has been decreasing, may need service soon",
    },
    {
      id: 5,
      name: "Jackhammer Set #JH-12",
      type: "Power Tools",
      status: "Available",
      assignedTo: null,
      location: "Tool Shed",
      lastMaintenance: "2025-05-05",
      nextMaintenance: "2025-07-05",
      purchaseDate: "2024-02-10",
      serialNumber: "JH12-2024-13579",
      model: "Demolisher Pro",
      manufacturer: "BreakTech",
      notes: "Set includes 3 jackhammers of varying sizes",
    },
    {
      id: 6,
      name: "Crane #CR-007",
      type: "Heavy Equipment",
      status: "Out of Service",
      assignedTo: null,
      location: "Repair Yard",
      lastMaintenance: "2025-03-20",
      nextMaintenance: null,
      purchaseDate: "2020-06-15",
      serialNumber: "CR007-2020-24680",
      model: "Tower Crane TC-5000",
      manufacturer: "LiftMaster",
      notes: "Major structural issues detected, awaiting decision on repair vs. replace",
    },
    {
      id: 7,
      name: "Forklift #FL-22",
      type: "Heavy Equipment",
      status: "In Use",
      assignedTo: "Hillside Villas",
      location: "789 Hill Rd",
      lastMaintenance: "2025-04-10",
      nextMaintenance: "2025-06-10",
      purchaseDate: "2022-12-01",
      serialNumber: "FL22-2022-11223",
      model: "FT-5000",
      manufacturer: "LiftTech",
      notes: "Dedicated to Hillside Villas project until completion",
    },
    {
      id: 8,
      name: "Power Drill Set #PD-35",
      type: "Power Tools",
      status: "In Use",
      assignedTo: "Team Alpha",
      location: "With Crew",
      lastMaintenance: "2025-05-02",
      nextMaintenance: "2025-07-02",
      purchaseDate: "2024-03-15",
      serialNumber: "PD35-2024-99887",
      model: "DrillMaster Pro",
      manufacturer: "PowerTools Inc",
      notes: "Set includes 5 drills with various bits and attachments",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEquipmentData, setNewEquipmentData] = useState({
    name: "",
    type: "Heavy Equipment",
    model: "",
    manufacturer: "",
    serialNumber: "",
    purchaseDate: "",
  })

  // Filter equipment based on search query, type filter, and status filter
  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.assignedTo && item.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const handleCreateEquipment = (e: React.FormEvent) => {
    e.preventDefault()

    const newEquipment: Equipment = {
      id: equipment.length + 1,
      name: newEquipmentData.name,
      type: newEquipmentData.type,
      status: "Available",
      assignedTo: null,
      location: "Main Warehouse",
      lastMaintenance: null,
      nextMaintenance: null,
      purchaseDate: newEquipmentData.purchaseDate,
      serialNumber: newEquipmentData.serialNumber,
      model: newEquipmentData.model,
      manufacturer: newEquipmentData.manufacturer,
      notes: "",
    }

    setEquipment([...equipment, newEquipment])
    setNewEquipmentData({
      name: "",
      type: "Heavy Equipment",
      model: "",
      manufacturer: "",
      serialNumber: "",
      purchaseDate: "",
    })
    setShowCreateModal(false)
  }

  const handleDeleteEquipment = (id: number) => {
    setEquipment(equipment.filter((item) => item.id !== id))
  }

  // Get unique equipment types for filter dropdown
  const equipmentTypes = Array.from(new Set(equipment.map((item) => item.type)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Equipment</h1>
          <p className="text-base-content/70">Manage your equipment inventory and maintenance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus mr-2"></i>
          Add Equipment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="form-control flex-1">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search equipment..."
              className="input input-bordered w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-square">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <select className="select select-bordered" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {equipmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>
        </div>
      </div>

      {/* Equipment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <div key={item.id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h2 className="card-title">{item.name}</h2>
                <div
                  className={`badge ${
                    item.status === "Available"
                      ? "badge-success"
                      : item.status === "In Use"
                        ? "badge-primary"
                        : item.status === "Maintenance"
                          ? "badge-warning"
                          : "badge-error"
                  }`}
                >
                  {item.status}
                </div>
              </div>
              <p className="text-sm">
                {item.manufacturer} {item.model}
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center">
                  <i className="fas fa-tag w-5 opacity-70"></i>
                  <span>{item.type}</span>
                </div>
                {item.assignedTo && (
                  <div className="flex items-center">
                    <i className="fas fa-map-marker-alt w-5 opacity-70"></i>
                    <span>
                      Assigned to: <span className="font-medium">{item.assignedTo}</span>
                    </span>
                  </div>
                )}
                {item.nextMaintenance && (
                  <div className="flex items-center">
                    <i className="fas fa-tools w-5 opacity-70"></i>
                    <span>
                      Next maintenance: <span className="font-medium">{item.nextMaintenance}</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="card-actions justify-end mt-4">
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                    <i className="fas fa-ellipsis-v"></i>
                  </div>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                      <Link href={`/dashboard/equipment/${item.id}`}>View Details</Link>
                    </li>
                    <li>
                      <Link href={`/dashboard/equipment/${item.id}/edit`}>Edit Equipment</Link>
                    </li>
                    <li>
                      <a onClick={() => handleDeleteEquipment(item.id)} className="text-error">
                        Delete
                      </a>
                    </li>
                  </ul>
                </div>
                <Link href={`/dashboard/equipment/${item.id}`} className="btn btn-primary btn-sm">
                  Manage
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Equipment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add New Equipment</h3>
            <form onSubmit={handleCreateEquipment} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Equipment Name</span>
                </label>
                <input
                  type="text"
                  value={newEquipmentData.name}
                  onChange={(e) => setNewEquipmentData({ ...newEquipmentData, name: e.target.value })}
                  className="input input-bordered"
                  placeholder="e.g. Excavator #EX-102"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Equipment Type</span>
                </label>
                <select
                  value={newEquipmentData.type}
                  onChange={(e) => setNewEquipmentData({ ...newEquipmentData, type: e.target.value })}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Manufacturer</span>
                  </label>
                  <input
                    type="text"
                    value={newEquipmentData.manufacturer}
                    onChange={(e) => setNewEquipmentData({ ...newEquipmentData, manufacturer: e.target.value })}
                    className="input input-bordered"
                    placeholder="e.g. Caterpillar"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Model</span>
                  </label>
                  <input
                    type="text"
                    value={newEquipmentData.model}
                    onChange={(e) => setNewEquipmentData({ ...newEquipmentData, model: e.target.value })}
                    className="input input-bordered"
                    placeholder="e.g. CAT 320"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Serial Number</span>
                  </label>
                  <input
                    type="text"
                    value={newEquipmentData.serialNumber}
                    onChange={(e) => setNewEquipmentData({ ...newEquipmentData, serialNumber: e.target.value })}
                    className="input input-bordered"
                    placeholder="e.g. EX102-2023-12345"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Purchase Date</span>
                  </label>
                  <input
                    type="date"
                    value={newEquipmentData.purchaseDate}
                    onChange={(e) => setNewEquipmentData({ ...newEquipmentData, purchaseDate: e.target.value })}
                    className="input input-bordered"
                    required
                  />
                </div>
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
