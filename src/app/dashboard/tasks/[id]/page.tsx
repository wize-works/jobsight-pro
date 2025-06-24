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
import TaskModal from "@/app/dashboard/tasks/components/modal-task";

// Helper function to format date
function formatDate(dateString: string | number | Date) {
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric"
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
}

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
    const assignedCrew = task.assigned_to ? crewMap[task.assigned_to] : null;

    return (
        <ErrorBoundary>
            <div>
                {/* Header Section */}
                <ErrorBoundary>
                    <div className="flex justify-between items-center mb-6">
                        <Link href="/dashboard/tasks" className="btn btn-outline">
                            <i className="far fa-arrow-left fa mr-2"></i> Back to Tasks
                        </Link>
                        <div className="flex items-center gap-2">                            <button
                            className="btn btn-primary"
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

                {/* Main Content */}
                <ErrorBoundary>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h1 className="text-2xl font-bold">{task.name}</h1>
                                    <h2 className="card-title mb-4">Task Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-medium">Task Name</span>
                                            </label>
                                            <div className="text-lg">{task.name}</div>
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-medium">Project</span>
                                            </label>
                                            <Link
                                                href={`/dashboard/projects/${task.project_id}`}
                                                className="text-lg text-primary hover:underline"
                                            >
                                                {project?.name || "Unknown Project"}
                                            </Link>
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-medium">Assigned To</span>
                                            </label>
                                            <div className="text-lg">{assignedCrew?.name || "Unassigned"}</div>
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-medium">Status</span>
                                            </label>
                                            {taskStatusOptions.badge(task.status as TaskStatus)}
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-medium">Priority</span>
                                            </label>
                                            {taskPriorityOptions.badge(task.priority as TaskPriority)}
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-medium">Progress</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <progress className="progress progress-primary w-32" value={task.progress || 0} max="100"></progress>
                                                <span className="text-lg">{task.progress || 0}%</span>
                                            </div>
                                        </div>
                                        {task.start_date && (
                                            <div>
                                                <label className="label">
                                                    <span className="label-text font-medium">Start Date</span>
                                                </label>
                                                <div className="text-lg">{formatDate(task.start_date)}</div>
                                            </div>
                                        )}
                                        {task.end_date && (
                                            <div>
                                                <label className="label">
                                                    <span className="label-text font-medium">Due Date</span>
                                                </label>
                                                <div className="text-lg">{formatDate(task.end_date)}</div>
                                            </div>
                                        )}
                                    </div>
                                    {task.description && (
                                        <div className="mt-4">
                                            <label className="label">
                                                <span className="label-text font-medium">Description</span>
                                            </label>
                                            <div className="text-base-content/80">{task.description}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="card bg-base-100 shadow-lg mb-6">
                                <div className="card-body">
                                    <h3 className="card-title text-lg mb-4">Quick Actions</h3>
                                    <div className="space-y-6">
                                        <button
                                            className="btn btn-sm btn-outline w-full"
                                            onClick={() => handleUpdateTask({ status: "in_progress" })}
                                            disabled={task.status === "in_progress"}
                                        >
                                            Start Task
                                        </button>
                                        <button
                                            className="btn btn-sm btn-success w-full"
                                            onClick={() => handleUpdateTask({ status: "completed", progress: 100 })}
                                            disabled={task.status === "completed"}
                                        >
                                            Mark Complete
                                        </button>
                                        <Link
                                            href={`/dashboard/projects/${task.project_id}`}
                                            className="btn btn-sm btn-ghost w-full"
                                        >
                                            View Project
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {task.created_at && (
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg mb-4">Task Details</h3>
                                        <div className="space-y-6 text-sm">
                                            <div>
                                                <span className="text-base-content/70">Created:</span>
                                                <div>{formatDate(task.created_at)}</div>
                                            </div>
                                            {task.updated_at && (
                                                <div>
                                                    <span className="text-base-content/70">Last Updated:</span>
                                                    <div>{formatDate(task.updated_at)}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>                    {/* Task Edit Modal */}
                    <TaskModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        task={task as TaskWithDetails}
                        onSave={async (updatedTask) => {
                            await refreshTask();
                            setIsEditModalOpen(false);
                            toast.success("Task updated successfully!");
                        }}
                    />
                </ErrorBoundary>
            </div>
        </ErrorBoundary>
    );
}