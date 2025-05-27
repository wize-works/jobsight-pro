"use client"

import { useState, useEffect, SetStateAction } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Mock data for tasks
const tasksData = [
    {
        id: "task1",
        name: "Excavation",
        projectId: "proj1",
        projectName: "Main Street Development",
        assignedTo: "crew1",
        assignedToName: "Foundation Team",
        startDate: "2025-03-20",
        endDate: "2025-04-05",
        status: "Completed",
        priority: "High",
        progress: 100,
        description: "Complete excavation of the site according to architectural plans.",
    },
    {
        id: "task2",
        name: "Foundation Pouring",
        projectId: "proj1",
        projectName: "Main Street Development",
        assignedTo: "crew1",
        assignedToName: "Foundation Team",
        startDate: "2025-04-10",
        endDate: "2025-05-10",
        status: "Completed",
        priority: "High",
        progress: 100,
        description: "Pour concrete foundation according to engineering specifications.",
    },
    {
        id: "task3",
        name: "Underground Electrical",
        projectId: "proj1",
        projectName: "Main Street Development",
        assignedTo: "crew3",
        assignedToName: "Electrical Team",
        startDate: "2025-05-15",
        endDate: "2025-06-15",
        status: "In Progress",
        priority: "Medium",
        progress: 60,
        description: "Install underground electrical conduits and wiring.",
    },
    {
        id: "task4",
        name: "First Floor Framing",
        projectId: "proj1",
        projectName: "Main Street Development",
        assignedTo: "crew1",
        assignedToName: "Foundation Team",
        startDate: "2025-06-20",
        endDate: "2025-07-20",
        status: "Not Started",
        priority: "Medium",
        progress: 0,
        description: "Complete structural framing for the first floor.",
    },
    {
        id: "task5",
        name: "Site Clearing",
        projectId: "proj2",
        projectName: "Riverside Apartments",
        assignedTo: "crew2",
        assignedToName: "Framing Crew",
        startDate: "2025-02-05",
        endDate: "2025-02-15",
        status: "Completed",
        priority: "High",
        progress: 100,
        description: "Clear the site of vegetation and debris in preparation for construction.",
    },
    {
        id: "task6",
        name: "Foundation Work - Building A",
        projectId: "proj2",
        projectName: "Riverside Apartments",
        assignedTo: "crew2",
        assignedToName: "Framing Crew",
        startDate: "2025-02-20",
        endDate: "2025-03-10",
        status: "Completed",
        priority: "High",
        progress: 100,
        description: "Complete foundation work for Building A.",
    },
    {
        id: "task7",
        name: "Foundation Work - Building B",
        projectId: "proj2",
        projectName: "Riverside Apartments",
        assignedTo: "crew2",
        assignedToName: "Framing Crew",
        startDate: "2025-03-15",
        endDate: "2025-03-30",
        status: "Completed",
        priority: "High",
        progress: 100,
        description: "Complete foundation work for Building B.",
    },
    {
        id: "task8",
        name: "Framing - Building A",
        projectId: "proj2",
        projectName: "Riverside Apartments",
        assignedTo: "crew2",
        assignedToName: "Framing Crew",
        startDate: "2025-04-05",
        endDate: "2025-04-25",
        status: "Completed",
        priority: "Medium",
        progress: 100,
        description: "Complete structural framing for Building A.",
    },
    {
        id: "task9",
        name: "Framing - Building B",
        projectId: "proj2",
        projectName: "Riverside Apartments",
        assignedTo: "crew2",
        assignedToName: "Framing Crew",
        startDate: "2025-04-30",
        endDate: "2025-05-20",
        status: "In Progress",
        priority: "Medium",
        progress: 75,
        description: "Complete structural framing for Building B.",
    },
    {
        id: "task10",
        name: "Rough Plumbing - Building A",
        projectId: "proj2",
        projectName: "Riverside Apartments",
        assignedTo: "crew4",
        assignedToName: "Plumbing Specialists",
        startDate: "2025-05-01",
        endDate: "2025-05-15",
        status: "In Progress",
        priority: "Medium",
        progress: 50,
        description: "Install rough plumbing in Building A.",
    },
    {
        id: "task11",
        name: "Public Hearings",
        projectId: "proj3",
        projectName: "Downtown Project",
        assignedTo: "manager",
        assignedToName: "David Martinez",
        startDate: "2025-01-15",
        endDate: "2025-02-15",
        status: "Completed",
        priority: "High",
        progress: 100,
        description: "Conduct public hearings to gather community input on the downtown revitalization project.",
    },
    {
        id: "task12",
        name: "Electrical Infrastructure Upgrade",
        projectId: "proj3",
        projectName: "Downtown Project",
        assignedTo: "crew3",
        assignedToName: "Electrical Team",
        startDate: "2025-03-01",
        endDate: "2025-04-30",
        status: "Completed",
        priority: "High",
        progress: 100,
        description: "Upgrade electrical infrastructure in the downtown area.",
    },
    {
        id: "task13",
        name: "Water and Sewer Upgrades",
        projectId: "proj3",
        projectName: "Downtown Project",
        assignedTo: "crew3",
        assignedToName: "Electrical Team",
        startDate: "2025-05-01",
        endDate: "2025-06-30",
        status: "In Progress",
        priority: "High",
        progress: 40,
        description: "Upgrade water and sewer lines in the downtown area.",
    },
    {
        id: "task14",
        name: "Foundation Work",
        projectId: "proj4",
        projectName: "Johnson Residence",
        assignedTo: "crew5",
        assignedToName: "Finishing Crew",
        startDate: "2025-04-05",
        endDate: "2025-04-15",
        status: "Completed",
        priority: "High",
        progress: 100,
        description: "Complete foundation work for the Johnson residence.",
    },
    {
        id: "task15",
        name: "Framing",
        projectId: "proj4",
        projectName: "Johnson Residence",
        assignedTo: "crew5",
        assignedToName: "Finishing Crew",
        startDate: "2025-04-20",
        endDate: "2025-05-15",
        status: "Completed",
        priority: "High",
        progress: 100,
        description: "Complete structural framing for the Johnson residence.",
    },
]

// Mock data for projects
const projectsData = {
    proj1: "Main Street Development",
    proj2: "Riverside Apartments",
    proj3: "Downtown Project",
    proj4: "Johnson Residence",
}

// Mock data for crews
const crewsData = {
    crew1: "Foundation Team",
    crew2: "Framing Crew",
    crew3: "Electrical Team",
    crew4: "Plumbing Specialists",
    crew5: "Finishing Crew",
    manager: "Project Manager",
}

export default function TasksPage() {
    const router = useRouter()
    const [tasks, setTasks] = useState(tasksData)
    const [filteredTasks, setFilteredTasks] = useState(tasksData)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("All")
    const [projectFilter, setProjectFilter] = useState("All")
    const [assigneeFilter, setAssigneeFilter] = useState("All")
    const [priorityFilter, setPriorityFilter] = useState("All")
    const [showAddTaskModal, setShowAddTaskModal] = useState(false)
    const [sortBy, setSortBy] = useState("dueDate")
    const [sortOrder, setSortOrder] = useState("asc")

    // Task statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === "Completed").length
    const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length
    const notStartedTasks = tasks.filter((task) => task.status === "Not Started").length

    // Apply filters
    useEffect(() => {
        let result = [...tasksData]

        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (task) =>
                    task.name.toLowerCase().includes(query) ||
                    task.description.toLowerCase().includes(query) ||
                    task.projectName.toLowerCase().includes(query) ||
                    task.assignedToName.toLowerCase().includes(query),
            )
        }

        // Apply status filter
        if (statusFilter !== "All") {
            result = result.filter((task) => task.status === statusFilter)
        }

        // Apply project filter
        if (projectFilter !== "All") {
            result = result.filter((task) => task.projectId === projectFilter)
        }

        // Apply assignee filter
        if (assigneeFilter !== "All") {
            result = result.filter((task) => task.assignedTo === assigneeFilter)
        }

        // Apply priority filter
        if (priorityFilter !== "All") {
            result = result.filter((task) => task.priority === priorityFilter)
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0
            switch (sortBy) {
                case "name":
                    comparison = a.name.localeCompare(b.name)
                    break
                case "project":
                    comparison = a.projectName.localeCompare(b.projectName)
                    break
                case "assignee":
                    comparison = a.assignedToName.localeCompare(b.assignedToName)
                    break
                case "status":
                    comparison = a.status.localeCompare(b.status)
                    break
                case "priority":
                    const priorityOrder = { High: 0, Medium: 1, Low: 2 }
                    comparison =
                        priorityOrder[a.priority as keyof typeof priorityOrder] -
                        priorityOrder[b.priority as keyof typeof priorityOrder]
                    break
                case "progress":
                    comparison = a.progress - b.progress
                    break
                case "dueDate":
                default:
                    comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
                    break
            }
            return sortOrder === "asc" ? comparison : -comparison
        })

        setFilteredTasks(result)
    }, [searchQuery, statusFilter, projectFilter, assigneeFilter, priorityFilter, sortBy, sortOrder])

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
            case "Completed":
                return "badge-success"
            case "In Progress":
                return "badge-primary"
            case "Not Started":
                return "badge-ghost"
            default:
                return "badge-ghost"
        }
    }

    // Get priority badge color
    const getPriorityBadgeColor = (priority: string) => {
        switch (priority) {
            case "High":
                return "badge-error"
            case "Medium":
                return "badge-warning"
            case "Low":
                return "badge-info"
            default:
                return "badge-ghost"
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
                    <div className="stat-desc">{Math.round((completedTasks / totalTasks) * 100)}% of total</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-primary">
                        <i className="fas fa-spinner text-3xl"></i>
                    </div>
                    <div className="stat-title">In Progress</div>
                    <div className="stat-value text-primary">{inProgressTasks}</div>
                    <div className="stat-desc">{Math.round((inProgressTasks / totalTasks) * 100)}% of total</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-base-content/70">
                        <i className="fas fa-clock text-3xl"></i>
                    </div>
                    <div className="stat-title">Not Started</div>
                    <div className="stat-value">{notStartedTasks}</div>
                    <div className="stat-desc">{Math.round((notStartedTasks / totalTasks) * 100)}% of total</div>
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
                                {Object.entries(projectsData).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
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
                                {Object.entries(crewsData).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
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
                                    <th className="cursor-pointer" onClick={() => handleSortChange("dueDate")}>
                                        Due Date
                                        {sortBy === "dueDate" && (
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
                                            <Link href={`/dashboard/projects/${task.projectId}`} className="hover:underline">
                                                {task.projectName}
                                            </Link>
                                        </td>
                                        <td>{task.assignedToName}</td>
                                        <td>{formatDate(task.endDate)}</td>
                                        <td>
                                            <div className={`badge ${getStatusBadgeColor(task.status)}`}>{task.status}</div>
                                        </td>
                                        <td>
                                            <div className={`badge ${getPriorityBadgeColor(task.priority)}`}>{task.priority}</div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <progress className="progress progress-primary w-20" value={task.progress} max="100"></progress>
                                                <span className="text-xs">{task.progress}%</span>
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
                                                <button className="btn btn-ghost btn-xs text-error">
                                                    <i className="fas fa-trash"></i>
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

            {/* Add Task Modal */}
            {showAddTaskModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-3xl">
                        <h3 className="font-bold text-lg mb-4">Add New Task</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Task Name</span>
                                </label>
                                <input type="text" placeholder="Enter task name" className="input input-bordered" />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Project</span>
                                </label>
                                <select className="select select-bordered">
                                    <option disabled selected>
                                        Select a project
                                    </option>
                                    {Object.entries(projectsData).map(([id, name]) => (
                                        <option key={id} value={id}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Assign To</span>
                                </label>
                                <select className="select select-bordered">
                                    <option disabled selected>
                                        Select an assignee
                                    </option>
                                    {Object.entries(crewsData).map(([id, name]) => (
                                        <option key={id} value={id}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Priority</span>
                                </label>
                                <select className="select select-bordered">
                                    <option disabled selected>
                                        Select priority
                                    </option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Start Date</span>
                                </label>
                                <input type="date" className="input input-bordered" />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Due Date</span>
                                </label>
                                <input type="date" className="input input-bordered" />
                            </div>
                            <div className="form-control md:col-span-2">
                                <label className="label">
                                    <span className="label-text">Description</span>
                                </label>
                                <textarea className="textarea textarea-bordered h-24" placeholder="Enter task description"></textarea>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Status</span>
                                </label>
                                <select className="select select-bordered">
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Progress (%)</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Enter progress percentage"
                                    className="input input-bordered"
                                />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddTaskModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowAddTaskModal(false)}>
                                Add Task
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
