import React from "react";
import Link from "next/link";
import { taskStatusOptions, TaskStatus } from "@/types/tasks";
import { formatDate, formatCurrency } from "@/utils/formatters";

// Helper function to normalize status strings to match TaskStatus type
const normalizeStatus = (status: string): TaskStatus => {
    const normalized = status.toLowerCase().replace(/ /g, '_') as TaskStatus;
    return normalized;
};

// Helper function to get badge class for status
const getStatusBadge = (status: string) => {
    const normalized = normalizeStatus(status);
    return taskStatusOptions.get(normalized).badge || 'badge-neutral';
};

// Helper function to get display label for status
const getStatusLabel = (status: string) => {
    const normalized = normalizeStatus(status);
    return taskStatusOptions.get(normalized).label || status;
};

interface ProjectDetailProps {
    project: {
        id: string;
        name: string;
        status: string;
        type: string;
        client: string;
        clientId: string;
        budget: number;
        startDate: string;
        endDate: string;
        location: string;
        description: string;
        progress: number;
        daysElapsed: number;
        totalDays: number;
        budgetUsed: number;
        tasksCompleted: number;
        manager: string;
        milestones: Array<{
            id: string;
            name: string;
            dueDate: string;
            status: string;
            description: string;
        }>;
        tasks: Array<{
            id: string;
            name: string;
            assignedTo: string;
            assignedToName?: string;
            startDate: string;
            endDate: string;
            status: string;
            progress: number;
        }>;
        contacts: Array<{
            name: string;
            role: string;
            email: string;
            phone: string;
        }>;
        crews: Array<{
            id: string;
            name: string;
            leader: string;
            members: number;
        }>;
    };
}

// We'll use the normalized helper functions for all status badges and labels

const ProjectDetailComponent: React.FC<ProjectDetailProps> = ({ project }) => {
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/projects" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        <div className={`badge ${getStatusBadge(project.status)}`}>
                            {getStatusLabel(project.status)}
                        </div>
                    </div>
                    <p className="text-base-content/70 mt-1">
                        Client:{" "}
                        <Link href={`/dashboard/clients/${project.clientId}`} className="link link-hover">
                            {project.client}
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
                                        <p>{project.manager || "Not assigned"}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">Start Date</h4>
                                        <p>{formatDate(project.startDate)}</p>
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">End Date</h4>
                                        <p>{formatDate(project.endDate)}</p>
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-base-content/70">Budget</h4>
                                        <p>{formatCurrency(project.budget)}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-base-content/70 mb-2">Description</h4>
                                <p>{project.description || "No description provided"}</p>
                            </div>
                        </div>
                    </div>

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
                                        {project.milestones?.map((milestone) => (
                                            <tr key={milestone.id}>
                                                <td>
                                                    <div className="font-medium">{milestone.name}</div>
                                                    <div className="text-sm text-base-content/70">{milestone.description}</div>
                                                </td>                                                <td>{formatDate(milestone.dueDate)}</td>                                                <td>
                                                    <div className={`badge ${getStatusBadge(milestone.status)}`}>
                                                        {getStatusLabel(milestone.status)}
                                                    </div>
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
                                        {project.tasks?.slice(0, 3).map((task) => (
                                            <tr key={task.id}>
                                                <td>
                                                    <div className="font-medium">{task.name}</div>
                                                    <div className="text-xs text-base-content/70">
                                                        {formatDate(task.startDate)} - {formatDate(task.endDate)}
                                                    </div>
                                                </td>                                                <td>{task.assignedToName || task.assignedTo || "Unassigned"}</td>                                                <td>
                                                    <div className={`badge ${getStatusBadge(task.status)}`}>
                                                        {getStatusLabel(task.status)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <progress
                                                            className="progress progress-primary w-20"
                                                            value={task.progress || 0}
                                                            max="100"
                                                        ></progress>
                                                        <span className="text-xs">{task.progress || 0}%</span>
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
                                    <div className="stat-title">Days Elapsed</div>
                                    <div className="stat-value text-lg">{project.daysElapsed || 0}</div>
                                    <div className="stat-desc">of {project.totalDays || 0} total days</div>
                                </div>

                                <div className="stat">
                                    <div className="stat-title">Budget Used</div>
                                    <div className="stat-value text-lg">
                                        {project.budgetUsed || 0}%
                                    </div>
                                    <div className="stat-desc">
                                        {formatCurrency((project.budget || 0) * ((project.budgetUsed || 0) / 100))}
                                    </div>
                                </div>

                                <div className="stat">
                                    <div className="stat-title">Tasks Completed</div>
                                    <div className="stat-value text-lg">
                                        {project.tasksCompleted || 0}
                                    </div>
                                    <div className="stat-desc">of {project.tasks?.length || 0} total tasks</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <h3 className="text-lg font-semibold mb-4">Client Contacts</h3>
                            {project.contacts?.map((contact, index) => (
                                <div key={contact.email || index} className={index > 0 ? "mt-4 pt-4 border-t" : ""}>
                                    <p className="font-medium">{contact.name}</p>
                                    <p className="text-sm">{contact.role}</p>
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
                            {project.crews?.map((crew) => (
                                <div key={crew.id} className="mb-3">
                                    <div className="font-medium">
                                        <Link href={`/dashboard/crews/${crew.id}`} className="link link-hover">
                                            {crew.name}
                                        </Link>
                                    </div>
                                    <p className="text-xs text-base-content/70">
                                        Led by {crew.leader} • {crew.members} members
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

export default ProjectDetailComponent;
