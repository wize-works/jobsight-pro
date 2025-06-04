
"use client"

import { useState, useEffect, SetStateAction } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createTask, updateTask, deleteTask } from "@/app/actions/tasks"
import { Task, TaskInsert, TaskStatus } from "@/types/tasks"
import { Project } from "@/types/projects"
import { Crew } from "@/types/crews"
import toast from "react-hot-toast"

interface TasksComponentProps {
    tasks: Task[]
    projects: Project[]
    crews: Crew[]
}

export default function TasksComponent({ tasks: initialTasks, projects, crews }: TasksComponentProps) {
    const router = useRouter()
    const [tasks, setTasks] = useState(initialTasks)
    const [filteredTasks, setFilteredTasks] = useState(initialTasks)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("All")
    const [projectFilter, setProjectFilter] = useState("All")
    const [assigneeFilter, setAssigneeFilter] = useState("All")
    const [priorityFilter, setPriorityFilter] = useState("All")
    const [showAddTaskModal, setShowAddTaskModal] = useState(false)
    const [sortBy, setSortBy] = useState("end_date")
    const [sortOrder, setSortOrder] = useState("asc")

    // Task statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === "completed").length
    const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length
    const notStartedTasks = tasks.filter((task) => task.status === "not_started").length

    // Create project and crew lookup maps
    const projectMap = projects.reduce((acc, project) => {
        acc[project.id] = project.name
        return acc
    }, {} as Record<string, string>)

    const crewMap = crews.reduce((acc, crew) => {
        acc[crew.id] = crew.name
        return acc
    }, {} as Record<string, string>)

    // Apply filters
    useEffect(() => {
        let result = [...tasks]

        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (task) =>
                    task.name.toLowerCase().includes(query) ||
                    task.description?.toLowerCase().includes(query) ||
                    projectMap[task.project_id]?.toLowerCase().includes(query) ||
                    crewMap[task.assigned_to || ""]?.toLowerCase().includes(query)
            )
        }

        // Apply status filter
        if (statusFilter !== "All") {
            result = result.filter((task) => task.status === statusFilter.toLowerCase().replace(" ", "_"))
        }

        // Apply project filter
        if (projectFilter !== "All") {
            result = result.filter((task) => task.project_id === projectFilter)
        }

        // Apply assignee filter
        if (assigneeFilter !== "All") {
            result = result.filter((task) => task.assigned_to === assigneeFilter)
        }

        // Apply priority filter
        if (priorityFilter !== "All") {
            result = result.filter((task) => task.priority === priorityFilter.toLowerCase())
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0
            switch (sortBy) {
                case "name":
                    comparison = a.name.localeCompare(b.name)
                    break
                case "project":
                    comparison = (projectMap[a.project_id] || "").localeCompare(projectMap[b.project_id] || "")
                    break
                case "assignee":
                    comparison = (crewMap[a.assigned_to || ""] || "").localeCompare(crewMap[b.assigned_to || ""] || "")
                    break
                case "status":
                    comparison = a.status.localeCompare(b.status)
                    break
                case "priority":
                    const priorityOrder = { high: 0, medium: 1, low: 2 }
                    comparison =
                        priorityOrder[a.priority as keyof typeof priorityOrder] -
                        priorityOrder[b.priority as keyof typeof priorityOrder]
                    break
                case "progress":
                    comparison = (a.progress || 0) - (b.progress || 0)
                    break
                case "end_date":
                default:
                    comparison = new Date(a.end_date || "").getTime() - new Date(b.end_date || "").getTime()
                    break
            }
            return sortOrder === "asc" ? comparison : -comparison
        })

        setFilteredTasks(result)
    }, [tasks, searchQuery, statusFilter, projectFilter, assigneeFilter, priorityFilter, sortBy, sortOrder, projectMap, crewMap])

    // Handle sort change
    const handleSortChange = (column: SetStateAction<string>) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(column)
            setSortOrder("asc")
        }
    }

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

    // Handle task creation
    const handleCreateTask = async (taskData: TaskInsert) => {
        try {
            const newTask = await createTask(taskData)
            setTasks(prev => [...prev, newTask])
            setShowAddTaskModal(false)
            toast.success("Task created successfully!")
        } catch (error) {
            console.error("Error creating task:", error)
            toast.error("Failed to create task")
        }
    }

    // Handle task deletion
    const handleDeleteTask = async (taskId: string) => {
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteTask(taskId)
                setTasks(prev => prev.filter(task => task.id !== taskId))
                toast.success("Task deleted successfully!")
            } catch (error) {
                console.error("Error deleting task:", error)
                toast.error("Failed to delete task")
            }
        }
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Task Management</h1>
                    <p className="text-base-content/70">Manage and track all tasks across your projects</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddTaskModal(true)}>
                    <i className="fas fa-plus mr-2"></i> Add New Task
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-primary">
                        <i className="fas fa-tasks text-3xl"></i>
                    </div>
                    <div className="stat-title">Total Tasks</div>
                    <div className="stat-value text-primary">{totalTasks}</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-success">
                        <i className="fas fa-check-circle text-3xl"></i>
                    </div>
                    <div className="stat-title">Completed</div>
                    <div className="stat-value text-success">{completedTasks}</div>
                    <div className="stat-desc">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% of total</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-primary">
                        <i className="fas fa-spinner text-3xl"></i>
                    </div>
                    <div className="stat-title">In Progress</div>
                    <div className="stat-value text-primary">{inProgressTasks}</div>
                    <div className="stat-desc">{totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}% of total</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-base-content/70">
                        <i className="fas fa-clock text-3xl"></i>
                    </div>
                    <div className="stat-title">Not Started</div>
                    <div className="stat-value">{notStartedTasks}</div>
                    <div className="stat-desc">{totalTasks > 0 ? Math.round((notStartedTasks / totalTasks) * 100) : 0}% of total</div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <h2 className="card-title mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="form-control">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    className="input input-bordered w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="btn btn-square">
                                    <i className="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                        <div className="form-control">
                            <select
                                className="select select-bordered w-full"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <select
                                className="select select-bordered w-full"
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                            >
                                <option value="All">All Projects</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-control">
                            <select
                                className="select select-bordered w-full"
                                value={assigneeFilter}
                                onChange={(e) => setAssigneeFilter(e.target.value)}
                            >
                                <option value="All">All Assignees</option>
                                {crews.map((crew) => (
                                    <option key={crew.id} value={crew.id}>
                                        {crew.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-control">
                            <select
                                className="select select-bordered w-full"
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                            >
                                <option value="All">All Priorities</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title mb-4">Task List</h2>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th className="cursor-pointer" onClick={() => handleSortChange("name")}>
                                        Task Name
                                        {sortBy === "name" && <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"} ml-2`}></i>}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSortChange("project")}>
                                        Project
                                        {sortBy === "project" && (
                                            <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"} ml-2`}></i>
                                        )}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSortChange("assignee")}>
                                        Assigned To
                                        {sortBy === "assignee" && (
                                            <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"} ml-2`}></i>
                                        )}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSortChange("end_date")}>
                                        Due Date
                                        {sortBy === "end_date" && (
                                            <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"} ml-2`}></i>
                                        )}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSortChange("status")}>
                                        Status
                                        {sortBy === "status" && (
                                            <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"} ml-2`}></i>
                                        )}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSortChange("priority")}>
                                        Priority
                                        {sortBy === "priority" && (
                                            <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"} ml-2`}></i>
                                        )}
                                    </th>
                                    <th className="cursor-pointer" onClick={() => handleSortChange("progress")}>
                                        Progress
                                        {sortBy === "progress" && (
                                            <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"} ml-2`}></i>
                                        )}
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map((task) => (
                                    <tr key={task.id}>
                                        <td>
                                            <div className="font-medium">{task.name}</div>
                                            <div className="text-xs text-base-content/70 truncate max-w-xs">{task.description}</div>
                                        </td>
                                        <td>
                                            <Link href={`/dashboard/projects/${task.project_id}`} className="hover:underline">
                                                {projectMap[task.project_id] || "Unknown Project"}
                                            </Link>
                                        </td>
                                        <td>{task.assigned_to ? crewMap[task.assigned_to] || "Unknown Crew" : "Unassigned"}</td>
                                        <td>{task.end_date ? formatDate(task.end_date) : "No due date"}</td>
                                        <td>
                                            <div className={`badge ${getStatusBadgeColor(task.status)}`}>{formatStatus(task.status)}</div>
                                        </td>
                                        <td>
                                            <div className={`badge ${getPriorityBadgeColor(task.priority)}`}>{formatPriority(task.priority)}</div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <progress className="progress progress-primary w-20" value={task.progress || 0} max="100"></progress>
                                                <span className="text-xs">{task.progress || 0}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <Link href={`/dashboard/tasks/${task.id}`} className="btn btn-ghost btn-xs">
                                                    <i className="fas fa-eye"></i>
                                                </Link>
                                                <button className="btn btn-ghost btn-xs">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-ghost btn-xs text-error"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8">
                                            <div className="text-base-content/70">
                                                {tasks.length === 0 ? "No tasks found. Create your first task to get started." : "No tasks match your current filters."}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Task Modal - Simplified for now */}
            {showAddTaskModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-3xl">
                        <h3 className="font-bold text-lg mb-4">Add New Task</h3>
                        <p className="text-base-content/70">Task creation modal coming soon. For now, use the project detail pages to create tasks.</p>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddTaskModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddTaskModal(false)}></div>
                </div>
            )}
        </div>
    )
}

// Helper function to format date
function formatDate(dateString: string | number | Date) {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
}
