"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTaskById, updateTask, deleteTask } from "@/app/actions/tasks";
import { getProjects } from "@/app/actions/projects";
import { getCrews } from "@/app/actions/crews";
import { Task, TaskPriority, taskPriorityOptions, TaskStatus, taskStatusOptions, TaskUpdate, TaskWithDetails } from "@/types/tasks";
import { Project } from "@/types/projects";
import { Crew } from "@/types/crews";
import toast from "react-hot-toast";
import { useBusiness } from "@/lib/business-context";
import ErrorBoundary from "@/components/error-boundary";
import TaskDetailsModal from "@/app/dashboard/tasks/components/task-details-modal";
import LocationDisplay from "@/components/location-display";

import { formatDistance, formatDistanceToNow } from "date-fns";
import { formatDate, formatCurrency } from "@/utils/date";

export default function TaskDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { businessId } = useBusiness();
    const router = useRouter(); const [task, setTask] = useState<Task | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [crews, setCrews] = useState<Crew[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!businessId || !id) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch all required data in parallel
                const [taskData, projectsData, crewsData] = await Promise.all([
                    getTaskById(businessId, id),
                    getProjects(businessId),
                    getCrews(businessId)
                ]);

                if (!taskData) {
                    setError("Task not found");
                    return;
                }

                setTask(taskData);
                setProjects(projectsData);
                setCrews(crewsData);
            } catch (err) {
                console.error('Error fetching task data:', err);
                setError("Error loading task. The task may not exist or there was a problem retrieving the data.");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [businessId, id]);

    // Handle task deletion
    const handleDeleteTask = async () => {
        if (!task) return;

        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteTask(businessId, task.id);
                toast.success("Task deleted successfully!");
                router.push("/dashboard/tasks");
            } catch (error) {
                console.error("Error deleting task:", error);
                toast.error("Failed to delete task");
            }
        }
    };

    // Handle task update
    const handleUpdateTask = async (updatedData: Partial<Task>) => {
        if (!task) return;

        try {
            const updatedTask = await updateTask(businessId, task.id, updatedData as TaskUpdate);
            setTask(updatedTask);
            setIsEditModalOpen(false);
            toast.success("Task updated successfully!");
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task");
        }
    };

    // Function to refresh task data
    const refreshTask = async () => {
        if (!businessId || !id) return;
        try {
            const updatedTask = await getTaskById(businessId, id);
            setTask(updatedTask);
        } catch (error) {
            console.error("Error refreshing task:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="loading loading-spinner loading-lg"></div>
                <span className="ml-2">Loading task details...</span>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="alert alert-error">
                <i className="far fa-exclamation-triangle mr-2"></i>
                {error || "Task not found"}
            </div>
        );
    }

    // Create lookup maps
    const projectMap = projects.reduce((acc, project) => {
        acc[project.id] = project;
        return acc;
    }, {} as Record<string, Project>);

    const crewMap = crews.reduce((acc, crew) => {
        acc[crew.id] = crew;
        return acc;
    }, {} as Record<string, Crew>);

    const project = projectMap[task.project_id];
    const assignedCrew = task.assigned_to ? crewMap[task.assigned_to] : null; return (
        <ErrorBoundary>
            <div>
                {/* Header Section */}
                <ErrorBoundary>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <Link href="/dashboard/tasks" className="btn btn-outline">
                                    <i className="far fa-arrow-left mr-2"></i> Back to Tasks
                                </Link>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-outline"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <i className="far fa-edit mr-2"></i> Edit
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={handleDeleteTask}
                            >
                                <i className="far fa-trash mr-2"></i> Delete
                            </button>
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Task Stats Cards */}
                <ErrorBoundary fallback={(error) => (
                    <div className="alert alert-error mb-6">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3 className="font-bold">Failed to load task statistics</h3>
                            <div className="text-xs">Task stats are temporarily unavailable.</div>
                        </div>
                    </div>
                )}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body p-4">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-full bg-primary/10 p-3 mr-4 h-10 w-10 flex items-center justify-center">
                                        <i className="far fa-tasks fa-beat fa-lg fa-fw text-primary"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg text-base-content font-medium">{taskStatusOptions.badge(task.status as TaskStatus)}</span>
                                        <span className="text-sm text-base-content/50">{taskPriorityOptions.badge(task.priority as TaskPriority)} priority</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body p-4">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-full bg-accent/10 p-3 mr-4 h-10 w-10 flex items-center justify-center">
                                        <i className="far fa-users fa-beat fa-lg fa-fw text-accent"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg text-base-content font-medium">Assigned to {assignedCrew?.name || "No crew"}</span>
                                        <span className="text-sm text-base-content/50">
                                            {project ? (
                                                <Link href={`/dashboard/projects/${project.id}`} className="link link-hover">
                                                    {project.name}
                                                </Link>
                                            ) : "Unknown project"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body p-4">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-full bg-info/10 p-3 mr-4 h-10 w-10 flex items-center justify-center">
                                        <i className="far fa-chart-line fa-beat fa-lg fa-fw text-info"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg text-base-content font-medium">Progress: {task.progress || 0}%</span>
                                        <span className="text-sm text-base-content/50">
                                            <progress className="progress progress-primary w-20 h-2" value={task.progress || 0} max="100"></progress>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body p-4">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-full bg-success/10 p-3 mr-4 h-10 w-10 flex items-center justify-center">
                                        <i className="far fa-calendar-clock fa-beat fa-lg fa-fw text-success"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg text-base-content font-medium">
                                            {task.end_date ? (
                                                task.status === "completed" ? "Completed" :
                                                    new Date(task.end_date) < new Date() ? "Overdue" : "On Track"
                                            ) : "No deadline"}
                                        </span>
                                        <span className="text-sm text-base-content/50">
                                            {task.end_date ? formatDate(task.end_date) : "No end date set"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Main Content */}
                <ErrorBoundary>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h1 className="text-2xl font-bold">{task.name}</h1>
                                            <div className="flex items-center gap-2 mt-2">
                                                {taskStatusOptions.badge(task.status as TaskStatus)}
                                                {taskPriorityOptions.badge(task.priority as TaskPriority)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="divider my-4"></div>

                                    <h2 className="card-title mb-4">Task Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-base-content/70">Project</h4>
                                                <Link
                                                    href={`/dashboard/projects/${task.project_id}`}
                                                    className="text-lg link link-hover"
                                                >
                                                    {project?.name || "Unknown Project"}
                                                </Link>
                                            </div>
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-base-content/70">Assigned To</h4>
                                                <p className="text-lg">{assignedCrew?.name || "Unassigned"}</p>
                                            </div>
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-base-content/70">Progress</h4>
                                                <div className="flex items-center gap-3">
                                                    <progress className="progress progress-primary flex-1" value={task.progress || 0} max="100"></progress>
                                                    <span className="text-lg font-semibold">{task.progress || 0}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            {task.start_date && (
                                                <div className="mb-4">
                                                    <h4 className="text-sm font-medium text-base-content/70">Start Date</h4>
                                                    <p className="text-lg">{formatDate(task.start_date)}</p>
                                                </div>
                                            )}
                                            {task.end_date && (
                                                <div className="mb-4">
                                                    <h4 className="text-sm font-medium text-base-content/70">Due Date</h4>
                                                    <p className="text-lg">{formatDate(task.end_date)}</p>
                                                </div>
                                            )}
                                            {task.start_date && (
                                                <div className="mb-4">
                                                    <h4 className="text-sm font-medium text-base-content/70">Duration</h4>
                                                    <p className="text-lg">
                                                        {task.start_date && task.end_date
                                                            ? formatDistance(new Date(task.start_date), new Date(task.end_date))
                                                            : "Not specified"
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {task.description && (
                                        <div className="mt-6">
                                            <h4 className="text-sm font-medium text-base-content/70 mb-2">Description</h4>
                                            <div className="text-base-content/80 bg-base-200/50 rounded-lg p-4">
                                                {task.description}
                                            </div>
                                        </div>
                                    )}

                                    {/* Project Location */}
                                    {project?.location && (
                                        <div className="mt-6">
                                            <h4 className="text-sm font-medium text-base-content/70 mb-2">Project Location</h4>
                                            <LocationDisplay
                                                location={project.location}
                                                compact={true}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="card bg-base-100 shadow-lg mb-6">
                                <div className="card-body">
                                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                                    <div className="space-y-3">
                                        <button
                                            className="btn btn-outline w-full"
                                            onClick={() => handleUpdateTask({ status: "in_progress" })}
                                            disabled={task.status === "in_progress"}
                                        >
                                            <i className="far fa-play mr-2"></i>
                                            Start Task
                                        </button>
                                        <button
                                            className="btn btn-success w-full"
                                            onClick={() => handleUpdateTask({ status: "completed", progress: 100 })}
                                            disabled={task.status === "completed"}
                                        >
                                            <i className="far fa-check-circle mr-2"></i>
                                            Mark Complete
                                        </button>
                                        <Link
                                            href={`/dashboard/projects/${task.project_id}`}
                                            className="btn btn-ghost w-full"
                                        >
                                            <i className="far fa-external-link mr-2"></i>
                                            View Project
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-base-100 shadow-lg mb-6">
                                <div className="card-body">
                                    <h3 className="text-lg font-semibold mb-4">Task Timeline</h3>
                                    <div className="space-y-4 text-sm">
                                        {task.created_at && (
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                                                    <i className="far fa-plus text-primary text-xs"></i>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Created</div>
                                                    <div className="text-base-content/70">{formatDate(task.created_at)}</div>
                                                </div>
                                            </div>
                                        )}
                                        {task.start_date && (
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-info/10 p-2 h-8 w-8 flex items-center justify-center">
                                                    <i className="far fa-calendar text-info text-xs"></i>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Scheduled Start</div>
                                                    <div className="text-base-content/70">{formatDate(task.start_date)}</div>
                                                </div>
                                            </div>
                                        )}
                                        {task.end_date && (
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-warning/10 p-2 h-8 w-8 flex items-center justify-center">
                                                    <i className="far fa-flag text-warning text-xs"></i>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Due Date</div>
                                                    <div className="text-base-content/70">{formatDate(task.end_date)}</div>
                                                </div>
                                            </div>
                                        )}
                                        {task.updated_at && (
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-success/10 p-2 h-8 w-8 flex items-center justify-center">
                                                    <i className="far fa-clock text-success text-xs"></i>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Last Updated</div>
                                                    <div className="text-base-content/70">{formatDate(task.updated_at)}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {(task.start_date || task.end_date) && (
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h3 className="text-lg font-semibold mb-4">Time Tracking</h3>
                                        <div className="space-y-3">
                                            {task.start_date && (
                                                <div className="stat">
                                                    <div className="stat-title">Time Since Start</div>
                                                    <div className="stat-value text-lg">
                                                        {formatDistanceToNow(new Date(task.start_date))}
                                                    </div>
                                                    <div className="stat-desc">
                                                        Started {formatDate(task.start_date)}
                                                    </div>
                                                </div>
                                            )}
                                            {task.end_date && (
                                                <div className="stat">
                                                    <div className="stat-title">
                                                        {new Date(task.end_date) < new Date() ? "Overdue By" : "Time Remaining"}
                                                    </div>
                                                    <div className={`stat-value text-lg ${new Date(task.end_date) < new Date() ? "text-error" : "text-success"}`}>
                                                        {formatDistanceToNow(new Date(task.end_date))}
                                                    </div>
                                                    <div className="stat-desc">
                                                        Due {formatDate(task.end_date)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>                    {/* Task Edit Modal */}
                    <TaskDetailsModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        task={task as TaskWithDetails}
                        projects={[]} // Will be loaded by modal if needed
                        crews={crews}
                        onTaskUpdate={async () => {
                            await refreshTask();
                            setIsEditModalOpen(false);
                            toast.success("Task updated successfully!");
                        }}
                        onTaskDelete={() => { }} // Not used in edit mode
                    />
                </ErrorBoundary>
            </div>
        </ErrorBoundary>
    );
}