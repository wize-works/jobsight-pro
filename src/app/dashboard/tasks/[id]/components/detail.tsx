"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Task } from "@/types/tasks"
import { deleteTask, updateTask } from "@/app/actions/tasks"
import { toast } from "@/hooks/use-toast"
import TaskEditModal from "../../components/modal-edit"
import { Project } from "@/types/projects"
import { Crew } from "@/types/crews"

interface TaskDetailProps {
    task: Task
    projects?: { id: string; name: string }[]
    crews?: { id: string; name: string }[]
}

export default function TaskDetailComponent({ task: initialTask, projects = [], crews = [] }: TaskDetailProps) {
    const router = useRouter()
    const [task, setTask] = useState(initialTask)
    const [isEditing, setIsEditing] = useState(false)

    // Create lookup maps
    const projectMap = projects.reduce((acc, project) => {
        acc[project.id] = project
        return acc
    }, {} as Record<string, Project>)

    const crewMap = crews.reduce((acc, crew) => {
        acc[crew.id] = crew
        return acc
    }, {} as Record<string, Crew>)

    const project = projectMap[task.project_id]
    const assignedCrew = task.assigned_to ? crewMap[task.assigned_to] : null

    // Get status badge color
    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "completed":
                return "badge-success"
            case "in_progress":
                return "badge-primary"
            case "not_started":
                return "badge-ghost"
            default:
                return "badge-ghost"
        }
    }

    // Get priority badge color
    const getPriorityBadgeColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "badge-error"
            case "medium":
                return "badge-warning"
            case "low":
                return "badge-info"
            default:
                return "badge-ghost"
        }
    }

    // Format status for display
    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

    // Format priority for display
    const formatPriority = (priority: string) => {
        return priority.charAt(0).toUpperCase() + priority.slice(1)
    }

    // Handle task deletion
    const handleDeleteTask = async () => {
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteTask(task.id)
                toast.success("Task deleted successfully!")
                router.push("/dashboard/tasks")
            } catch (error) {
                console.error("Error deleting task:", error)
                toast.error("Failed to delete task")
            }
        }
    }

    // Handle task update
    const handleUpdateTask = async (updatedData: Partial<Task>) => {
        try {
            const updatedTask = await updateTask(task.id, updatedData)
            setTask(updatedTask)
            setIsEditing(false)
            toast.success("Task updated successfully!")
        } catch (error) {
            console.error("Error updating task:", error)
            toast.error("Failed to update task")
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{task.name}</h1>
                    <p className="text-base-content/70">Task Details</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/tasks" className="btn btn-ghost">
                        <i className="fas fa-arrow-left mr-2"></i> Back to Tasks
                    </Link>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setIsEditing(true)}
                    >
                        <i className="fas fa-edit mr-2"></i> Edit
                    </button>
                    <button 
                        className="btn btn-error" 
                        onClick={handleDeleteTask}
                    >
                        <i className="fas fa-trash mr-2"></i> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Task Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <div className={`badge ${getStatusBadgeColor(task.status)} badge-lg`}>
                                        {formatStatus(task.status)}
                                    </div>
                                </div>
                                <div>
                                    <label className="label">
                                        <span className="label-text font-medium">Priority</span>
                                    </label>
                                    <div className={`badge ${getPriorityBadgeColor(task.priority)} badge-lg`}>
                                        {formatPriority(task.priority)}
                                    </div>
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
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <h3 className="card-title text-lg mb-4">Quick Actions</h3>
                            <div className="space-y-2">
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
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h3 className="card-title text-lg mb-4">Task Details</h3>
                                <div className="space-y-2 text-sm">
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
            </div>

            {/* Edit Task Modal */}
            {isEditing && (
               <TaskEditModal 
                    isOpen={isEditing} 
                    onClose={() => setIsEditing(false)} 
                    task={task} 
                    projects={projects}
                    crews={crews}
                    onUpdate={handleUpdateTask}
                />
            )}
        </div>
    )
}

// Helper function to format date
function formatDate(dateString: string | number | Date) {
    const options: Intl.DateTimeFormatOptions = { 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
}