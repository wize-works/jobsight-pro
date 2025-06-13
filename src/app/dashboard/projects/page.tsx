"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project, ProjectStatus, projectStatusOptions, ProjectType, projectTypeOptions, ProjectWithDetails } from "@/types/projects";
import { progressBar } from "@/utils/progress";
import { createProject, getProjectsWithDetails, updateProject } from "@/app/actions/projects";
import Loading from "@/app/loading";
import ProjectModal from "./components/modal-project";


export default function ProjectsPage() {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && localStorage.getItem("projectsViewType") === "list" ? "list" : "grid"
    );
    const [search, setSearch] = useState("");
    const [showAddProjectModal, setShowAddProjectModal] = useState(false);
    const [showAddIssueModal, setShowAddIssueModal] = useState(false);
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

    const handleIssueSave = async (issue: any) => {
        // Placeholder for issue saving logic
        console.log("Issue saved:", issue);
        setShowAddProjectModal(false);
    }

    const handleProjectSave = async (project: any) => {
        if (project.id) {
            updateProject(project.id, project);
        } else {
            createProject(project);
        }
        setShowAddProjectModal(false);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title">Total Projects</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-primary">{totalProjects}</div>
                        <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-person-digging text-primary text-2xl"></i>
                        </div>
                    </div>
                    <div className="stat-desc">All projects across all statuses</div>
                </div>

                <div className="stat bg-base-100 shadow">
                    <div className="stat-title">Active Projects</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-success">{activeProjects}</div>
                        <div className="stat-icon text-success bg-success/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-hammer text-success text-2xl"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Projects currently in progress</div>
                </div>

                <div className="stat bg-base-100 shadow">
                    <div className="stat-title">Upcoming Projects</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-info">{upcomingProjects}</div>
                        <div className="stat-icon text-info bg-info/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-calendar-alt text-info text-2xl"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Projects scheduled to start soon</div>
                </div>
                <div className="stat bg-base-100 shadow">
                    <div className="stat-title">Completed Projects</div>
                    <div className="flex items-center justify-between">
                        <div className="stat-value text-secondary">{completedProjects}</div>
                        <div className="stat-icon text-secondary bg-secondary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-check-circle text-secondary text-2xl"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Projects successfully completed</div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-6">
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
                        {projectStatusOptions.select(
                            statusFilter as ProjectStatus | null | undefined,
                            (value) => setStatusFilter(value as ProjectStatus),
                            "select-secondary w-full"
                        )}
                        {projectTypeOptions.select(
                            typeFilter as ProjectType | null | undefined,
                            (value) => setTypeFilter(value as string),
                            "select-secondary w-full"
                        )}

                        <select
                            className="select select-bordered select-secondary w-full"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="name">Sort by Name</option>
                            <option value="date">Sort by Start Date</option>
                            <option value="budget">Sort by Budget</option>
                            <option value="progress">Sort by Progress</option>
                        </select>
                        <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                            <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="fas fa-grid-2"></i> </button>
                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="fas fa-table-rows"></i> </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Projects Grid/List View */}
            {viewType === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="card bg-base-100 shadow-sm mb-6">
                    <div className="card-body text-center">
                        <i className="fas fa-project-diagram text-3xl text-base-content/30 mb-2"></i>
                        <h3 className="text-lg font-semibold">No projects found</h3>
                        <p className="text-base-content/70">Try adjusting your search or filters</p>
                        <div className="flex m-auto justify-center mt-4">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddProjectModal(true)}
                            >
                                <i className="fas fa-plus mr-2"></i> Add Your First Project
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Project Modal */}
            {showAddProjectModal && (
                <ProjectModal isOpen={showAddProjectModal} onClose={() => setShowAddProjectModal(false)} onSave={() => setShowAddProjectModal(false)} />
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