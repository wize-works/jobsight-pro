
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Task } from "@/types/tasks"
import { TaskNote } from "@/types/task-notes"
import { TaskDependency } from "@/types/task_dependencies"
import { Subtask } from "@/types/subtasks"
import { deleteTask, updateTask } from "@/app/actions/tasks"
import { getTaskNotes, createTaskNote, updateTaskNote, deleteTaskNote } from "@/app/actions/task-notes"
import { getTaskDependencies, createTaskDependency, deleteTaskDependency } from "@/app/actions/task_dependencies"
import { getSubtasks, createSubtask, updateSubtask, deleteSubtask } from "@/app/actions/subtasks"
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
    const [activeTab, setActiveTab] = useState("overview")
    
    // Related data states
    const [taskNotes, setTaskNotes] = useState<TaskNote[]>([])
    const [taskDependencies, setTaskDependencies] = useState<TaskDependency[]>([])
    const [subtasks, setSubtasks] = useState<Subtask[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

    // Modal states
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [isAddingDependency, setIsAddingDependency] = useState(false)
    const [isAddingSubtask, setIsAddingSubtask] = useState(false)
    const [editingNote, setEditingNote] = useState<TaskNote | null>(null)
    const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null)

    // Form states
    const [newNoteText, setNewNoteText] = useState("")
    const [selectedDependencyTask, setSelectedDependencyTask] = useState("")
    const [newSubtaskName, setNewSubtaskName] = useState("")
    const [newSubtaskDescription, setNewSubtaskDescription] = useState("")

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

    // Load related data
    useEffect(() => {
        const loadRelatedData = async () => {
            try {
                const [notesData, dependenciesData, subtasksData] = await Promise.all([
                    getTaskNotes(),
                    getTaskDependencies(),
                    getSubtasks()
                ])

                // Filter data for this specific task
                setTaskNotes(notesData.filter(note => note.task_id === task.id))
                setTaskDependencies(dependenciesData.filter(dep => 
                    dep.task_id === task.id || dep.depends_on_task_id === task.id
                ))
                setSubtasks(subtasksData.filter(subtask => subtask.task_id === task.id))
            } catch (error) {
                console.error("Error loading related data:", error)
                toast.error("Failed to load task details")
            } finally {
                setLoading(false)
            }
        }

        loadRelatedData()
    }, [task.id])

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

    // Note handlers
    const handleAddNote = async () => {
        if (!newNoteText.trim()) return

        try {
            const newNote = await createTaskNote({
                task_id: task.id,
                note: newNoteText,
                business_id: task.business_id
            })
            if (newNote) {
                setTaskNotes([...taskNotes, newNote])
                setNewNoteText("")
                setIsAddingNote(false)
                toast.success("Note added successfully!")
            }
        } catch (error) {
            console.error("Error adding note:", error)
            toast.error("Failed to add note")
        }
    }

    const handleUpdateNote = async (noteId: string, noteText: string) => {
        try {
            const updatedNote = await updateTaskNote(noteId, { note: noteText })
            if (updatedNote) {
                setTaskNotes(taskNotes.map(note => note.id === noteId ? updatedNote : note))
                setEditingNote(null)
                toast.success("Note updated successfully!")
            }
        } catch (error) {
            console.error("Error updating note:", error)
            toast.error("Failed to update note")
        }
    }

    const handleDeleteNote = async (noteId: string) => {
        if (confirm("Are you sure you want to delete this note?")) {
            try {
                await deleteTaskNote(noteId)
                setTaskNotes(taskNotes.filter(note => note.id !== noteId))
                toast.success("Note deleted successfully!")
            } catch (error) {
                console.error("Error deleting note:", error)
                toast.error("Failed to delete note")
            }
        }
    }

    // Subtask handlers
    const handleAddSubtask = async () => {
        if (!newSubtaskName.trim()) return

        try {
            const newSubtask = await createSubtask({
                task_id: task.id,
                name: newSubtaskName,
                description: newSubtaskDescription || null,
                status: "not_started",
                priority: "medium",
                business_id: task.business_id
            })
            if (newSubtask) {
                setSubtasks([...subtasks, newSubtask])
                setNewSubtaskName("")
                setNewSubtaskDescription("")
                setIsAddingSubtask(false)
                toast.success("Subtask added successfully!")
            }
        } catch (error) {
            console.error("Error adding subtask:", error)
            toast.error("Failed to add subtask")
        }
    }

    const handleUpdateSubtask = async (subtaskId: string, updates: Partial<Subtask>) => {
        try {
            const updatedSubtask = await updateSubtask(subtaskId, updates)
            if (updatedSubtask) {
                setSubtasks(subtasks.map(subtask => subtask.id === subtaskId ? updatedSubtask : subtask))
                setEditingSubtask(null)
                toast.success("Subtask updated successfully!")
            }
        } catch (error) {
            console.error("Error updating subtask:", error)
            toast.error("Failed to update subtask")
        }
    }

    const handleDeleteSubtask = async (subtaskId: string) => {
        if (confirm("Are you sure you want to delete this subtask?")) {
            try {
                await deleteSubtask(subtaskId)
                setSubtasks(subtasks.filter(subtask => subtask.id !== subtaskId))
                toast.success("Subtask deleted successfully!")
            } catch (error) {
                console.error("Error deleting subtask:", error)
                toast.error("Failed to delete subtask")
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        )
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

            {/* Tab Navigation */}
            <div className="tabs tabs-boxed mb-6">
                <button 
                    className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    Overview
                </button>
                <button 
                    className={`tab ${activeTab === "subtasks" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("subtasks")}
                >
                    Subtasks ({subtasks.length})
                </button>
                <button 
                    className={`tab ${activeTab === "notes" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("notes")}
                >
                    Notes ({taskNotes.length})
                </button>
                <button 
                    className={`tab ${activeTab === "dependencies" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("dependencies")}
                >
                    Dependencies ({taskDependencies.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
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
            )}

            {/* Subtasks Tab */}
            {activeTab === "subtasks" && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Subtasks</h3>
                        <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => setIsAddingSubtask(true)}
                        >
                            <i className="fas fa-plus mr-2"></i> Add Subtask
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {subtasks.map((subtask) => (
                            <div key={subtask.id} className="card bg-base-100 shadow-sm">
                                <div className="card-body">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{subtask.name}</h4>
                                            {subtask.description && (
                                                <p className="text-base-content/70 text-sm mt-1">{subtask.description}</p>
                                            )}
                                            <div className="flex gap-2 mt-2">
                                                <div className={`badge ${getStatusBadgeColor(subtask.status || "not_started")}`}>
                                                    {formatStatus(subtask.status || "not_started")}
                                                </div>
                                                <div className={`badge ${getPriorityBadgeColor(subtask.priority || "medium")}`}>
                                                    {formatPriority(subtask.priority || "medium")}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => setEditingSubtask(subtask)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-ghost text-error"
                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {subtasks.length === 0 && (
                            <div className="text-center py-8 text-base-content/50">
                                No subtasks yet. Add one to break down this task into smaller pieces.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Notes</h3>
                        <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => setIsAddingNote(true)}
                        >
                            <i className="fas fa-plus mr-2"></i> Add Note
                        </button>
                    </div>

                    <div className="space-y-4">
                        {taskNotes.map((note) => (
                            <div key={note.id} className="card bg-base-100 shadow-sm">
                                <div className="card-body">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            {editingNote?.id === note.id ? (
                                                <div className="space-y-2">
                                                    <textarea 
                                                        className="textarea textarea-bordered w-full"
                                                        value={editingNote.note}
                                                        onChange={(e) => setEditingNote({ ...editingNote, note: e.target.value })}
                                                        rows={3}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button 
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleUpdateNote(note.id, editingNote.note)}
                                                        >
                                                            Save
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-ghost"
                                                            onClick={() => setEditingNote(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="whitespace-pre-wrap">{note.note}</p>
                                                    {note.created_at && (
                                                        <p className="text-xs text-base-content/50 mt-2">
                                                            {formatDate(note.created_at)}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {editingNote?.id !== note.id && (
                                            <div className="flex gap-2">
                                                <button 
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => setEditingNote(note)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-ghost text-error"
                                                    onClick={() => handleDeleteNote(note.id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {taskNotes.length === 0 && (
                            <div className="text-center py-8 text-base-content/50">
                                No notes yet. Add notes to track progress, issues, or important information.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Dependencies Tab */}
            {activeTab === "dependencies" && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Task Dependencies</h3>
                    </div>

                    <div className="space-y-4">
                        {taskDependencies.map((dependency) => (
                            <div key={dependency.id} className="card bg-base-100 shadow-sm">
                                <div className="card-body">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">
                                                {dependency.task_id === task.id ? "This task depends on:" : "This task is a dependency for:"}
                                            </p>
                                            <p className="text-base-content/70">
                                                Task ID: {dependency.task_id === task.id ? dependency.depends_on_task_id : dependency.task_id}
                                            </p>
                                        </div>
                                        <button 
                                            className="btn btn-sm btn-ghost text-error"
                                            onClick={() => deleteTaskDependency(dependency.id)}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {taskDependencies.length === 0 && (
                            <div className="text-center py-8 text-base-content/50">
                                No dependencies configured for this task.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Note Modal */}
            {isAddingNote && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add Note</h3>
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Note</span>
                                </label>
                                <textarea 
                                    className="textarea textarea-bordered"
                                    placeholder="Enter your note..."
                                    value={newNoteText}
                                    onChange={(e) => setNewNoteText(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setIsAddingNote(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddNote}>
                                Add Note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subtask Modal */}
            {isAddingSubtask && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add Subtask</h3>
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Subtask Name</span>
                                </label>
                                <input 
                                    type="text"
                                    className="input input-bordered"
                                    placeholder="Enter subtask name..."
                                    value={newSubtaskName}
                                    onChange={(e) => setNewSubtaskName(e.target.value)}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Description (Optional)</span>
                                </label>
                                <textarea 
                                    className="textarea textarea-bordered"
                                    placeholder="Enter description..."
                                    value={newSubtaskDescription}
                                    onChange={(e) => setNewSubtaskDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setIsAddingSubtask(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddSubtask}>
                                Add Subtask
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
