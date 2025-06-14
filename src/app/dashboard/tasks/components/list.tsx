// Update the existing list.tsx file
// filepath: g:\code\@wizeworks\jobsight-pro-next\src\app\dashboard\tasks\components\list.tsx
"use client";

import { useState, useEffect, useMemo, SetStateAction } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTask, updateTask, deleteTask } from "@/app/actions/tasks";
import { Task, TaskInsert, TaskPriority, taskPriorityOptions, TaskStatus, taskStatusOptions, TaskWithDetails } from "@/types/tasks";
import { Project } from "@/types/projects";
import { Crew } from "@/types/crews";
import toast from "react-hot-toast";
import KanbanPage from "./kanban";
import TaskModal from "./modal-task"; // Add this import

interface TasksComponentProps {
    tasks: TaskWithDetails[];
    projects: Project[];
    crews: Crew[];
}

export default function TasksComponent({ tasks: initialTasks, projects, crews }: TasksComponentProps) {
    const router = useRouter();
    const [tasks, setTasks] = useState(initialTasks);
    const [filteredTasks, setFilteredTasks] = useState(initialTasks);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<TaskStatus>("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority>("all");
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
    const [sortBy, setSortBy] = useState("end_date");
    const [sortOrder, setSortOrder] = useState("asc");
    const [viewType, setViewType] = useState<"kanban" | "list">(
        typeof window !== "undefined" ? localStorage.getItem("tasksViewType") as "kanban" | "list" || "list" : "list"
    );

    // Calculate statistics
    const { totalTasks, completedTasks, inProgressTasks, overdueTasks } = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(task => task.status === "completed").length;
        const inProgress = tasks.filter(task => task.status === "in_progress").length;
        const overdue = tasks.filter(task => {
            if (task.status === "completed" || !task.end_date) return false;
            return new Date(task.end_date) < new Date();
        }).length;

        return {
            totalTasks: total,
            completedTasks: completed,
            inProgressTasks: inProgress,
            overdueTasks: overdue
        };
    }, [tasks]);

    // Filter tasks based on search and filters
    useEffect(() => {
        let filtered = tasks;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(task =>
                task.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.crew_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(task => task.status === statusFilter);
        }

        // Project filter
        if (projectFilter !== "all") {
            filtered = filtered.filter(task => task.project_id === projectFilter);
        }

        // Assignee filter
        if (assigneeFilter !== "all") {
            filtered = filtered.filter(task => task.assigned_to === assigneeFilter);
        }

        // Priority filter
        if (priorityFilter !== "all") {
            filtered = filtered.filter(task => task.priority === priorityFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal: any = a[sortBy as keyof TaskWithDetails];
            let bVal: any = b[sortBy as keyof TaskWithDetails];

            if (sortBy === "end_date" || sortBy === "start_date") {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            }

            if (sortOrder === "asc") {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        setFilteredTasks(filtered);
    }, [tasks, searchQuery, statusFilter, projectFilter, assigneeFilter, priorityFilter, sortBy, sortOrder]);

    const handleSortChange = (column: SetStateAction<string>) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    }

    const updateViewType = (type: "kanban" | "list") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            localStorage.setItem("tasksViewType", type);
        }
    };

    // Handle task creation
    const handleCreateTask = async (task: Task) => {
        setTasks(prev => [...prev, task as TaskWithDetails]);
        setShowAddTaskModal(false);
        router.refresh();
    };

    // Handle task update
    const handleUpdateTask = async (task: Task) => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t));
        setShowEditTaskModal(false);
        setSelectedTask(null);
        router.refresh();
    };

    // Handle task deletion
    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;

        try {
            await deleteTask(taskId);
            setTasks(prev => prev.filter(task => task.id !== taskId));
            toast.success("Task deleted successfully!");
            router.refresh();
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Failed to delete task");
        }
    };

    // Handle edit task
    const handleEditTask = (task: TaskWithDetails) => {
        setSelectedTask(task);
        setShowEditTaskModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Tasks</h1>
                    <p className="text-base-content/70">Manage and track task progress</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddTaskModal(true)}>
                    <i className="fas fa-plus mr-2"></i> Add New Task
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-primary">
                        <div className="bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-tasks fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-title">Total Tasks</div>
                    <div className="stat-value text-primary">{totalTasks}</div>
                    <div className="stat-desc">Total number of tasks across all projects</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-success">
                        <div className="bg-success/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-check-circle fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-title">Completed</div>
                    <div className="stat-value text-success">{completedTasks}</div>
                    <div className="stat-desc">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-info">
                        <div className="bg-info/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-play-circle fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-title">In Progress</div>
                    <div className="stat-value text-info">{inProgressTasks}</div>
                    <div className="stat-desc">Currently active tasks</div>
                </div>
                <div className="stat bg-base-100 shadow-sm">
                    <div className="stat-figure text-error">
                        <div className="bg-error/20 rounded-full h-12 w-12 flex items-center justify-center">
                            <i className="fas fa-exclamation-triangle fa-lg"></i>
                        </div>
                    </div>
                    <div className="stat-title">Overdue</div>
                    <div className="stat-value text-error">{overdueTasks}</div>
                    <div className="stat-desc">Tasks past due date</div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-2">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <label className="input input-secondary">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="grow"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </label>
                        {taskStatusOptions.select(
                            statusFilter,
                            (value) => setStatusFilter(value as TaskStatus),
                            "select select-bordered select-secondary"
                        )}
                        <select
                            className="select select-bordered select-secondary"
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                        >
                            <option value="all">All Projects</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>

                        <select
                            className="select select-bordered select-secondary"
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                        >
                            <option value="all">All Assignees</option>
                            {crews.map(crew => (
                                <option key={crew.id} value={crew.id}>{crew.name}</option>
                            ))}
                        </select>

                        {taskPriorityOptions.select(
                            priorityFilter,
                            (value) => setPriorityFilter(value as TaskPriority),
                            "select select-bordered select-secondary"
                        )}

                        {/* View Toggle */}
                        <div className="tabs tabs-box tabs-sm flex-nowrap">
                            <button role="tab" className={`tab tab-secondary ${viewType === "kanban" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("kanban")}> <i className="fas fa-chart-kanban"></i> </button>
                            <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="fas fa-table-rows"></i> </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Content */}
            {viewType === "kanban" ? (
                <KanbanPage
                    tasks={filteredTasks}
                    projects={projects.map(p => ({ id: p.id, name: p.name }))}
                    crews={crews.map(c => ({ id: c.id, name: c.name }))}
                />
            ) : (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th
                                            className="cursor-pointer hover:bg-base-200"
                                            onClick={() => handleSortChange("name")}
                                        >
                                            Task Name
                                            {sortBy === "name" && (
                                                <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"} ml-1`}></i>
                                            )}
                                        </th>
                                        <th>Project</th>
                                        <th>Assigned To</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th
                                            className="cursor-pointer hover:bg-base-200"
                                            onClick={() => handleSortChange("end_date")}
                                        >
                                            Due Date
                                            {sortBy === "end_date" && (
                                                <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"} ml-1`}></i>
                                            )}
                                        </th>
                                        <th>Progress</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.length > 0 ? (
                                        filteredTasks.map((task) => (
                                            <tr key={task.id} className="hover">
                                                <td>
                                                    <div className="font-medium">
                                                        <Link href={`/dashboard/tasks/${task.id}`} className="link link-hover">
                                                            {task.name}
                                                        </Link>
                                                    </div>
                                                    {task.description && (
                                                        <div className="text-sm text-base-content/70 truncate max-w-md">
                                                            {task.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <Link href={`/dashboard/projects/${task.project_id}`} className="link link-hover text-sm">
                                                        {task.project_name || "Unknown Project"}
                                                    </Link>
                                                </td>
                                                <td className="text-sm">{task.crew_name || "Unassigned"}</td>
                                                <td>{taskPriorityOptions.badge(task.priority as TaskPriority, "badge-sm")}</td>
                                                <td>{taskStatusOptions.badge(task.status as TaskStatus)}</td>
                                                <td className="text-sm">
                                                    {task.end_date ? (
                                                        <div className={
                                                            new Date(task.end_date) < new Date() && task.status !== "completed"
                                                                ? "text-error font-medium"
                                                                : ""
                                                        }>
                                                            {formatDate(task.end_date)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-base-content/50">No due date</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <progress
                                                            className="progress progress-primary w-16"
                                                            value={task.progress || 0}
                                                            max="100"
                                                        ></progress>
                                                        <span className="text-xs">{task.progress || 0}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-1">
                                                        <button
                                                            className="btn btn-ghost btn-xs"
                                                            onClick={() => handleEditTask(task)}
                                                            title="Edit Task"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-xs text-error"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            title="Delete Task"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="text-center py-4">
                                                <div className="flex flex-col items-center gap-2">
                                                    <i className="fas fa-tasks text-4xl text-base-content/30"></i>
                                                    <p className="text-base-content/70">No tasks found</p>
                                                    <p className="text-sm text-base-content/50">Try adjusting your filters or create a new task</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Task Modal */}
            {showAddTaskModal && (
                <TaskModal
                    isOpen={showAddTaskModal}
                    onClose={() => setShowAddTaskModal(false)}
                    onSave={handleCreateTask}
                />
            )}

            {/* Edit Task Modal */}
            {showEditTaskModal && selectedTask && (
                <TaskModal
                    isOpen={showEditTaskModal}
                    onClose={() => {
                        setShowEditTaskModal(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    onSave={handleUpdateTask}
                />
            )}
        </div>
    );
}

// Helper function to format date
function formatDate(dateString: string | number | Date) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
}