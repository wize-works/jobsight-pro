"use client"

import { useState } from "react"
import Link from "next/link"

// Mock data for projects
const projectsData = [
    {
        id: "proj1",
        name: "Main Street Development",
        client: "Oakridge Development",
        clientId: "client1",
        type: "Commercial",
        status: "In Progress",
        startDate: "2025-03-15",
        endDate: "2025-09-30",
        budget: 1250000,
        location: "123 Main St, Anytown, USA",
        progress: 35,
        assignedCrews: ["crew1", "crew3"],
    },
    {
        id: "proj2",
        name: "Riverside Apartments",
        client: "Riverside Properties",
        clientId: "client2",
        type: "Residential",
        status: "In Progress",
        startDate: "2025-02-01",
        endDate: "2025-08-15",
        budget: 3500000,
        location: "456 River Rd, Anytown, USA",
        progress: 45,
        assignedCrews: ["crew2", "crew4"],
    },
    {
        id: "proj3",
        name: "Downtown Project",
        client: "Metro City Government",
        clientId: "client3",
        type: "Government",
        status: "In Progress",
        startDate: "2025-01-10",
        endDate: "2025-12-20",
        budget: 5750000,
        location: "789 Center Ave, Metro City, USA",
        progress: 20,
        assignedCrews: ["crew3"],
    },
    {
        id: "proj4",
        name: "Johnson Residence",
        client: "Johnson Family",
        clientId: "client7",
        type: "Residential",
        status: "In Progress",
        startDate: "2025-04-01",
        endDate: "2025-07-15",
        budget: 450000,
        location: "321 Oak St, Anytown, USA",
        progress: 65,
        assignedCrews: ["crew5"],
    },
    {
        id: "proj5",
        name: "Greenfield Housing Development",
        client: "Greenfield Homes",
        clientId: "client4",
        type: "Residential",
        status: "Planning",
        startDate: "2025-06-01",
        endDate: "2026-04-30",
        budget: 7500000,
        location: "555 Meadow Ln, Greenfield, USA",
        progress: 5,
        assignedCrews: [],
    },
    {
        id: "proj6",
        name: "Sunrise Senior Living Center",
        client: "Sunrise Senior Living",
        clientId: "client5",
        type: "Healthcare",
        status: "Planning",
        startDate: "2025-07-15",
        endDate: "2026-09-30",
        budget: 8250000,
        location: "777 Sunrise Blvd, Anytown, USA",
        progress: 0,
        assignedCrews: [],
    },
    {
        id: "proj7",
        name: "TechHub Office Renovation",
        client: "TechHub Innovations",
        clientId: "client6",
        type: "Commercial",
        status: "Completed",
        startDate: "2024-10-01",
        endDate: "2025-02-28",
        budget: 1850000,
        location: "999 Innovation Way, Tech City, USA",
        progress: 100,
        assignedCrews: [],
    },
    {
        id: "proj8",
        name: "Parkview Elementary School",
        client: "Parkview School District",
        clientId: "client8",
        type: "Education",
        status: "On Hold",
        startDate: "2025-05-01",
        endDate: "2026-06-30",
        budget: 12500000,
        location: "111 School Rd, Parkview, USA",
        progress: 15,
        assignedCrews: [],
    },
    {
        id: "proj9",
        name: "Mountainside Resort Expansion",
        client: "Mountainside Resorts",
        clientId: "client9",
        type: "Hospitality",
        status: "Planning",
        startDate: "2025-08-01",
        endDate: "2026-12-15",
        budget: 15750000,
        location: "222 Mountain View Rd, Highland, USA",
        progress: 0,
        assignedCrews: [],
    },
    {
        id: "proj10",
        name: "Eastside Community Center",
        client: "Eastside Community Center",
        clientId: "client10",
        type: "Community",
        status: "Bidding",
        startDate: "2025-06-15",
        endDate: "2026-03-30",
        budget: 4250000,
        location: "333 Community Way, Eastside, USA",
        progress: 0,
        assignedCrews: [],
    },
]

export default function ProjectsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("All")
    const [typeFilter, setTypeFilter] = useState("All")
    const [showAddProjectModal, setShowAddProjectModal] = useState(false)

    // Filter projects based on search term and filters
    const filteredProjects = projectsData.filter((project) => {
        const matchesSearch =
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.location.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "All" || project.status === statusFilter
        const matchesType = typeFilter === "All" || project.type === typeFilter

        return matchesSearch && matchesStatus && matchesType
    })

    // Get unique project types for filter
    const projectTypes = ["All", ...new Set(projectsData.map((project) => project.type))]

    // Get unique project statuses for filter
    const projectStatuses = ["All", ...new Set(projectsData.map((project) => project.status))]

    // Calculate project statistics
    const totalProjects = projectsData.length
    const activeProjects = projectsData.filter((project) => project.status === "In Progress").length
    const completedProjects = projectsData.filter((project) => project.status === "Completed").length
    const upcomingProjects = projectsData.filter(
        (project) => project.status === "Planning" || project.status === "Bidding",
    ).length

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <p className="text-base-content/70">Manage and track all your construction projects</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddProjectModal(true)}>
                    <i className="fas fa-plus mr-2"></i> Add Project
                </button>
            </div>

            {/* Project Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-primary/10 p-3 mr-4">
                                <i className="fas fa-project-diagram text-primary text-xl"></i>
                            </div>
                            <div>
                                <div className="text-xs text-base-content/70">Total Projects</div>
                                <div className="text-2xl font-bold">{totalProjects}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-success/10 p-3 mr-4">
                                <i className="fas fa-hammer text-success text-xl"></i>
                            </div>
                            <div>
                                <div className="text-xs text-base-content/70">Active Projects</div>
                                <div className="text-2xl font-bold">{activeProjects}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-info/10 p-3 mr-4">
                                <i className="fas fa-calendar-alt text-info text-xl"></i>
                            </div>
                            <div>
                                <div className="text-xs text-base-content/70">Upcoming Projects</div>
                                <div className="text-2xl font-bold">{upcomingProjects}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-secondary/10 p-3 mr-4">
                                <i className="fas fa-check-circle text-secondary text-xl"></i>
                            </div>
                            <div>
                                <div className="text-xs text-base-content/70">Completed Projects</div>
                                <div className="text-2xl font-bold">{completedProjects}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-control">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    className="input input-bordered w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button className="btn btn-square">
                                    <i className="fas fa-search"></i>
                                </button>
                            </div>
                        </div>

                        <div className="form-control">
                            <select
                                className="select select-bordered w-full"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                {projectStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status === "All" ? "All Statuses" : status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <select
                                className="select select-bordered w-full"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                {projectTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type === "All" ? "All Types" : type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                    <Link
                        href={`/dashboard/projects/${project.id}`}
                        key={project.id}
                        className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="card-body p-4">
                            <div className="flex justify-between items-start">
                                <h3 className="card-title text-lg">{project.name}</h3>
                                <div className={`badge ${getStatusBadgeColor(project.status)}`}>{project.status}</div>
                            </div>
                            <p className="text-sm text-base-content/70">{project.client}</p>
                            <div className="flex items-center text-sm mt-2">
                                <i className="fas fa-map-marker-alt mr-2 text-base-content/70"></i>
                                <span className="truncate">{project.location}</span>
                            </div>
                            <div className="flex items-center text-sm mt-1">
                                <i className="fas fa-calendar-alt mr-2 text-base-content/70"></i>
                                <span>
                                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                </span>
                            </div>
                            <div className="flex items-center text-sm mt-1">
                                <i className="fas fa-dollar-sign mr-2 text-base-content/70"></i>
                                <span>{formatCurrency(project.budget)}</span>
                            </div>
                            <div className="mt-3">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs font-medium">Progress</span>
                                    <span className="text-xs font-medium">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-base-200 rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                </div>
                            </div>
                            {project.assignedCrews.length > 0 && (
                                <div className="mt-3">
                                    <div className="text-xs font-medium mb-1">Assigned Crews:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {project.assignedCrews.map((crewId) => (
                                            <div key={crewId} className="badge badge-outline">
                                                {getCrewName(crewId)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {filteredProjects.length === 0 && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-6 text-center">
                        <i className="fas fa-search text-3xl text-base-content/30 mb-2"></i>
                        <h3 className="text-lg font-semibold">No projects found</h3>
                        <p className="text-base-content/70">Try adjusting your search or filters</p>
                    </div>
                </div>
            )}

            {/* Add Project Modal */}
            {showAddProjectModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-3xl">
                        <h3 className="font-bold text-lg mb-4">Add New Project</h3>
                        <form>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Project Name</span>
                                    </label>
                                    <input type="text" placeholder="Enter project name" className="input input-bordered" />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Client</span>
                                    </label>
                                    <select className="select select-bordered" defaultValue="">
                                        <option disabled value="">
                                            Select a client
                                        </option>
                                        <option>Oakridge Development</option>
                                        <option>Riverside Properties</option>
                                        <option>Metro City Government</option>
                                        <option>Greenfield Homes</option>
                                        <option>Sunrise Senior Living</option>
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Project Type</span>
                                    </label>
                                    <select className="select select-bordered" defaultValue="">
                                        <option disabled value="">
                                            Select project type
                                        </option>
                                        <option>Commercial</option>
                                        <option>Residential</option>
                                        <option>Government</option>
                                        <option>Healthcare</option>
                                        <option>Education</option>
                                        <option>Hospitality</option>
                                        <option>Community</option>
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Status</span>
                                    </label>
                                    <select className="select select-bordered" defaultValue="">
                                        <option disabled value="">
                                            Select status
                                        </option>
                                        <option>Planning</option>
                                        <option>Bidding</option>
                                        <option>In Progress</option>
                                        <option>On Hold</option>
                                        <option>Completed</option>
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Start Date</span>
                                    </label>
                                    <input type="date" className="input input-bordered" />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">End Date</span>
                                    </label>
                                    <input type="date" className="input input-bordered" />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Budget</span>
                                    </label>
                                    <input type="number" placeholder="Enter budget amount" className="input input-bordered" />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Location</span>
                                    </label>
                                    <input type="text" placeholder="Enter project location" className="input input-bordered" />
                                </div>
                            </div>
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Project Description</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered h-24"
                                    placeholder="Enter project description"
                                ></textarea>
                            </div>
                            <div className="modal-action">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAddProjectModal(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={() => setShowAddProjectModal(false)}>
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddProjectModal(false)}></div>
                </div>
            )}
        </div>
    )
}

// Helper functions
function formatDate(dateString: string | number | Date) {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
}

function formatCurrency(amount: string | number | bigint) {
    const numericAmount = typeof amount === "string" ? Number(amount) : amount
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(numericAmount)
}

function getStatusBadgeColor(status: string) {
    switch (status) {
        case "In Progress":
            return "badge-primary"
        case "Completed":
            return "badge-success"
        case "Planning":
            return "badge-info"
        case "Bidding":
            return "badge-warning"
        case "On Hold":
            return "badge-error"
        default:
            return "badge-ghost"
    }
}

function getCrewName(crewId: string) {
    const crews: Record<string, string> = {
        crew1: "Foundation Team",
        crew2: "Framing Crew",
        crew3: "Electrical Team",
        crew4: "Plumbing Specialists",
        crew5: "Finishing Crew",
    }
    return crews[crewId] || "Unknown Crew"
}
