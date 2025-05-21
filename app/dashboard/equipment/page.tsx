"use client"

import { useState } from "react"
import Link from "next/link"

// Mock data for equipment
const initialEquipment = [
  {
    id: "eq1",
    name: "Excavator #103",
    type: "Heavy Equipment",
    make: "Caterpillar",
    model: "336",
    year: 2020,
    serialNumber: "CAT336-2020-103",
    status: "in-use",
    assignedTo: "Foundation Team",
    location: "Main Street Development",
    nextMaintenance: "2025-06-15",
    purchaseDate: "2020-03-12",
    purchasePrice: 250000,
    currentValue: 175000,
    image: "/large-yellow-excavator.png",
  },
  {
    id: "eq2",
    name: "Bulldozer #87",
    type: "Heavy Equipment",
    make: "John Deere",
    model: "700K",
    year: 2019,
    serialNumber: "JD700K-2019-87",
    status: "available",
    assignedTo: null,
    location: "Equipment Yard",
    nextMaintenance: "2025-05-30",
    purchaseDate: "2019-06-20",
    purchasePrice: 180000,
    currentValue: 120000,
    image: "/powerful-bulldozer.png",
  },
  {
    id: "eq3",
    name: "Cement Mixer #42",
    type: "Medium Equipment",
    make: "SANY",
    model: "SY204C-8",
    year: 2021,
    serialNumber: "SANY204C-2021-42",
    status: "in-use",
    assignedTo: "Foundation Team",
    location: "Main Street Development",
    nextMaintenance: "2025-07-10",
    purchaseDate: "2021-02-15",
    purchasePrice: 85000,
    currentValue: 70000,
    image: "/placeholder-tdvdz.png",
  },
  {
    id: "eq4",
    name: "Forklift #29",
    type: "Medium Equipment",
    make: "Toyota",
    model: "8FGU25",
    year: 2022,
    serialNumber: "TOYO8FGU-2022-29",
    status: "maintenance",
    assignedTo: null,
    location: "Service Center",
    nextMaintenance: "2025-05-22",
    purchaseDate: "2022-01-10",
    purchasePrice: 35000,
    currentValue: 30000,
    image: "/warehouse-forklift-operation.png",
  },
  {
    id: "eq5",
    name: "Generator #56",
    type: "Small Equipment",
    make: "Honda",
    model: "EU7000is",
    year: 2023,
    serialNumber: "HONDA-EU7000-2023-56",
    status: "in-use",
    assignedTo: "Electrical Team",
    location: "Downtown Project",
    nextMaintenance: "2025-08-05",
    purchaseDate: "2023-04-18",
    purchasePrice: 5500,
    currentValue: 4800,
    image: "/abstract-energy-flow.png",
  },
  {
    id: "eq6",
    name: "Concrete Saw #17",
    type: "Small Equipment",
    make: "Husqvarna",
    model: "K770",
    year: 2022,
    serialNumber: "HUSQ-K770-2022-17",
    status: "available",
    assignedTo: null,
    location: "Equipment Yard",
    nextMaintenance: "2025-06-20",
    purchaseDate: "2022-05-30",
    purchasePrice: 1200,
    currentValue: 900,
    image: "/concrete-saw.png",
  },
  {
    id: "eq7",
    name: "Backhoe Loader #64",
    type: "Heavy Equipment",
    make: "JCB",
    model: "3CX",
    year: 2021,
    serialNumber: "JCB3CX-2021-64",
    status: "in-use",
    assignedTo: "Framing Crew",
    location: "Riverside Apartments",
    nextMaintenance: "2025-07-15",
    purchaseDate: "2021-03-25",
    purchasePrice: 95000,
    currentValue: 80000,
    image: "/backhoe-loader.png",
  },
  {
    id: "eq8",
    name: "Air Compressor #38",
    type: "Medium Equipment",
    make: "Ingersoll Rand",
    model: "P185",
    year: 2020,
    serialNumber: "IR-P185-2020-38",
    status: "available",
    assignedTo: null,
    location: "Equipment Yard",
    nextMaintenance: "2025-06-10",
    purchaseDate: "2020-07-12",
    purchasePrice: 15000,
    currentValue: 10000,
    image: "/placeholder-wzca7.png",
  },
  {
    id: "eq9",
    name: "Skid Steer #51",
    type: "Medium Equipment",
    make: "Bobcat",
    model: "S650",
    year: 2022,
    serialNumber: "BOB-S650-2022-51",
    status: "in-use",
    assignedTo: "Finishing Crew",
    location: "Johnson Residence",
    nextMaintenance: "2025-08-20",
    purchaseDate: "2022-02-28",
    purchasePrice: 45000,
    currentValue: 38000,
    image: "/placeholder.svg?height=200&width=200&query=skid+steer",
  },
  {
    id: "eq10",
    name: "Scissor Lift #73",
    type: "Medium Equipment",
    make: "Genie",
    model: "GS-1930",
    year: 2021,
    serialNumber: "GENIE-GS1930-2021-73",
    status: "maintenance",
    assignedTo: null,
    location: "Service Center",
    nextMaintenance: "2025-05-25",
    purchaseDate: "2021-05-10",
    purchasePrice: 12000,
    currentValue: 9000,
    image: "/placeholder.svg?height=200&width=200&query=scissor+lift",
  },
  {
    id: "eq11",
    name: "Portable Welder #22",
    type: "Small Equipment",
    make: "Lincoln Electric",
    model: "Ranger 305 G",
    year: 2023,
    serialNumber: "LE-R305G-2023-22",
    status: "available",
    assignedTo: null,
    location: "Equipment Yard",
    nextMaintenance: "2025-09-05",
    purchaseDate: "2023-01-15",
    purchasePrice: 8000,
    currentValue: 7500,
    image: "/placeholder.svg?height=200&width=200&query=portable+welder",
  },
  {
    id: "eq12",
    name: "Boom Lift #45",
    type: "Heavy Equipment",
    make: "JLG",
    model: "600AJ",
    year: 2020,
    serialNumber: "JLG-600AJ-2020-45",
    status: "in-use",
    assignedTo: "Electrical Team",
    location: "Downtown Project",
    nextMaintenance: "2025-07-30",
    purchaseDate: "2020-04-20",
    purchasePrice: 65000,
    currentValue: 48000,
    image: "/placeholder.svg?height=200&width=200&query=boom+lift",
  },
]

// Status options with colors and labels
const statusOptions = {
  "in-use": { label: "In Use", color: "badge-primary" },
  available: { label: "Available", color: "badge-success" },
  maintenance: { label: "Maintenance", color: "badge-warning" },
  repair: { label: "Under Repair", color: "badge-error" },
  retired: { label: "Retired", color: "badge-neutral" },
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState(initialEquipment)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false)
  const [newEquipment, setNewEquipment] = useState({
    name: "",
    type: "Heavy Equipment",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    serialNumber: "",
    status: "available",
    purchasePrice: 0,
  })

  // Filter equipment based on search term, type, and status
  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // Get unique equipment types for filter dropdown
  const equipmentTypes = ["all", ...new Set(equipment.map((item) => item.type))]

  const handleAddEquipment = () => {
    const item = {
      id: `eq${equipment.length + 1}`,
      ...newEquipment,
      assignedTo: null,
      location: "Equipment Yard",
      nextMaintenance: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0],
      purchaseDate: new Date().toISOString().split("T")[0],
      currentValue: newEquipment.purchasePrice,
      image: `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(newEquipment.name)}`,
    }
    setEquipment([...equipment, item])
    setNewEquipment({
      name: "",
      type: "Heavy Equipment",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      serialNumber: "",
      status: "available",
      purchasePrice: 0,
    })
    setShowAddEquipmentModal(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Equipment Management</h1>
        <button className="btn btn-primary" onClick={() => setShowAddEquipmentModal(true)}>
          <i className="fas fa-plus mr-2"></i> Add Equipment
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="form-control flex-1">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search equipment..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-square">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>
            <select
              className="select select-bordered"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {equipmentTypes
                .filter((type) => type !== "all")
                .map((type) => (
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
              {Object.entries(statusOptions).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <div key={item.id} className="card bg-base-100 shadow-sm">
            <figure className="px-4 pt-4">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="rounded-xl h-48 w-full object-cover"
              />
            </figure>
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h2 className="card-title">{item.name}</h2>
                <div className={`badge ${statusOptions[item.status].color}`}>{statusOptions[item.status].label}</div>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  <span className="font-semibold">Make/Model:</span> {item.make} {item.model}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Type:</span> {item.type}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Year:</span> {item.year}
                </p>
                {item.assignedTo && (
                  <p className="text-sm">
                    <span className="font-semibold">Assigned to:</span> {item.assignedTo}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-semibold">Location:</span> {item.location}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Next Maintenance:</span>{" "}
                  {new Date(item.nextMaintenance).toLocaleDateString()}
                </p>
              </div>
              <div className="card-actions justify-end mt-4">
                <Link href={`/dashboard/equipment/${item.id}`} className="btn btn-sm btn-outline">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-search text-4xl text-base-content/30 mb-4"></i>
          <h3 className="text-xl font-semibold mb-2">No equipment found</h3>
          <p className="text-base-content/70">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipmentModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add New Equipment</h3>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Equipment Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter equipment name"
                className="input input-bordered"
                value={newEquipment.name}
                onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
              />
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Equipment Type</span>
              </label>
              <select
                className="select select-bordered"
                value={newEquipment.type}
                onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
              >
                <option>Heavy Equipment</option>
                <option>Medium Equipment</option>
                <option>Small Equipment</option>
                <option>Tools</option>
                <option>Other</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Make</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter make"
                  className="input input-bordered"
                  value={newEquipment.make}
                  onChange={(e) => setNewEquipment({ ...newEquipment, make: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Model</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter model"
                  className="input input-bordered"
                  value={newEquipment.model}
                  onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Year</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter year"
                  className="input input-bordered"
                  value={newEquipment.year}
                  onChange={(e) => setNewEquipment({ ...newEquipment, year: Number(e.target.value) })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Serial Number</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter serial number"
                  className="input input-bordered"
                  value={newEquipment.serialNumber}
                  onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Status</span>
                </label>
                <select
                  className="select select-bordered"
                  value={newEquipment.status}
                  onChange={(e) => setNewEquipment({ ...newEquipment, status: e.target.value })}
                >
                  {Object.entries(statusOptions).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Purchase Price</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter purchase price"
                  className="input input-bordered"
                  value={newEquipment.purchasePrice}
                  onChange={(e) => setNewEquipment({ ...newEquipment, purchasePrice: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowAddEquipmentModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddEquipment}>
                Add Equipment
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAddEquipmentModal(false)}></div>
        </div>
      )}
    </div>
  )
}
