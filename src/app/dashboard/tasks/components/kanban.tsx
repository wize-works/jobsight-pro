"use client";

import { useState } from "react";
import { TaskWithDetails, TaskStatus, taskStatusOptions, TaskPriority, taskPriorityOptions, TaskUpdate } from "@/types/tasks";
import { useTaskMutations } from "@/hooks/useTasks";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { formatDate } from "@/utils/formatters";
import { useBusiness } from "@/lib/business-context";
import TaskCard from "./task-card";
import KanbanColumn from "./kanban-column";
import { QuickUpdateTaskRequest } from "@/lib/api/tasks";

interface KanbanPageProps {
    tasks?: TaskWithDetails[];
    projects?: { id: string; name: string }[];
    crews?: { id: string; name: string }[];
}

export default function KanbanPage({ tasks = [], projects = [], crews = [] }: KanbanPageProps) {
    const { businessId } = useBusiness();
    const [taskList, setTaskList] = useState(tasks);
    const { quickUpdateTask } = useTaskMutations();

    const handleTaskUpdate = async (taskId: string, updates: QuickUpdateTaskRequest) => {
        try {
            const result = await quickUpdateTask(taskId, updates);
            if (result.success && result.task) {
                setTaskList(prev =>
                    prev.map(task =>
                        task.id === taskId ? { ...task, ...updates.updates } : task
                    )
                );
                toast.success("Task updated successfully!");
            } else {
                toast.error(result.error || "Failed to update task");
            }
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task");
        }
    };    // Define the columns we want to show (4 columns instead of 5)
    const columns = [
        { title: "Inactive", status: "inactive" as const },
        { title: "In Progress", status: "in_progress" as TaskStatus },
        { title: "Completed", status: "completed" as TaskStatus },
        { title: "Cancelled", status: "cancelled" as TaskStatus },
    ];

    // Group tasks by status, combining not_started and on_hold into inactive
    const tasksByStatus = {
        inactive: taskList.filter(task => task.status === "not_started" || task.status === "on_hold"),
        in_progress: taskList.filter(task => task.status === "in_progress"),
        completed: taskList.filter(task => task.status === "completed"),
        cancelled: taskList.filter(task => task.status === "cancelled"),
    };

    return (
        <div className="space-y-6">
            {/* Kanban Board */}
            <div className="card bg-base-100 shadow-lg">
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
                                tasks={tasksByStatus[column.status as keyof typeof tasksByStatus] || []}
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