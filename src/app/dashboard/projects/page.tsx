"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProjectStatus, projectStatusOptions, ProjectType, projectTypeOptions, ProjectWithDetails } from "@/types/projects";
import { progressBar } from "@/utils/progress";
import { getProjectsWithDetails } from "@/app/actions/projects";
import Loading from "@/app/loading";


export default function ProjectsPage() {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && localStorage.getItem("projectsViewType") === "list" ? "list" : "grid"
    );
    const [search, setSearch] = useState("");
    const [showAddProjectModal, setShowAddProjectModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sortOption, setSortOption] = useState("name");

    // Calculate project statistics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((project) => project.status === "in_progress").length;
    const completedProjects = projects.filter((project) => project.status === "completed").length;
    const upcomingProjects = projects.filter(
        (project) => project.status === "planning" || project.status === "bidding",
    ).length;

    const filteredProjects = projects.filter((project) => {
        const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || project.status === statusFilter.toLowerCase();
        const matchesType = typeFilter === "all" || project.type === typeFilter.toLowerCase();
        return matchesSearch && matchesStatus && matchesType;
    });

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            const projectsData = await getProjectsWithDetails();
            setProjects(projectsData);
            setLoading(false);
        }
        fetchProjects();
    }, []);

    const updateViewType = (type: "grid" | "list") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            localStorage.setItem("projectsViewType", type);
        }
    };

    if (loading) {
        return (
            <Loading />
        );
    }

    return (
        <>
            <div className="flex justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Project Management</h1>
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
            <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="input input-bordered input-secondary flex items-center gap-2 w-full">
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    className="input input-bordered w-full"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </label>
                        </div>
                        {projectStatusOptions.select(
                            statusFilter as ProjectStatus | null | undefined,
                            (value) => setStatusFilter(value as ProjectStatus)
                        )}
                        {projectTypeOptions.select(
                            typeFilter as ProjectType | null | undefined,
                            (value) => setTypeFilter(value as string)
                        )}

                        <div className="form-control">
                            <select
                                className="select select-bordered w-full"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Start Date</option>
                                <option value="budget">Sort by Budget</option>
                                <option value="progress">Sort by Progress</option>
                            </select>
                        </div>
                        <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                            <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="fas fa-grid-2"></i> </button>
                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="fas fa-table-rows"></i> </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Projects Grid/List View */}
            {viewType === "grid" ? (
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
                                    {projectStatusOptions.badge(project.status as ProjectStatus)}
                                </div>
                                <p className="text-sm text-base-content/70">{project.client_name}</p>
                                <div className="flex items-center text-sm mt-2">
                                    <i className="fas fa-map-marker-alt mr-2 text-base-content/70"></i>
                                    <span className="truncate">{project.location}</span>
                                </div>
                                <div className="flex items-center text-sm mt-1">
                                    <i className="fas fa-calendar-alt mr-2 text-base-content/70"></i>
                                    <span>
                                        {formatDate(project?.start_date)} - {formatDate(project.end_date)}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm mt-1">
                                    <i className="fas fa-dollar-sign mr-2 text-base-content/70"></i>
                                    <span>{formatCurrency(project.budget)}</span>
                                </div>

                                <div className="mt-3">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-medium">Progress</span>
                                        <span className="text-xs font-medium">{project.progress}%</span>
                                    </div>
                                    {progressBar(project.progress, 100)}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-0">
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Client</th>
                                        <th>Status</th>
                                        <th>Timeline</th>
                                        <th>Budget</th>
                                        <th>Progress</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProjects.map((project) => (
                                        <tr key={project.id}>
                                            <td>
                                                <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:text-primary">
                                                    {project.name}
                                                </Link>
                                            </td>
                                            <td>{project.client_name}</td>
                                            <td>
                                                {projectStatusOptions.badge(project.status as ProjectStatus)}
                                            </td>
                                            <td>
                                                <div className="text-sm">
                                                    {formatDate(project.start_date)} - {formatDate(project.end_date)}
                                                </div>
                                            </td>
                                            <td>{formatCurrency(project.budget)}</td>
                                            <td>
                                                {progressBar(project.progress, 100)}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <Link
                                                        href={`/dashboard/projects/${project.id}`}
                                                        className="btn btn-ghost btn-xs"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </Link>
                                                    <button className="btn btn-ghost btn-xs">
                                                        <i className="fas fa-edit"></i>
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

            {projects.length === 0 && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-6 text-center">
                        <i className="fas fa-project-diagram text-3xl text-base-content/30 mb-2"></i>
                        <h3 className="text-lg font-semibold">No projects found</h3>
                        <p className="text-base-content/70">Try adjusting your search or filters</p>
                        <button
                            className="btn btn-primary mt-4"
                            onClick={() => setShowAddProjectModal(true)}
                        >
                            <i className="fas fa-plus mr-2"></i> Add Your First Project
                        </button>
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
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Project Type</span>
                                    </label>
                                    <select className="select select-bordered" defaultValue="">
                                        <option disabled value="">
                                            Select type
                                        </option>
                                        <option value="commercial">Commercial</option>
                                        <option value="residential">Residential</option>
                                        <option value="industrial">Industrial</option>
                                        <option value="government">Government</option>
                                        <option value="healthcare">Healthcare</option>
                                        <option value="education">Education</option>
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
                                        <option value="planning">Planning</option>
                                        <option value="bidding">Bidding</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="on_hold">On Hold</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        </>
    );
}

// Helper functions
function formatDate(dateString?: string | null): string {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return "$0";
    if (isNaN(amount)) return "$0";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);
}

function getStatusBadgeColor(status: string) {
    const colors: { [key: string]: string } = {
        planning: "badge-info",
        bidding: "badge-warning",
        in_progress: "badge-primary",
        completed: "badge-success",
        on_hold: "badge-neutral",
    };
    return colors[status] || "badge-neutral";
}
