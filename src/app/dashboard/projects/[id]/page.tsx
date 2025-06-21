"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { getProjectById, getProjectDetailsByID, updateProject } from "@/app/actions/projects";
import { createProjectMilestone, getProjectMilestonesByProjectId, updateProjectMilestone } from "@/app/actions/project-milestones";
import { getTasksByProjectId, createTask, updateTask } from "@/app/actions/tasks";
import { getClientById } from "@/app/actions/clients";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/types/clients";
import { getClientContactsByClientId } from "@/app/actions/client-contacts";
import { ClientContact } from "@/types/client-contacts";
import { getCrewsByProjectId } from "@/app/actions/crews";
import { getProjectIssuesWithDetailsByProjectId } from "@/app/actions/projects-issues";
import { getMediaByProjectId } from "@/app/actions/media";
import { getCrewMemberById, getCrewMembers } from "@/app/actions/crew-members";
import { CrewMember } from "@/types/crew-members";
import { useBusiness } from "@/lib/business-context";
import { Project, ProjectInsert, ProjectStatus, projectStatusOptions } from "@/types/projects";
import { ProjectMilestone, ProjectMilestoneStatus, projectMilestoneStatusOptions } from "@/types/project_milestones";
import { Task, TaskStatus, taskStatusOptions, TaskWithDetails } from "@/types/tasks";
import { ProjectIssue, ProjectIssueWithDetails } from "@/types/projects-issues";
import { Media } from "@/types/media";
import { CrewWithMemberInfo } from "@/types/crews";
import Loading from "@/app/loading";
import { progressBar } from "@/utils/progress";
import { formatDistance, formatDistanceToNow } from "date-fns";
import { formatDate, formatCurrency } from "@/utils/date";
import TasksTab from "../components/tab-tasks";
import CrewsTab from "../components/tab-crews";
import IssuesTab from "../components/tab-issues";
import IssueModal from "../components/modal-issues";
import MediaTab from "../components/tab-media";
import MilestoneModal from "../components/modal-milestone";
import ProjectEditModal from "../components/modal-edit";
import TaskModal from "../components/modal-task";
import MediaModal from "../components/modal-media";
import WeatherWidget from "@/components/weather-widget";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [project, setProject] = useState<Project>({} as Project);
    const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
    const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
    const [crews, setCrews] = useState<CrewWithMemberInfo[]>([]);
    const [issues, setIssues] = useState<ProjectIssueWithDetails[]>([]);
    const [client, setClient] = useState<Client | null>(null);
    const [contacts, setContacts] = useState<ClientContact[]>([]);
    const [manager, setManager] = useState<CrewMember | null>(null);
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [mediaModalOpen, setMediaModalOpen] = useState(false);

    // Refs to prevent multiple fetches
    const hasFetched = useRef(false);
    const currentFetchKey = useRef<string>("");

    // Resolve params once and store the ID
    useEffect(() => {
        const resolveParams = async () => {
            const resolvedParams = await params;
            setProjectId(resolvedParams.id);
        };
        resolveParams();
    }, [params]);

    // Fetch data when projectId or businessId changes
    useEffect(() => {
        if (!projectId || !businessId) {
            return;
        }

        // Create a unique key for this fetch
        const fetchKey = `${businessId}-${projectId}`;

        // Prevent duplicate fetches
        if (currentFetchKey.current === fetchKey && hasFetched.current) {
            return;
        }

        console.log("Fetching data for", fetchKey);
        currentFetchKey.current = fetchKey;
        hasFetched.current = true;
        const fetchData = async () => {
            setLoading(true);

            try {

                const projectDetails = await getProjectDetailsByID(businessId, projectId);
                if (projectDetails) {
                    const {
                        project,
                        milestones,
                        tasks,
                        crews,
                        issues,
                        client,
                        contacts,
                        manager,
                        stats
                    } = projectDetails;

                    setProject(project);
                    setMilestones(milestones);
                    setTasks(tasks);
                    setCrews(crews);
                    setIssues(issues);
                    setClient(client);
                    setContacts(contacts);
                    setManager(manager);
                    // Can also use stats for dashboard metrics
                }

                if (project && project.client_id) {
                    const clientData = await getClientById(businessId, project.client_id);
                    const contactsData = await getClientContactsByClientId(businessId, project.client_id);
                    setClient(clientData);
                    setContacts(contactsData);
                }

                if (project && project.manager_id) {
                    const managerData = await getCrewMemberById(businessId, project.manager_id);
                    setManager(managerData);
                }

            } catch (error) {
                console.error("Error fetching project:", error);
                toast.error("Failed to load project details.");
                // Reset fetch tracking on error so it can be retried
                hasFetched.current = false;
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId, businessId]);

    const handleEditMilestone = (milestone: ProjectMilestone) => {
        setSelectedMilestone(milestone);
        setMilestoneModalOpen(true);
    };

    const handleEditTask = (task: TaskWithDetails) => {
        setSelectedTask(task);
        setTaskModalOpen(true);
    };

    const handleMilestoneSave = async (milestone: ProjectMilestone) => {
        if (selectedMilestone) {
            await updateProjectMilestone(businessId, selectedMilestone.id, milestone);
            setMilestones((prev) => prev.map((m) => m.id === milestone.id ? milestone : m));
        } else {
            await createProjectMilestone(businessId, milestone);
            setMilestones((prev) => [...prev, milestone]);
        }
        setMilestoneModalOpen(false);
        setSelectedMilestone(null);
        toast.success("Milestone saved successfully!");
    };

    const handleMilestoneModalClose = () => {
        setMilestoneModalOpen(false);
        setSelectedMilestone(null);
    };

    const handleTaskSave = async (task: Task) => {
        if (selectedTask) {
            await updateTask(businessId, selectedTask.id, task);
            setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, ...task } as TaskWithDetails : t));
        } else {
            await createTask(businessId, task);
            // We need to fetch the updated task list since the new task might have additional details
            if (projectId) {
                const updatedTasks = await getTasksByProjectId(businessId, projectId);
                setTasks(updatedTasks);
            }
        }
        setTaskModalOpen(false);
        setSelectedTask(null);
        toast.success("Task saved successfully!");
    };

    const handleTaskModalClose = () => {
        setTaskModalOpen(false);
        setSelectedTask(null);
    };

    if (loading || !projectId) {
        return <Loading />;
    }

    if (!project || !project.id) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold">Project not found</h2>
                <p className="text-base-content/70">The project you are looking for does not exist.</p>
                <Link href="/dashboard/projects" className="btn btn-primary mt-4">
                    <i className="far fa-arrow-left mr-2"></i> Back to Projects
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/projects" className="btn btn-outline">
                            <i className="far fa-arrow-left mr-2"></i> Back to Projects
                        </Link>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline" onClick={() => setEditModalOpen(true)}>
                        <i className="far fa-edit mr-2"></i> Edit
                    </button>
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-primary">
                            <i className="far fa-plus mr-2"></i> Actions
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <button onClick={() => setTaskModalOpen(true)}>Add Task</button>
                            </li>
                            <li>
                                <button onClick={() => setMilestoneModalOpen(true)}>Add Milestone</button>
                            </li>
                            <li>
                                <button>Assign Crew</button>
                            </li>
                            <li>
                                <button onClick={() => setMediaModalOpen(true)}>Upload Media</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-primary/10 p-3 mr-4 h-10 w-10 flex items-center justify-center">
                                <i className="far fa-calendar-alt fa-bounce fa-lg fa-fw text-primary"></i>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg text-base-content font-medium">Last updated {formatDate(project.updated_at || "")}</span>
                                <span className="text-sm text-base-content/50">Created on {formatDate(project.created_at || "")}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-accent/10 p-3 mr-4 h-10 w-10 flex items-center justify-center">
                                <i className="far fa-users fa-beat fa-lg fa-fw text-accent"></i>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg text-base-content font-medium">Managed by {manager?.name || "Not assigned"}</span>
                                <span className="text-sm text-base-content/50">Team size: {crews.length} crews</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-info/10 p-3 mr-4 h-10 w-10 flex items-center justify-center">
                                <i className="far fa-spinner-third fa-spin fa-lg fa-fw text-info"></i>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg text-base-content font-medium">Progress: {progress || 0}%</span>
                                <span className="text-sm text-base-content/50">Status: {projectStatusOptions.badge(project.status as ProjectStatus, "badge-xs")}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                        <div className="flex items-center gap-2">
                            <div className="rounded-full bg-success/10 p-3 mr-4 h-10 w-10 flex items-center justify-center">
                                <i className="far fa-dollar-sign fa-flip fa-lg fa-fw text-success"></i>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-lg text-base-content font-medium">Budget: {formatCurrency(project.budget || 0.00)}</span>
                                <span className="text-sm text-base-content/50">Spent: {formatCurrency((project.budget || 0) * (progress / 100))}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col justify-start items-start gap-2 mb-4">
                                    <div className="flex justify-start items-start gap-6">
                                        <h1 className="text-2xl font-bold">{project.name}</h1>
                                        {projectStatusOptions.badge(project.status as ProjectStatus)}
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="font-medium">Project Manager</h4>
                                        <p>{manager?.name || "Not assigned"}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start gap-2">
                                    <div className="text-base-content/70 mt-1">
                                        <div className="text-xl">
                                            Client:{" "}
                                            <Link href={`/dashboard/clients/${project.client_id}`} className="link link-hover">
                                                {client?.name || "Not specified"}
                                            </Link>
                                        </div>
                                        <address className="text-sm text-base-content/70">
                                            {client?.address}<br />
                                            {client?.city}, {client?.state} {client?.zip}
                                        </address>
                                        <div className="text-sm text-base-content/70">
                                            {client?.contact_email && (
                                                <p>
                                                    <a href={`mailto:${client?.contact_email}`} className="link link-primary">
                                                        <i className="far fa-envelope mr-1"></i>{client?.contact_email || "Not provided"}
                                                    </a>
                                                </p>
                                            )}
                                            {client?.contact_phone && (
                                                <p>
                                                    <a href={`tel:${client?.contact_phone}`} className="link link-primary">
                                                        <i className="far fa-phone mr-1"></i>{client?.contact_phone || "Not provided"}
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="divider my-4"></div>
                            <h2 className="card-title">Project Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">Project Type</h4>
                                        <p>{project.type || "Not specified"}</p>
                                    </div>

                                    <div className="mb-1 flex flex-col justify-between">
                                        <span>Location:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="badge badge-primary badge-outline mr-2">{project.location || "No location assigned"}</span>

                                            <button className="btn btn-secondary btn-xs join-item" type="button" onClick={() => navigator.geolocation.getCurrentPosition((position) => {
                                                const { latitude, longitude } = position.coords;
                                                //setLocation(`Lat: ${latitude}, Lon: ${longitude}`);
                                                //setProjectLocation({ id: equipment.id, location: `Lat: ${latitude}, Lon: ${longitude}` } as EquipmentUpdate);
                                            })}>
                                                <i className="far fa-map-marker-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-start gap-2 mb-6">
                                        {project.location && project.location !== "No location assigned" && (
                                            <>
                                                <Link href={`https://maps.apple.com/?q=${project.location}`} className="btn btn-accent btn-xs">
                                                    <i className="fab fa-apple fa-lg"></i> View on Map
                                                </Link>
                                                <Link href={`https://google.com/maps/place/${project.location}`} className="btn btn-accent btn-xs">
                                                    <i className="fab fa-google fa-lg"></i> View on Map
                                                </Link>
                                                <Link
                                                    href={(() => {
                                                        const match = project.location.match(/Lat: ([-\d.]+), Lon: ([-\d.]+)/);
                                                        if (match) {
                                                            const [_, lat, lon] = match;
                                                            return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15&layers=M&marker=color:red|${lat},${lon}`;
                                                        }
                                                        return '#';
                                                    })()}
                                                    className="btn btn-accent btn-xs"
                                                >
                                                    <i className="far fa-map fa-lg"></i> View on Map
                                                </Link>
                                            </>
                                        )}
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
                        <button className={`tab ${activeTab === "documents" ? "tab-active" : ""}`} onClick={() => setActiveTab("documents")}>Media</button>
                    </div>
                    {activeTab === "overview" && (
                        <>
                            <div className="card bg-base-100 shadow-sm mb-6">
                                <div className="card-body">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Milestones</h3>
                                        <button className="btn btn-sm btn-outline" onClick={() => setMilestoneModalOpen(true)}>
                                            <i className="far fa-plus mr-2"></i> Add Milestone
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
                                                                <button
                                                                    className="btn btn-ghost btn-xs"
                                                                    onClick={() => handleEditMilestone(milestone)}
                                                                >
                                                                    <i className="far fa-edit fa-lg"></i>
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
                                        <button className="btn btn-sm btn-outline" onClick={() => setActiveTab("tasks")}>
                                            <i className="far fa-eye mr-2"></i> View All
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
                                                    <th>Actions</th>
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
                                                        <td>{task.crew_name || task.crew_name || "Unassigned"}</td>
                                                        <td>
                                                            {taskStatusOptions.badge(task.status as TaskStatus)}
                                                        </td>
                                                        <td>
                                                            {progressBar(task.progress, 100)}
                                                        </td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="btn btn-ghost btn-xs"
                                                                    onClick={() => handleEditTask(task)}
                                                                >
                                                                    <i className="far fa-edit fa-lg"></i>
                                                                </button>
                                                            </div>
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
                        <CrewsTab projectId={project.id} crews={crews} />
                    )}
                    {activeTab === "budget" && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="alert alert-info">
                                    <h3 className="text-lg font-semibold">Budget Overview</h3>
                                    <p className="">Budget details coming soon.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "issues" && (
                        <IssuesTab issues={issues} setIssues={setIssues} modalHandler={setIssueModalOpen} />
                    )}
                    {activeTab === "documents" && (
                        <MediaTab projectId={project.id} />
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span>Overall Progress</span>
                                    <span className="font-semibold">{progress || 0}%</span>
                                </div>
                                <input
                                    type="range"
                                    className="range range-primary w-full"
                                    name="progress"
                                    value={progress || 0}
                                    onChange={(e) => setProgress(Number(e.target.value))}
                                    onMouseUp={(e) => updateProject(businessId, project.id, { id: project.id, progress: progress } as ProjectInsert)}
                                    onTouchEnd={(e) => updateProject(businessId, project.id, { id: project.id, progress: progress } as ProjectInsert)}
                                />
                            </div>
                            <div className="stats stats-vertical shadow">
                                <div className="stat">
                                    <div className="stat-title">Elapsed Time</div>
                                    <div className="stat-value text-lg">
                                        {project.start_date ? formatDistanceToNow(new Date(project.start_date)) : "Not started"}
                                    </div>

                                    <div className="stat-desc">
                                        {project.start_date && project.end_date
                                            ? `of ${formatDistance(new Date(project.start_date), new Date(project.end_date))}`
                                            : "Duration not set"
                                        }
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
                                    <p>
                                        {!contact.email || contact.email === "" ?
                                            <>
                                                <i className="far fa-envelope mr-1"></i>Not provided
                                            </>
                                            :
                                            <a href={`mailto:${contact.email}`} className="text-sm link link-primary">
                                                <i className="far fa-envelope mr-1"></i>{contact.email}
                                            </a>
                                        }
                                    </p>
                                    <p>
                                        {!contact.phone || contact.phone === "" ?
                                            <>
                                                <i className="far fa-phone mr-1"></i>Not provided
                                            </>
                                            :
                                            <a href={`tel:${contact.phone}`} className="text-sm link link-primary">
                                                <i className="far fa-phone mr-1"></i>{contact.phone}
                                            </a>
                                        }
                                    </p>
                                </div>
                            )) || <p>No contacts available.</p>}
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Assigned Crews</h3>
                                <button className="btn btn-sm btn-primary">
                                    <i className="far fa-plus mr-1"></i> Assign
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

                    <WeatherWidget location={project.location || "Project Location"} />
                </div>
            </div>
            {issueModalOpen && <IssueModal isOpen={issueModalOpen} onClose={() => setIssueModalOpen(false)} initialIssue={{ project_id: project.id } as ProjectIssueWithDetails} projectId={project.id} />}
            {milestoneModalOpen && <MilestoneModal isOpen={milestoneModalOpen} onClose={handleMilestoneModalClose} projectId={project.id} milestone={selectedMilestone} onSave={handleMilestoneSave} />}
            {taskModalOpen && <TaskModal isOpen={taskModalOpen} onClose={handleTaskModalClose} projectId={project.id} task={selectedTask} onSave={handleTaskSave} crews={crews} />}
            {editModalOpen && <ProjectEditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} project={project} onSave={(updatedProject) => setProject(updatedProject)} />}
            {mediaModalOpen && <MediaModal isOpen={mediaModalOpen} onClose={() => setMediaModalOpen(false)} projectId={project.id} />}
        </div>
    );
};

