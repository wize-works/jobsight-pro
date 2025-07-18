"use client";

import { useState } from "react";
import { TaskWithDetails, TaskStatus, TaskUpdate } from "@/types/tasks";
import TaskCard from "./task-card";
import { QuickUpdateTaskRequest } from "@/lib/api/tasks";

interface KanbanColumnProps {
    title: string;
    status: TaskStatus | "inactive";
    tasks: TaskWithDetails[];
    onTaskUpdate: (taskId: string, updates: QuickUpdateTaskRequest) => Promise<void>;
    projects?: { id: string; name: string }[];
    crews?: { id: string; name: string }[];
}

export default function KanbanColumn({ title, status, tasks, onTaskUpdate, projects = [], crews = [] }: KanbanColumnProps) {
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
                // Handle the "inactive" column which represents both not_started and on_hold
                let targetStatus = status;
                if (status === "inactive") {
                    // Default to not_started when dropping into inactive column
                    targetStatus = "not_started";
                }

                await onTaskUpdate(taskId, {
                    updates: {
                        status: targetStatus as any,
                        // Auto-update progress based on status
                        ...(targetStatus === "completed" && { progress: 100 }),
                        ...(targetStatus === "not_started" && { progress: 0 }),
                    }
                });
            }
        } catch (error) {
            console.error("Error handling drop:", error);
        }
    };

    const getColumnColor = (status: TaskStatus | "inactive") => {
        switch (status) {
            case "inactive":
            case "not_started": return "border-l-secondary";
            case "in_progress": return "border-l-warning";
            case "completed": return "border-l-success";
            case "on_hold": return "border-l-info";
            case "cancelled": return "border-l-error";
            default: return "border-l-base-300";
        }
    };

    const getColumnBgColor = (status: TaskStatus | "inactive") => {
        switch (status) {
            case "inactive":
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
            className={`flex-1 min-w-72`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`card bg-base-100 shadow-lg h-full border-l-4 ${getColumnColor(status)} ${isDragOver ? "ring-2 ring-primary ring-opacity-50 scale-[1.02]" : ""
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
