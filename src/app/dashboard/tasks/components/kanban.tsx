"use client";

import { useState } from "react";
import { TaskWithDetails, TaskStatus, taskStatusOptions, TaskPriority, taskPriorityOptions, TaskUpdate } from "@/types/tasks";
import { updateTask } from "@/app/actions/tasks";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { formatDate } from "@/utils/formatters";

interface KanbanPageProps {
    tasks?: TaskWithDetails[];
    projects?: { id: string; name: string }[];
    crews?: { id: string; name: string }[];
}

interface KanbanColumnProps {
    title: string;
    status: TaskStatus;
    tasks: TaskWithDetails[];
    onTaskUpdate: (taskId: string, updates: Partial<TaskWithDetails>) => Promise<void>;
    projects?: { id: string; name: string }[];
    crews?: { id: string; name: string }[];
}

interface TaskCardProps {
    task: TaskWithDetails;
    onTaskUpdate: (taskId: string, updates: Partial<TaskWithDetails>) => Promise<void>;
    projects?: { id: string; name: string }[];
    crews?: { id: string; name: string }[];
}

function TaskCard({ task, onTaskUpdate, projects = [], crews = [] }: TaskCardProps) {
    const [isDragging, setIsDragging] = useState(false);

    const projectName = projects.find(p => p.id === task.project_id)?.name || task.project_name || "Unknown Project";
    const crewName = crews.find(c => c.id === task.assigned_to)?.name || task.crew_name || "Unassigned";

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        e.dataTransfer.setData("text/plain", JSON.stringify({
            taskId: task.id,
            currentStatus: task.status
        }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            className={`card bg-base-100 shadow-sm border border-base-300 cursor-move transition-all duration-200 hover:shadow-md mb-3 ${isDragging ? "opacity-50 scale-95" : ""
                }`}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="card-body p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="card-title text-sm font-medium leading-tight">{task.name}</h3>
                    {taskPriorityOptions.badge(task.priority as TaskPriority, "badge-xs")}
                </div>

                {task.description && (
                    <p className="text-xs text-base-content/70 mb-2 line-clamp-2">{task.description}</p>
                )}

                <div className="space-y-6 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Project:</span>
                        <Link
                            href={`/dashboard/projects/${task.project_id}`}
                            className="text-primary hover:underline font-medium truncate max-w-24"
                            title={projectName}
                        >
                            {projectName}
                        </Link>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Assigned:</span>
                        <span className="font-medium truncate max-w-24" title={crewName}>
                            {crewName}
                        </span>
                    </div>

                    {task.end_date && (
                        <div className="flex justify-between items-center">
                            <span className="text-base-content/60">Due:</span>
                            <span className={`font-medium ${new Date(task.end_date) < new Date() && task.status !== "completed"
                                ? "text-error"
                                : "text-base-content"
                                }`}>
                                {format(new Date(task.end_date), "MMM dd")}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-base-content/60">Progress</span>
                        <span className="text-xs font-medium">{task.progress || 0}%</span>
                    </div>
                    <progress
                        className="progress progress-primary w-full h-2"
                        value={task.progress || 0}
                        max="100"
                    ></progress>
                </div>

                <div className="flex justify-between items-center mt-3">
                    <Link
                        href={`/dashboard/tasks/${task.id}`}
                        className="btn btn-ghost btn-xs"
                        title="View Details"
                    >
                        <i className="fas fa-eye"></i>
                    </Link>
                    <div className="text-xs text-base-content/50">
                        {task.created_at && formatDate(task.created_at)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KanbanColumn({ title, status, tasks, onTaskUpdate, projects = [], crews = [] }: KanbanColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData("text/plain"));
            const { taskId, currentStatus } = data;

            if (currentStatus !== status && status !== "all") {
                await onTaskUpdate(taskId, {
                    status: status,
                    // Auto-update progress based on status
                    ...(status === "completed" && { progress: 100 }),
                    ...(status === "not_started" && { progress: 0 }),
                });
            }
        } catch (error) {
            console.error("Error handling drop:", error);
        }
    };

    const getColumnColor = (status: TaskStatus) => {
        switch (status) {
            case "not_started": return "border-l-secondary";
            case "in_progress": return "border-l-warning";
            case "completed": return "border-l-success";
            case "on_hold": return "border-l-info";
            case "cancelled": return "border-l-error";
            default: return "border-l-base-300";
        }
    };

    const getColumnBgColor = (status: TaskStatus) => {
        switch (status) {
            case "not_started": return "bg-secondary/5";
            case "in_progress": return "bg-warning/5";
            case "completed": return "bg-success/5";
            case "on_hold": return "bg-info/5";
            case "cancelled": return "bg-error/5";
            default: return "bg-base-200/30";
        }
    };

    return (
        <div
            className={`flex-1 min-w-72 max-w-80`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`card bg-base-100 shadow-sm h-full border-l-4 ${getColumnColor(status)} ${isDragOver ? "ring-2 ring-primary ring-opacity-50 scale-[1.02]" : ""
                } transition-all duration-200`}>
                <div className="card-body p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="card-title text-base font-semibold">{title}</h2>
                        <div className="badge badge-outline badge-sm">{tasks.length}</div>
                    </div>

                    <div
                        className={`min-h-96 rounded-lg p-2 transition-colors duration-200 ${isDragOver ? getColumnBgColor(status) : "bg-transparent"
                            }`}
                    >
                        {tasks.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-base-content/50 text-sm">
                                No tasks
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {tasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onTaskUpdate={onTaskUpdate}
                                        projects={projects}
                                        crews={crews}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function KanbanPage({ tasks = [], projects = [], crews = [] }: KanbanPageProps) {
    const [taskList, setTaskList] = useState(tasks);

    const handleTaskUpdate = async (taskId: string, updates: Partial<TaskWithDetails>) => {
        try {
            const updatedTask = await updateTask(taskId, updates as TaskUpdate);
            setTaskList(prev =>
                prev.map(task =>
                    task.id === taskId ? { ...task, ...updates } : task
                )
            );
            toast.success("Task updated successfully!");
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task");
        }
    };

    // Define the columns we want to show
    const columns = [
        { title: "Not Started", status: "not_started" as TaskStatus },
        { title: "In Progress", status: "in_progress" as TaskStatus },
        { title: "On Hold", status: "on_hold" as TaskStatus },
        { title: "Completed", status: "completed" as TaskStatus },
        { title: "Cancelled", status: "cancelled" as TaskStatus },
    ];

    // Group tasks by status
    const tasksByStatus = columns.reduce((acc, column) => {
        acc[column.status] = taskList.filter(task => task.status === column.status);
        return acc;
    }, {} as Record<TaskStatus, TaskWithDetails[]>);

    return (
        <div className="space-y-6">
            {/* Kanban Board */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="card-title">Task Board</h2>
                        <div className="text-sm text-base-content/70">
                            Drag tasks between columns to update their status
                        </div>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-4">
                        {columns.map((column) => (
                            <KanbanColumn
                                key={column.status}
                                title={column.title}
                                status={column.status}
                                tasks={tasksByStatus[column.status] || []}
                                onTaskUpdate={handleTaskUpdate}
                                projects={projects}
                                crews={crews}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}