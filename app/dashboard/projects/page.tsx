"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

// Project type definition
type Project = {
  id: number
  name: string
  client: string
  location: string
  startDate: string
  endDate: string
  budget: number
  status: "Planning" | "In Progress" | "On Hold" | "Completed"
  progress: number
  description: string
  manager: string
  thumbnail?: string
  tasks: {
    total: number
    completed: number
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: "Downtown Highrise",
      client: "Metropolis Development Corp",
      location: "123 Main St, Downtown",
      startDate: "2025-01-15",
      endDate: "2026-06-30",
      budget: 12500000,
      status: "In Progress",
      progress: 35,
      description: "A 25-story commercial building with retail space on the ground floor and office space above.",
      manager: "John Smith",
      thumbnail: "/construction-site-dashboard.png",
      tasks: {
        total: 145,
        completed: 52,
      },
    },
    {
      id: 2,
      name: "Riverside Apartments",
      client: "River View Properties",
      location: "456 River Rd, Riverside",
      startDate: "2025-03-10",
      endDate: "2026-02-28",
      budget: 8750000,
      status: "In Progress",
      progress: 20,
      description: "A luxury apartment complex with 120 units, pool, and fitness center.",
      manager: "Sarah Johnson",
      thumbnail: "/business-management-dashboard.png",
      tasks: {
        total: 98,
        completed: 18,
      },
    },
    {
      id: 3,
      name: "Community Center Renovation",
      client: "City of Metropolis",
      location: "789 Park Ave, Metropolis",
      startDate: "2025-02-01",
      endDate: "2025-08-15",
      budget: 3200000,
      status: "Planning",
      progress: 5,
      description: "Complete renovation of the city's community center including new gymnasium and meeting spaces.",
      manager: "Michael Brown",
      tasks: {
        total: 72,
        completed: 4,
      },
    },
    {
      id: 4,
      name: "Mountain View Condos",
      client: "Alpine Developers LLC",
      location: "321 Mountain Rd, Highland",
      startDate: "2025-05-01",
      endDate: "2026-09-30",
      budget: 15800000,
      status: "Planning",
      progress: 0,
      description: "Luxury condominium development with 45 units and underground parking.",
      manager: "Emily Davis",
      tasks: {
        total: 0,
        completed: 0,
      },
    },
    {
      id: 5,
      name: "Sunset Plaza Mall Expansion",
      client: "Sunset Retail Group",
      location: "555 Sunset Blvd, Westside",
      startDate: "2024-11-15",
      endDate: "2025-12-31",
      budget: 9500000,
      status: "On Hold",
      progress: 15,
      description: "Expansion of existing mall with additional 50,000 sq ft of retail space and food court.",
      manager: "David Wilson",
      tasks: {
        total: 87,
        completed: 12,
      },
    },
    {
      id: 6,
      name: "Harbor Bridge Repair",
      client: "State Transportation Department",
      location: "Harbor Bridge, Eastport",
      startDate: "2024-08-10",
      endDate: "2025-03-15",
      budget: 4200000,
      status: "Completed",
      progress: 100,
      description: "Structural repairs and resurfacing of the Harbor Bridge.",
      manager: "Robert Taylor",
      tasks: {
        total: 56,
        completed: 56,
      },
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectData, setNewProjectData] = useState({
    name: "",
    client: "",
    location: "",
    startDate: "",
    endDate: "",
    budget: "",
    description: "",
    manager: "",
  })

  // Filter projects based on search query and status filter
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.manager.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()

    const newProject: Project = {
      id: projects.length + 1,
      name: newProjectData.name,
      client: newProjectData.client,
      location: newProjectData.location,
      startDate: newProjectData.startDate,
      endDate: newProjectData.endDate,
      budget: Number.parseFloat(newProjectData.budget) || 0,
      status: "Planning",
      progress: 0,
      description: newProjectData.description,
      manager: newProjectData.manager,
      tasks: {
        total: 0,
        completed: 0,
      },
    }

    setProjects([...projects, newProject])
    setNewProjectData({
      name: "",
      client: "",
      location: "",
      startDate: "",
      endDate: "",
      budget: "",
      description: "",
      manager: "",
    })
    setShowCreateModal(false)
  }

  const handleDeleteProject = (id: number) => {
    setProjects(projects.filter((project) => project.id !== id))
  }

  // Calculate project statistics
  const projectStats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === "In Progress").length,
    planning: projects.filter((p) => p.status === "Planning").length,
    onHold: projects.filter((p) => p.status === "On Hold").length,
    completed: projects.filter((p) => p.status === "Completed").length,
    totalBudget: projects.reduce((sum, project) => sum + project.budget, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-base-content/70">Manage your construction projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus mr-2"></i>
          Create Project
        </button>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-primary">
            <i className="fas fa-project-diagram text-3xl"></i>
          </div>
          <div className="stat-title">Total Projects</div>
          <div className="stat-value">{projectStats.total}</div>
          <div className="stat-desc">
            <span className="text-success">{projectStats.inProgress} in progress</span>
          </div>
        </div>
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-secondary">
            <i className="fas fa-tasks text-3xl"></i>
          </div>
          <div className="stat-title">Project Status</div>
          <div className="stat-value text-secondary">{projectStats.completed}</div>
          <div className="stat-desc">Completed projects</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-accent">
            <i className="fas fa-calendar-alt text-3xl"></i>
          </div>
          <div className="stat-title">Planning</div>
          <div className="stat-value">{projectStats.planning}</div>
          <div className="stat-desc">
            <span className="text-warning">{projectStats.onHold} on hold</span>
          </div>
        </div>
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-info">
            <i className="fas fa-dollar-sign text-3xl"></i>
          </div>
          <div className="stat-title">Total Budget</div>
          <div className="stat-value text-info">${(projectStats.totalBudget / 1000000).toFixed(1)}M</div>
          <div className="stat-desc">Across all projects</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="form-control flex-1">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search projects..."
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
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="card bg-base-100 shadow-xl">
            <figure className="h-48 relative">
              {project.thumbnail ? (
                <Image
                  src={project.thumbnail || "/placeholder.svg"}
                  alt={project.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-base-200">
                  <i className="fas fa-building text-6xl text-base-content/20"></i>
                </div>
              )}
              <div
                className={`absolute top-2 right-2 badge ${
                  project.status === "In Progress"
                    ? "badge-primary"
                    : project.status === "Planning"
                      ? "badge-secondary"
                      : project.status === "On Hold"
                        ? "badge-warning"
                        : "badge-success"
                }`}
              >
                {project.status}
              </div>
            </figure>
            <div className="card-body">
              <h2 className="card-title">{project.name}</h2>
              <p className="text-sm text-base-content/70 line-clamp-2">{project.description}</p>

              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm">
                  <i className="fas fa-user-tie w-5 opacity-70"></i>
                  <span>{project.client}</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-map-marker-alt w-5 opacity-70"></i>
                  <span>{project.location}</span>
                </div>
                <div className="flex items-center text-sm">
                  <i className="fas fa-calendar w-5 opacity-70"></i>
                  <span>
                    {new Date(project.startDate).toLocaleDateString()} -{" "}
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <progress
                  className={`progress w-full ${
                    project.progress < 30
                      ? "progress-primary"
                      : project.progress < 70
                        ? "progress-warning"
                        : "progress-success"
                  }`}
                  value={project.progress}
                  max="100"
                ></progress>
              </div>

              <div className="card-actions justify-between items-center mt-4">
                <div className="text-sm">
                  <span className="font-medium">{project.tasks.completed}</span>/{project.tasks.total} tasks completed
                </div>
                <div className="flex gap-2">
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                      <i className="fas fa-ellipsis-v"></i>
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                      <li>
                        <Link href={`/dashboard/projects/${project.id}/edit`}>
                          <i className="fas fa-edit"></i> Edit Project
                        </Link>
                      </li>
                      <li>
                        <a>
                          <i className="fas fa-copy"></i> Duplicate
                        </a>
                      </li>
                      <li>
                        <a>
                          <i className="fas fa-archive"></i> Archive
                        </a>
                      </li>
                      <li>
                        <a onClick={() => handleDeleteProject(project.id)} className="text-error">
                          <i className="fas fa-trash"></i> Delete
                        </a>
                      </li>
                    </ul>
                  </div>
                  <Link href={`/dashboard/projects/${project.id}`} className="btn btn-primary btn-sm">
                    View Project
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Project Name</span>
                  </label>
                  <input
                    type="text"
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                    className="input input-bordered"
                    placeholder="e.g. Downtown Highrise"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Client</span>
                  </label>
                  <input
                    type="text"
                    value={newProjectData.client}
                    onChange={(e) => setNewProjectData({ ...newProjectData, client: e.target.value })}
                    className="input input-bordered"
                    placeholder="e.g. Metropolis Development Corp"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Location</span>
                </label>
                <input
                  type="text"
                  value={newProjectData.location}
                  onChange={(e) => setNewProjectData({ ...newProjectData, location: e.target.value })}
                  className="input input-bordered"
                  placeholder="e.g. 123 Main St, Downtown"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={newProjectData.startDate}
                    onChange={(e) => setNewProjectData({ ...newProjectData, startDate: e.target.value })}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">End Date</span>
                  </label>
                  <input
                    type="date"
                    value={newProjectData.endDate}
                    onChange={(e) => setNewProjectData({ ...newProjectData, endDate: e.target.value })}
                    className="input input-bordered"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Budget ($)</span>
                  </label>
                  <input
                    type="number"
                    value={newProjectData.budget}
                    onChange={(e) => setNewProjectData({ ...newProjectData, budget: e.target.value })}
                    className="input input-bordered"
                    placeholder="e.g. 1000000"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Project Manager</span>
                  </label>
                  <input
                    type="text"
                    value={newProjectData.manager}
                    onChange={(e) => setNewProjectData({ ...newProjectData, manager: e.target.value })}
                    className="input input-bordered"
                    placeholder="e.g. John Smith"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                  className="textarea textarea-bordered h-24"
                  placeholder="Describe the project..."
                  required
                />
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
