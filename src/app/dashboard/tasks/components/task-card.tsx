"use client";

import { useState } from "react";
import { TaskWithDetails, TaskPriority, taskPriorityOptions } from "@/types/tasks";
import Link from "next/link";
import { format } from "date-fns";
import { formatDate } from "@/utils/formatters";
import { useBusiness } from "@/lib/business-context";
import { QuickUpdateTaskRequest } from "@/lib/api/tasks";

interface TaskCardProps {
    task: TaskWithDetails;
    onTaskUpdate: (taskId: string, updates: QuickUpdateTaskRequest) => Promise<void>;
    projects?: { id: string; name: string }[];
    crews?: { id: string; name: string }[];
}

export default function TaskCard({ task, onTaskUpdate, projects = [], crews = [] }: TaskCardProps) {
    const { businessId } = useBusiness();
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

    const handleTaskUpdate = async (updates: QuickUpdateTaskRequest) => {
        await onTaskUpdate(task.id, { ...updates });
    };

    return (
        <div
            className={`card bg-base-100 shadow-lg border border-base-300 cursor-move transition-all duration-200 hover:shadow-md mb-3 ${isDragging ? "opacity-50 scale-95" : ""}`}
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
                        className="progress progress-secondary w-full h-2"
                        value={task.progress || 0}
                        max="100"
                    ></progress>
                </div>

                <div className="flex justify-between items-center mt-3">
                    <Link
                        href={`/dashboard/tasks/${task.id}`}
                        className="btn btn-primary btn-xs"
                        title="View Details"
                    >
                        <i className="far fa-eye"></i> Details
                    </Link>
                    <div className="text-xs text-base-content/50">
                        {task.created_at && formatDate(task.created_at)}
                    </div>
                </div>
            </div>
        </div>
    );
}
