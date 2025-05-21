"use client"

import { useState } from "react"
import Link from "next/link"

// Mock data for crews
const initialCrews = [
    {
        id: "crew1",
        name: "Foundation Team",
        leader: "Mike Wilson",
        members: 5,
        currentProject: "Main Street Development",
        status: "active",
    },
    {
        id: "crew2",
        name: "Framing Crew",
        leader: "Sarah Johnson",
        members: 7,
        currentProject: "Riverside Apartments",
        status: "active",
    },
    {
        id: "crew3",
        name: "Electrical Team",
        leader: "David Martinez",
        members: 4,
        currentProject: "Downtown Project",
        status: "active",
    },
    {
        id: "crew4",
        name: "Plumbing Specialists",
        leader: "Lisa Chen",
        members: 3,
        currentProject: null,
        status: "available",
    },
    {
        id: "crew5",
        name: "Finishing Crew",
        leader: "James Taylor",
        members: 6,
        currentProject: "Johnson Residence",
        status: "active",
    },
]

export default function CrewsPage() {
    const [crews, setCrews] = useState(initialCrews)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [showAddCrewModal, setShowAddCrewModal] = useState(false)
    const [newCrew, setNewCrew] = useState({
        name: "",
        leader: "",
        members: 1,
    })

    // Filter crews based on search term and status
    const filteredCrews = crews.filter((crew) => {
        const matchesSearch =
            crew.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            crew.leader.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || crew.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleAddCrew = () => {
        const crew = {
            id: `crew${crews.length + 1}`,
            name: newCrew.name,
            leader: newCrew.leader,
            members: newCrew.members,
            currentProject: null,
            status: "available",
        }
        setCrews([...crews, crew])
        setNewCrew({ name: "", leader: "", members: 1 })
        setShowAddCrewModal(false)
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Crew Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddCrewModal(true)}>
                    <i className="fas fa-plus mr-2"></i> Add Crew
                </button>
            </div>

            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="form-control flex-1">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Search crews..."
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
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="available">Available</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCrews.map((crew) => (
                    <div key={crew.id} className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex justify-between items-start">
                                <h2 className="card-title">{crew.name}</h2>
                                <div className={`badge ${crew.status === "active" ? "badge-primary" : "badge-success"}`}>
                                    {crew.status === "active" ? "Active" : "Available"}
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="flex items-center">
                                    <i className="fas fa-user-tie mr-2 text-primary"></i> {crew.leader}
                                </p>
                                <p className="flex items-center mt-1">
                                    <i className="fas fa-users mr-2 text-primary"></i> {crew.members} members
                                </p>
                                {crew.currentProject && (
                                    <p className="flex items-center mt-1">
                                        <i className="fas fa-project-diagram mr-2 text-primary"></i> {crew.currentProject}
                                    </p>
                                )}
                            </div>
                            <div className="card-actions justify-end mt-4">
                                <Link href={`/dashboard/crews/${crew.id}`} className="btn btn-sm btn-outline">
                                    View Details
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Crew Modal */}
            {showAddCrewModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Crew</h3>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Crew Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter crew name"
                                className="input input-bordered"
                                value={newCrew.name}
                                onChange={(e) => setNewCrew({ ...newCrew, name: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Crew Leader</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter crew leader name"
                                className="input input-bordered"
                                value={newCrew.leader}
                                onChange={(e) => setNewCrew({ ...newCrew, leader: e.target.value })}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Number of Members</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                className="input input-bordered"
                                value={newCrew.members}
                                onChange={(e) => setNewCrew({ ...newCrew, members: Number.parseInt(e.target.value) || 1 })}
                            />
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddCrewModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddCrew}>
                                Add Crew
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddCrewModal(false)}></div>
                </div>
            )}
        </div>
    )
}
