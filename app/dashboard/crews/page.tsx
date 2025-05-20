"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

export default function CrewsPage() {
  const [crews, setCrews] = useState([
    {
      id: 1,
      name: "Team Alpha",
      type: "General Construction",
      memberCount: 6,
      capacity: 6,
      status: "Available",
      currentProject: null,
    },
    {
      id: 2,
      name: "Team Bravo",
      type: "Electrical",
      memberCount: 4,
      capacity: 5,
      status: "Partial",
      currentProject: "Riverside Apartments",
    },
    {
      id: 3,
      name: "Team Charlie",
      type: "Plumbing",
      memberCount: 5,
      capacity: 5,
      status: "Assigned",
      currentProject: "Hillside Villas",
    },
    {
      id: 4,
      name: "Team Delta",
      type: "Finishing",
      memberCount: 3,
      capacity: 4,
      status: "Partial",
      currentProject: "Downtown Office Tower",
    },
    {
      id: 5,
      name: "Team Echo",
      type: "Excavation",
      memberCount: 4,
      capacity: 4,
      status: "Assigned",
      currentProject: "Community Center",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCrewData, setNewCrewData] = useState({
    name: "",
    type: "General Construction",
    capacity: 5,
  })

  // Filter crews based on search query and status filter
  const filteredCrews = crews.filter((crew) => {
    const matchesSearch =
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (crew.currentProject && crew.currentProject.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || crew.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const handleCreateCrew = (e: React.FormEvent) => {
    e.preventDefault()

    const newCrew = {
      id: crews.length + 1,
      name: newCrewData.name,
      type: newCrewData.type,
      memberCount: 0,
      capacity: newCrewData.capacity,
      status: "Available",
      currentProject: null,
    }

    setCrews([...crews, newCrew])
    setNewCrewData({
      name: "",
      type: "General Construction",
      capacity: 5,
    })
    setShowCreateModal(false)
  }

  const handleDeleteCrew = (id: number) => {
    setCrews(crews.filter((crew) => crew.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Crews</h1>
          <p className="text-base-content/70">Manage your work crews and team assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus mr-2"></i>
          Create Crew
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="form-control flex-1">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search crews..."
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
          <select
            className="select select-bordered"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="partial">Partial</option>
            <option value="assigned">Assigned</option>
          </select>
        </div>
      </div>

      {/* Crew Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCrews.map((crew) => (
          <div key={crew.id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h2 className="card-title">{crew.name}</h2>
                <div
                  className={`badge ${
                    crew.status === "Available"
                      ? "badge-success"
                      : crew.status === "Partial"
                        ? "badge-warning"
                        : "badge-error"
                  }`}
                >
                  {crew.status}
                </div>
              </div>
              <p>{crew.type}</p>
              <div className="flex items-center mt-2">
                <div className="flex -space-x-4 mr-4">
                  {Array.from({ length: crew.memberCount }).map((_, index) => (
                    <div key={index} className="avatar placeholder">
                      <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
                        <span className="text-xs">Team</span>
                      </div>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-base-content/70">
                  {crew.memberCount}/{crew.capacity} members
                </span>
              </div>
              {crew.currentProject && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Current Project: </span>
                  <span className="text-sm">{crew.currentProject}</span>
                </div>
              )}
              <div className="card-actions justify-end mt-4">
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                    <i className="fas fa-ellipsis-v"></i>
                  </div>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                      <Link href={`/dashboard/crews/${crew.id}`}>View Details</Link>
                    </li>
                    <li>
                      <Link href={`/dashboard/crews/${crew.id}/edit`}>Edit Crew</Link>
                    </li>
                    <li>
                      <a onClick={() => handleDeleteCrew(crew.id)} className="text-error">
                        Delete
                      </a>
                    </li>
                  </ul>
                </div>
                <Link href={`/dashboard/crews/${crew.id}`} className="btn btn-primary btn-sm">
                  Manage Crew
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Crew Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Create New Crew</h3>
            <form onSubmit={handleCreateCrew} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Crew Name</span>
                </label>
                <input
                  type="text"
                  value={newCrewData.name}
                  onChange={(e) => setNewCrewData({ ...newCrewData, name: e.target.value })}
                  className="input input-bordered"
                  placeholder="e.g. Team Foxtrot"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Crew Type</span>
                </label>
                <select
                  value={newCrewData.type}
                  onChange={(e) => setNewCrewData({ ...newCrewData, type: e.target.value })}
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
                  <span className="label-text">Capacity</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newCrewData.capacity}
                  onChange={(e) => setNewCrewData({ ...newCrewData, capacity: Number.parseInt(e.target.value) })}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Crew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
