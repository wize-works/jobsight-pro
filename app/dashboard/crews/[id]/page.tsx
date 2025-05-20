"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CrewDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const crewId = Number.parseInt(params.id)

  const [crew, setCrew] = useState({
    id: crewId,
    name: "Team Alpha",
    type: "General Construction",
    description:
      "Our primary crew for general construction tasks. Experienced in foundations, framing, and general site work.",
    memberCount: 6,
    capacity: 6,
    status: "Available",
    currentProject: null,
    members: [
      {
        id: 1,
        name: "John Smith",
        role: "Crew Lead",
        phone: "(555) 123-4567",
        email: "john.smith@example.com",
        status: "Active",
      },
      {
        id: 2,
        name: "Sarah Johnson",
        role: "Carpenter",
        phone: "(555) 234-5678",
        email: "sarah.johnson@example.com",
        status: "Active",
      },
      {
        id: 3,
        name: "Mike Davis",
        role: "Electrician",
        phone: "(555) 345-6789",
        email: "mike.davis@example.com",
        status: "Active",
      },
      {
        id: 4,
        name: "Lisa Garcia",
        role: "Laborer",
        phone: "(555) 456-7890",
        email: "lisa.garcia@example.com",
        status: "Active",
      },
      {
        id: 5,
        name: "Rob Wilson",
        role: "Equipment Operator",
        phone: "(555) 567-8901",
        email: "rob.wilson@example.com",
        status: "Active",
      },
      {
        id: 6,
        name: "Emma Martinez",
        role: "Safety Officer",
        phone: "(555) 678-9012",
        email: "emma.martinez@example.com",
        status: "On Leave",
      },
    ],
    schedule: [
      { date: "May 20, 2025", project: "Not Assigned", location: null, hours: null },
      { date: "May 21, 2025", project: "Not Assigned", location: null, hours: null },
      { date: "May 22, 2025", project: "Not Assigned", location: null, hours: null },
      { date: "May 23, 2025", project: "Not Assigned", location: null, hours: null },
      { date: "May 24, 2025", project: "Not Assigned", location: null, hours: null },
    ],
    equipment: [
      { id: 1, name: "Cement Mixer", type: "Heavy Equipment", assignedTo: "Rob Wilson" },
      { id: 2, name: "Power Drill Set", type: "Power Tools", assignedTo: "Sarah Johnson" },
      { id: 3, name: "Excavator #12", type: "Heavy Equipment", assignedTo: null },
    ],
  })

  const [activeTab, setActiveTab] = useState("overview")
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showAssignProjectModal, setShowAssignProjectModal] = useState(false)
  const [newMemberData, setNewMemberData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
  })

  const [availableProjects, setAvailableProjects] = useState([
    { id: 1, name: "Riverside Apartments", location: "123 Riverside Dr" },
    { id: 2, name: "Downtown Office Tower", location: "456 Main St" },
    { id: 3, name: "Hillside Villas", location: "789 Hill Rd" },
    { id: 4, name: "Community Center", location: "101 Community Blvd" },
    { id: 5, name: "Parkview Residences", location: "202 Park Ave" },
  ])

  const [selectedProject, setSelectedProject] = useState<number | null>(null)

  // Load the correct crew data based on ID
  useEffect(() => {
    // In a real app, this would be an API call
    console.log(`Loading crew with ID: ${crewId}`)
  }, [crewId])

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()

    const newMember = {
      id: crew.members.length + 1,
      name: newMemberData.name,
      role: newMemberData.role,
      phone: newMemberData.phone,
      email: newMemberData.email,
      status: "Active",
    }

    setCrew({
      ...crew,
      members: [...crew.members, newMember],
      memberCount: crew.memberCount + 1,
    })

    setNewMemberData({
      name: "",
      role: "",
      phone: "",
      email: "",
    })

    setShowAddMemberModal(false)
  }

  const handleRemoveMember = (id: number) => {
    setCrew({
      ...crew,
      members: crew.members.filter((member) => member.id !== id),
      memberCount: crew.memberCount - 1,
    })
  }

  const handleAssignProject = () => {
    if (selectedProject !== null) {
      const project = availableProjects.find((p) => p.id === selectedProject)

      setCrew({
        ...crew,
        status: "Assigned",
        currentProject: project?.name || null,
        schedule: crew.schedule.map((day) => ({
          ...day,
          project: project?.name || "Not Assigned",
          location: project?.location || null,
          hours: 8,
        })),
      })

      setShowAssignProjectModal(false)
    }
  }

  const handleUnassignProject = () => {
    setCrew({
      ...crew,
      status: "Available",
      currentProject: null,
      schedule: crew.schedule.map((day) => ({
        ...day,
        project: "Not Assigned",
        location: null,
        hours: null,
      })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{crew.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-base-content/70">{crew.type}</span>
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
            {crew.currentProject && (
              <span className="text-sm">
                Assigned to: <span className="font-medium">{crew.currentProject}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/crews/${crewId}/edit`} className="btn btn-ghost">
            <i className="fas fa-edit mr-2"></i>
            Edit
          </Link>
          {crew.currentProject ? (
            <button className="btn btn-outline btn-error" onClick={handleUnassignProject}>
              <i className="fas fa-times mr-2"></i>
              Unassign
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAssignProjectModal(true)}>
              <i className="fas fa-project-diagram mr-2"></i>
              Assign to Project
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
          className={`tab ${activeTab === "members" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          Members
        </button>
        <button
          className={`tab ${activeTab === "schedule" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          Schedule
        </button>
        <button
          className={`tab ${activeTab === "equipment" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("equipment")}
        >
          Equipment
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Crew Information</h2>
              <p>{crew.description}</p>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Members:</span>
                  <span>
                    {crew.memberCount}/{crew.capacity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Type:</span>
                  <span>{crew.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
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
                {crew.currentProject && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Current Project:</span>
                    <span>{crew.currentProject}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Crew Composition</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {crew.members.map((member) => (
                  <div key={member.id} className="badge badge-lg">
                    {member.role}
                  </div>
                ))}
              </div>

              <h3 className="font-semibold mt-6">Member Statuses</h3>
              <div className="stats stats-vertical shadow mt-2">
                <div className="stat">
                  <div className="stat-title">Active</div>
                  <div className="stat-value text-success">
                    {crew.members.filter((m) => m.status === "Active").length}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">On Leave</div>
                  <div className="stat-value text-warning">
                    {crew.members.filter((m) => m.status === "On Leave").length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl md:col-span-2">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">Upcoming Schedule</h2>
                <Link
                  href={`/dashboard/crews/${crewId}?tab=schedule`}
                  className="btn btn-ghost btn-sm"
                  onClick={() => setActiveTab("schedule")}
                >
                  View Full Schedule
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Project</th>
                      <th>Location</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crew.schedule.slice(0, 3).map((item, index) => (
                      <tr key={index}>
                        <td>{item.date}</td>
                        <td>{item.project}</td>
                        <td>{item.location || "—"}</td>
                        <td>{item.hours || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Crew Members</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddMemberModal(true)}
                disabled={crew.memberCount >= crew.capacity}
              >
                <i className="fas fa-user-plus mr-2"></i>
                Add Member
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crew.members.map((member) => (
                <div key={member.id} className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{member.name}</h3>
                        <p className="text-sm">{member.role}</p>
                      </div>
                      <div className={`badge ${member.status === "Active" ? "badge-success" : "badge-warning"}`}>
                        {member.status}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex items-center">
                        <i className="fas fa-phone-alt w-5 opacity-70"></i>
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-envelope w-5 opacity-70"></i>
                        <span>{member.email}</span>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                          <i className="fas fa-ellipsis-v"></i>
                        </div>
                        <ul
                          tabIndex={0}
                          className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                        >
                          <li>
                            <a>View Profile</a>
                          </li>
                          <li>
                            <a>Change Role</a>
                          </li>
                          <li>
                            <a>Change Status</a>
                          </li>
                          <li>
                            <a className="text-error" onClick={() => handleRemoveMember(member.id)}>
                              Remove from Crew
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Crew Schedule</h2>
              <div>
                <select className="select select-bordered select-sm">
                  <option value="week">This Week</option>
                  <option value="nextWeek">Next Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Location</th>
                    <th>Hours</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crew.schedule.map((item, index) => (
                    <tr key={index}>
                      <td>{item.date}</td>
                      <td>{item.project}</td>
                      <td>{item.location || "—"}</td>
                      <td>{item.hours || "—"}</td>
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

            <div className="flex justify-between items-center mt-4">
              <button className="btn btn-ghost btn-sm">
                <i className="fas fa-chevron-left mr-2"></i>
                Previous Week
              </button>
              <button className="btn btn-ghost btn-sm">
                Next Week
                <i className="fas fa-chevron-right ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === "equipment" && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Assigned Equipment</h2>
              <button className="btn btn-primary btn-sm">
                <i className="fas fa-plus mr-2"></i>
                Assign Equipment
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Type</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crew.equipment.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.type}</td>
                      <td>{item.assignedTo || "Unassigned"}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-xs">
                            <i className="fas fa-exchange-alt"></i>
                          </button>
                          <button className="btn btn-ghost btn-xs text-error">
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add Crew Member</h3>
            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  value={newMemberData.name}
                  onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                  className="input input-bordered"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  value={newMemberData.role}
                  onChange={(e) => setNewMemberData({ ...newMemberData, role: e.target.value })}
                  className="select select-bordered"
                  required
                >
                  <option value="">Select a role</option>
                  <option value="Crew Lead">Crew Lead</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Equipment Operator">Equipment Operator</option>
                  <option value="Laborer">Laborer</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="HVAC Technician">HVAC Technician</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone</span>
                </label>
                <input
                  type="tel"
                  value={newMemberData.phone}
                  onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                  className="input input-bordered"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  value={newMemberData.email}
                  onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                  className="input input-bordered"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddMemberModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Project Modal */}
      {showAssignProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Assign to Project</h3>
            <div className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Select Project</span>
                </label>
                <select
                  value={selectedProject || ""}
                  onChange={(e) => setSelectedProject(e.target.value ? Number.parseInt(e.target.value) : null)}
                  className="select select-bordered"
                  required
                >
                  <option value="">Select a project</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowAssignProjectModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAssignProject} disabled={selectedProject === null}>
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
