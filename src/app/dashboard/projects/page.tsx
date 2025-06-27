"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Project, ProjectStatus, projectStatusOptions, ProjectType, projectTypeOptions, ProjectWithDetails } from "@/types/projects";
import { progressBar } from "@/utils/progress";
import { formatDate, formatCurrency } from "@/utils/date";
import { createProject, getProjects, updateProjectById, getProjectsWithDetails } from "@/lib/actions/projects-client";
import { ProjectCard } from "./components/card";
import { useBusiness } from "@/lib/business-context";
import ProjectsLoading from "./loading";
import ErrorBoundary from "@/components/error-boundary";
import ModalLoading from "@/components/modal-loading";

// Lazy load modal components for better performance
const ProjectModal = dynamic(() => import("./components/modal-project"), {
    loading: () => <ModalLoading message="Loading project form..." />,
    ssr: false
});

const ProjectEditModal = dynamic(() => import("./components/modal-edit"), {
    loading: () => <ModalLoading message="Loading edit form..." />,
    ssr: false
});

export default function ProjectsPage() {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && localStorage.getItem("projectsViewType") === "list" ? "list" : "grid"
    );
    const [search, setSearch] = useState("");
    const [showAddProjectModal, setShowAddProjectModal] = useState(false);
    const [showEditProjectModal, setShowEditProjectModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(null);
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

    // Sort the filtered projects
    const sortedAndFilteredProjects = [...filteredProjects].sort((a, b) => {
        switch (sortOption) {
            case "name":
                return a.name.localeCompare(b.name);
            case "date":
                if (!a.start_date && !b.start_date) return 0;
                if (!a.start_date) return 1;
                if (!b.start_date) return -1;
                return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
            case "budget":
                const budgetA = a.budget || 0;
                const budgetB = b.budget || 0;
                return budgetB - budgetA; // Descending order for budget
            case "progress":
                const progressA = a.progress || 0;
                const progressB = b.progress || 0;
                return progressB - progressA; // Descending order for progress
            default:
                return 0;
        }
    });

    useEffect(() => {
        if (businessId === undefined || businessId === null || businessId === "") {
            setLoading(true);
            return;
        }
        const fetchProjects = async () => {
            setLoading(true);
            const projectsData = await getProjectsWithDetails(businessId);
            setProjects(projectsData);
            setLoading(false);
        }
        fetchProjects();
    }, [businessId]);

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
    }; const handleProjectSave = async (projectData: any) => {
        try {
            // Create the new project with correct API
            await createProject(projectData, businessId);

            // Refresh the projects list after successful creation
            const projectsData = await getProjectsWithDetails(businessId);
            setProjects(projectsData);
            setShowAddProjectModal(false);
        } catch (error) {
            console.error("Error saving project:", error);
            // Don't close modal on error so user can retry
            throw error; // Re-throw so modal can handle the error
        }
    };

    const handleEditProject = (project: ProjectWithDetails) => {
        setSelectedProject(project);
        setShowEditProjectModal(true);
    };

    const handleEditProjectSave = async (updatedProject: Project) => {
        // Refresh the projects list after successful update
        const projectsData = await getProjectsWithDetails(businessId);
        setProjects(projectsData);
        setShowEditProjectModal(false);
        setSelectedProject(null);
    }; if (loading) {
        return (
            <ProjectsLoading viewType={viewType} />
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
                    <i className="far fa-plus mr-2"></i> Add Project
                </button>
            </div>            {/* Project Statistics */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error mb-6">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load project statistics</h3>
                        <div className="text-xs">Project stats are temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="stat bg-base-100 shadow-lg">
                        <div className="stat-title">Total Projects</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-primary">{totalProjects}</div>
                            <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-screwdriver-wrench text-primary text-2xl"></i>
                            </div>
                        </div>
                        <div className="stat-desc">All projects across all statuses</div>
                    </div>

                    <div className="stat bg-base-100 shadow-lg">
                        <div className="stat-title">Active Projects</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-success">{activeProjects}</div>
                            <div className="stat-icon text-success bg-success/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-hammer text-success text-2xl"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Projects currently in progress</div>
                    </div>

                    <div className="stat bg-base-100 shadow-lg">
                        <div className="stat-title">Upcoming Projects</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-info">{upcomingProjects}</div>
                            <div className="stat-icon text-info bg-info/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-calendar-alt text-info text-2xl"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Projects scheduled to start soon</div>
                    </div>
                    <div className="stat bg-base-100 shadow-lg">
                        <div className="stat-title">Completed Projects</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-secondary">{completedProjects}</div>
                            <div className="stat-icon text-secondary bg-secondary/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-check-circle text-secondary text-2xl"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Projects successfully completed</div>
                    </div>
                </div>
            </ErrorBoundary>

            {/* Filters and Search */}
            <div className="card bg-base-100 shadow-lg mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        <label className="input input-bordered input-secondary flex items-center gap-2 w-full">
                            <i className="far fa-search"></i>
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
                            <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="far fa-grid-2"></i> </button>
                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="far fa-table-rows"></i> </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Projects Grid/List View */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load projects</h3>
                        <div className="text-xs">Project list is temporarily unavailable. Please refresh the page.</div>
                    </div>
                </div>
            )}>
                {viewType === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedAndFilteredProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                    <div className="card bg-base-100 shadow-lg">
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
                                        {sortedAndFilteredProjects.map((project) => (
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
                                                            <i className="far fa-eye"></i>
                                                        </Link>                                                    <button
                                                            className="btn btn-ghost btn-xs"
                                                            onClick={() => handleEditProject(project)}
                                                        >
                                                            <i className="far fa-edit"></i>
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
                )}            {projects.length === 0 && (
                    <div className="card bg-base-100 shadow-lg mb-6">
                        <div className="card-body text-center">
                            <i className="far fa-screwdriver-wrench text-3xl text-base-content/30 mb-2"></i>
                            <h3 className="text-lg font-semibold">No projects found</h3>
                            <p className="text-base-content/70">Get started by creating your first project</p>
                            <div className="flex m-auto justify-center mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowAddProjectModal(true)}
                                >
                                    <i className="far fa-plus mr-2"></i> Add Your First Project
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {projects.length > 0 && sortedAndFilteredProjects.length === 0 && (
                    <div className="card bg-base-100 shadow-lg mb-6">
                        <div className="card-body text-center">
                            <i className="far fa-filter text-3xl text-base-content/30 mb-2"></i>
                            <h3 className="text-lg font-semibold">No projects match your filters</h3>
                            <p className="text-base-content/70">Try adjusting your search or filter criteria</p>
                            <div className="flex m-auto justify-center mt-4">
                                <button
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setSearch("");
                                        setStatusFilter("all");
                                        setTypeFilter("all");
                                    }}                            >
                                    <i className="far fa-refresh mr-2"></i> Clear Filters
                                </button>
                            </div>                    </div>
                    </div>
                )}
            </ErrorBoundary>

            {/* Add Project Modal */}
            {showAddProjectModal && (
                <ProjectModal isOpen={showAddProjectModal} onClose={() => setShowAddProjectModal(false)} onSave={handleProjectSave} />
            )}

            {/* Edit Project Modal */}
            {showEditProjectModal && selectedProject && (
                <ProjectEditModal
                    isOpen={showEditProjectModal}
                    onClose={() => {
                        setShowEditProjectModal(false);
                        setSelectedProject(null);
                    }}
                    project={selectedProject}
                    onSave={handleEditProjectSave}
                />
            )}
        </>
    );
}