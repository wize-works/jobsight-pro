"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Project, ProjectStatus, projectStatusOptions } from "@/types/projects";
import { getProjectById } from "@/app/actions/projects";
import { getProjectMilestonesByProjectId } from "@/app/actions/project_milestones";
import { getTasksByProjectId } from "@/app/actions/tasks";
import { getClientById } from "@/app/actions/clients";
import { toast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import { ProjectMilestone, ProjectMilestoneStatus, projectMilestoneStatusOptions } from "@/types/project_milestones";
import { Task, TaskStatus, taskStatusOptions, TaskWithDetails } from "@/types/tasks";
import { progressBar } from "@/utils/progress";
import { formatDistance, formatDistanceToNow } from "date-fns";
import TasksTab from "../components/tab-tasks";
import { Client } from "@/types/clients";
import CrewsTab from "../components/tab-crews";
import { getClientContactsByClientId } from "@/app/actions/client-contacts";
import { ClientContact } from "@/types/client-contacts";
import { getCrews, getCrewsByProjectId } from "@/app/actions/crews";
import { CrewWithMemberInfo } from "@/types/crews";

const formatDate = (dateString: string): string => {
    if (!dateString) return "Not set";

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (error) {
        return dateString;
    }
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [project, setProject] = useState<Project>();
    const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
    const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
    const [client, setClient] = useState<Client | null>(null);
    const [contacts, setContacts] = useState<ClientContact[]>([]);
    const [crews, setCrews] = useState<CrewWithMemberInfo[]>([]);

    useEffect(() => {
        const fetchClients = async () => {
            const { id } = await params;
            console.log("Fetching project with ID:", id);
            try {
                const [projectData, milestonesData, tasksData, crewsData] = await Promise.all([
                    getProjectById(id),
                    getProjectMilestonesByProjectId(id),
                    getTasksByProjectId(id),
                    getCrewsByProjectId(id)
                ]);
                setProject(projectData);
                setMilestones(milestonesData);
                setTasks(tasksData);
                setCrews(crewsData);

                if (projectData && projectData.client_id) {
                    const clientData = await getClientById(projectData.client_id);
                    setClient(clientData);

                    const contactsData = await getClientContactsByClientId(projectData.client_id);
                    setContacts(contactsData);
                } else {
                    setClient(null);
                }
                console.log('tasks data:', tasksData);
                setLoading(false);

            } catch (error) {
                console.error("Error fetching project:", error);
                toast.error("Failed to load project details.");
            }
        }
        fetchClients();
    }, [params]);

    if (loading) {
        return (
            <Loading />
        );
    }

    if (!project) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold">Project not found</h2>
                <p className="text-base-content/70">The project you are looking for does not exist.</p>
                <Link href="/dashboard/projects" className="btn btn-primary mt-4">
                    <i className="fas fa-arrow-left mr-2"></i> Back to Projects
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/projects" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{project.name}</h1>hi
                        {projectStatusOptions.badge(project.status as ProjectStatus)}
                    </div>
                    <p className="text-base-content/70 mt-1">
                        Client:{" "}
                        <Link href={`/dashboard/clients/${project.client_id}`} className="link link-hover">
                            {client?.name || "Not specified"}
                        </Link>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm">
                        <i className="fas fa-edit mr-2"></i> Edit
                    </button>
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-primary btn-sm">
                            <i className="fas fa-plus mr-2"></i> Actions
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <a>Add Task</a>
                            </li>
                            <li>
                                <a>Add Milestone</a>
                            </li>
                            <li>
                                <a>Assign Crew</a>
                            </li>
                            <li>
                                <a>Upload Document</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <h2 className="card-title">Project Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">Project Type</h4>
                                        <p>{project.type || "Not specified"}</p>
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">Location</h4>
                                        <p>{project.location || "Not specified"}</p>
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">Project Manager</h4>
                                        <p>{project.manager_id || "Not assigned"}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">Start Date</h4>
                                        <p>{formatDate(project.start_date || "")}</p>
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">End Date</h4>
                                        <p>{formatDate(project.end_date || "")}</p>
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">Budget</h4>
                                        <p>{formatCurrency(project.budget || 0.00)}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-base-content/70 mb-2">Description</h4>
                                <p>{project.description || "No description provided"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="tabs tabs-box mb-6">
                        <button className={`tab ${activeTab === "overview" ? "tab-active" : ""}`} onClick={() => setActiveTab("overview")} >Overview</button>
                        <button className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`} onClick={() => setActiveTab("tasks")}>Tasks</button>
                        <button className={`tab ${activeTab === "crew" ? "tab-active" : ""}`} onClick={() => setActiveTab("crew")}>Crew</button>
                        <button className={`tab ${activeTab === "budget" ? "tab-active" : ""}`} onClick={() => setActiveTab("budget")}>Budget</button>
                        <button className={`tab ${activeTab === "issues" ? "tab-active" : ""}`} onClick={() => setActiveTab("issues")}>Issues</button>
                        <button className={`tab ${activeTab === "documents" ? "tab-active" : ""}`} onClick={() => setActiveTab("documents")}>Documents</button>
                    </div>
                    {activeTab === "overview" && (
                        <>
                            <div className="card bg-base-100 shadow-sm mb-6">
                                <div className="card-body">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Milestones</h3>
                                        <button className="btn btn-sm btn-outline">
                                            <i className="fas fa-plus mr-2"></i> Add Milestone
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra">
                                            <thead>
                                                <tr>
                                                    <th>Milestone</th>
                                                    <th>Due Date</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {milestones?.map((milestone) => (
                                                    <tr key={milestone.id}>
                                                        <td>
                                                            <div className="font-medium">{milestone.name}</div>
                                                            <div className="text-sm text-base-content/70">{milestone.description}</div>
                                                        </td>
                                                        <td>{formatDate(milestone.due_date || "")}</td>
                                                        <td>
                                                            {projectMilestoneStatusOptions.badge(milestone.status as ProjectMilestoneStatus)}
                                                        </td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <button className="btn btn-ghost btn-xs">
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) || (
                                                        <tr>
                                                            <td colSpan={4} className="text-center py-4">No milestones added yet</td>
                                                        </tr>
                                                    )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-base-100 shadow-sm mb-6">
                                <div className="card-body">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Recent Tasks</h3>
                                        <button className="btn btn-sm btn-outline">
                                            <i className="fas fa-eye mr-2"></i> View All
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra">
                                            <thead>
                                                <tr>
                                                    <th>Task</th>
                                                    <th>Assigned To</th>
                                                    <th>Status</th>
                                                    <th>Progress</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tasks?.slice(0, 3).map((task) => (
                                                    <tr key={task.id}>
                                                        <td>
                                                            <div className="font-medium">{task.name}</div>
                                                            <div className="text-xs text-base-content/70">
                                                                {formatDate(task.start_date || "")} - {formatDate(task.end_date || "")}
                                                            </div>
                                                        </td>
                                                        <td>{task.assigned_to || task.assigned_to || "Unassigned"}</td>
                                                        <td>
                                                            {taskStatusOptions.badge(task.status as TaskStatus)}
                                                        </td>
                                                        <td>
                                                            {progressBar(task.progress, 100)}
                                                        </td>
                                                    </tr>
                                                )) || (
                                                        <tr>
                                                            <td colSpan={4} className="text-center py-4">No tasks added yet</td>
                                                        </tr>
                                                    )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "tasks" && (
                        <TasksTab tasks={tasks} />
                    )}
                    {activeTab === "crew" && (
                        <CrewsTab crews={crews} />
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span>Overall Progress</span>
                                    <span className="font-semibold">{project.progress || 0}%</span>
                                </div>
                                <progress
                                    className="progress progress-primary w-full"
                                    value={project.progress || 0}
                                    max="100"
                                ></progress>
                            </div>
                            <div className="stats stats-vertical shadow">
                                <div className="stat">
                                    <div className="stat-title">Elapsed Time</div>
                                    <div className="stat-value text-lg">
                                        {formatDistanceToNow(project.start_date || "")}
                                    </div>

                                    <div className="stat-desc">
                                        of {formatDistance(project.start_date || "", project.end_date || new Date())}
                                    </div>
                                </div>

                                <div className="stat">
                                    <div className="stat-title">Budget Used</div>
                                    <div className="badge badge-info mt-2">coming soon</div>
                                    <div className="hidden">
                                        TODO: Update this to show actual budget usage
                                        <div className="stat-value text-lg">
                                            {project.budget || 0}%
                                        </div>
                                        <div className="stat-desc">
                                            {formatCurrency((project.budget || 0) * ((project.budget || 0) / 100))}
                                        </div>
                                    </div>
                                </div>

                                <div className="stat">
                                    <div className="stat-title">Tasks Completed</div>
                                    <div className="stat-value text-lg">
                                        {tasks.filter((task) => task.status === "completed").length || 0}
                                    </div>
                                    <div className="stat-desc">of {tasks?.length || 0} total tasks</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <h3 className="text-lg font-semibold mb-4">Client Contacts</h3>
                            {contacts?.map((contact, index) => (
                                <div key={contact.email || index} className={index > 0 ? "mt-4 pt-4 border-t" : ""}>
                                    <p className="font-medium">{contact.name}</p>
                                    <p className="text-sm">{contact.is_primary}</p>
                                    <a href={`mailto:${contact.email}`} className="text-sm link link-primary">
                                        <i className="fas fa-envelope mr-1"></i> {contact.email}
                                    </a>
                                    <p className="text-sm">
                                        <i className="fas fa-phone mr-1"></i> {contact.phone}
                                    </p>
                                </div>
                            )) || <p>No contacts available.</p>}
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Assigned Crews</h3>
                                <button className="btn btn-sm btn-primary">
                                    <i className="fas fa-plus mr-1"></i> Assign
                                </button>
                            </div>
                            {crews?.map((crew) => (
                                <div key={crew.id} className="mb-3">
                                    <div className="font-medium">
                                        <Link href={`/dashboard/crews/${crew.id}`} className="link link-hover">
                                            {crew.name}
                                        </Link>
                                    </div>
                                    <p className="text-xs text-base-content/70">
                                        Led by {crew.leader_name} • {crew.member_count} members
                                    </p>
                                </div>
                            )) || <p>No crews assigned.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

