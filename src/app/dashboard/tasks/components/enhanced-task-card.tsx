"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Task, TaskPriority, taskPriorityOptions, TaskStatus, taskStatusOptions, TaskWithDetails } from "@/types/tasks";
import { Crew } from "@/types/crews";
import { useTaskMutations } from "@/hooks/useTasks";
import { useBusiness } from "@/lib/business-context";
import { formatDate } from "@/utils/date";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import "./task-animations.css";
import { QuickUpdateTaskRequest } from "@/lib/api/tasks";

interface EnhancedTaskCardProps {
    task: TaskWithDetails;
    crews: Crew[];
    onTaskUpdate: (updatedTask: Task) => void;
    onOpenDetails: (task: TaskWithDetails) => void;
    onDelete: (taskId: string) => void;
}

export default function EnhancedTaskCard({
    task,
    crews,
    onTaskUpdate,
    onOpenDetails,
    onDelete
}: EnhancedTaskCardProps) {
    const { businessId } = useBusiness();
    const [isEditing, setIsEditing] = useState(false);
    const [editingName, setEditingName] = useState(task.name);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const { quickUpdateTask } = useTaskMutations();

    useEffect(() => {
        if (isEditing && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditing]);

    const handleQuickUpdate = async (updates: Partial<Task>) => {
        try {
            setIsUpdating(true);
            const result = await quickUpdateTask(task.id, { updates });
            if (result.success && result.task) {
                onTaskUpdate(result.task);

                // Subtle success feedback
                const updateType = updates.status ? 'Status' : updates.priority ? 'Priority' : updates.assigned_to ? 'Assignment' : 'Task';
                toast.success(`${updateType} updated`, {
                    duration: 2000,
                    style: {
                        background: '#10B981',
                        color: 'white',
                        fontSize: '14px'
                    }
                });
            } else {
                toast.error(result.error || "Failed to update task");
            }
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleNameEdit = async () => {
        if (editingName.trim() && editingName !== task.name) {
            await handleQuickUpdate({ name: editingName.trim() });
        }
        setIsEditing(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameEdit();
        } else if (e.key === 'Escape') {
            setEditingName(task.name);
            setIsEditing(false);
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'completed': return 'success';
            case 'in_progress': return 'info';
            case 'on_hold': return 'warning';
            case 'cancelled': return 'error';
            default: return 'ghost';
        }
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'info';
            default: return 'ghost';
        }
    };

    const getNextStatus = (currentStatus: TaskStatus): TaskStatus => {
        switch (currentStatus) {
            case 'not_started': return 'in_progress';
            case 'in_progress': return 'completed';
            case 'completed': return 'not_started';
            case 'on_hold': return 'in_progress';
            case 'cancelled': return 'not_started';
            default: return 'in_progress';
        }
    };

    const getNextPriority = (currentPriority: TaskPriority): TaskPriority => {
        switch (currentPriority) {
            case 'low': return 'medium';
            case 'medium': return 'high';
            case 'high': return 'low';
            default: return 'medium';
        }
    };

    const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed'; return (
        <div
            className={`card bg-base-100 shadow-lg task-card-hover border-l-4 animate-fadeInUp ${isOverdue ? 'border-l-error glow-high' :
                task.status === 'completed' ? 'border-l-success' :
                    task.status === 'in_progress' ? 'border-l-info' : 'border-l-base-300'
                } ${isUpdating ? 'opacity-70' : ''}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="card-body p-4">                {/* Header with status and priority */}
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={() => handleQuickUpdate({ status: getNextStatus(task.status as TaskStatus) })}
                        className={`btn btn-xs btn-${getStatusColor(task.status as TaskStatus)} btn-micro scale-on-hover status-transition`}
                        disabled={isUpdating}
                        title={`Change to ${getNextStatus(task.status as TaskStatus)}`}
                    >
                        {task.status === 'completed' ? (
                            <i className="far fa-check-circle animate-pulse-slow"></i>
                        ) : task.status === 'in_progress' ? (
                            <i className="far fa-spinner-third animate-spin-slow"></i>
                        ) : (
                            <i className="far fa-play"></i>
                        )}
                    </button>

                    <button
                        onClick={() => handleQuickUpdate({ priority: getNextPriority(task.priority as TaskPriority) })}
                        className={`btn btn-xs btn-${getPriorityColor(task.priority as TaskPriority)} btn-micro scale-on-hover status-transition ${task.priority === 'high' ? 'glow-high' :
                            task.priority === 'medium' ? 'glow-medium' :
                                task.priority === 'low' ? 'glow-low' : ''
                            }`}
                        disabled={isUpdating}
                        title={`Change to ${getNextPriority(task.priority as TaskPriority)} priority`}
                    >
                        <i className={`far fa-${task.priority === 'high' ? 'exclamation-triangle animate-bounce-small' : task.priority === 'medium' ? 'minus' : 'arrow-down'}`}></i>
                    </button>
                </div>

                {/* Task name - editable */}
                <div className="mb-3">
                    {isEditing ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleNameEdit}
                            onKeyDown={handleKeyPress}
                            className="input input-ghost input-sm w-full font-medium text-base-content"
                            disabled={isUpdating}
                        />
                    ) : (
                        <h3
                            className="text-lg font-medium cursor-text hover:bg-base-200/50 px-2 py-1 rounded transition-colors"
                            onClick={() => setIsEditing(true)}
                            title="Click to edit"
                        >
                            {task.name}
                        </h3>
                    )}
                </div>                {/* Progress bar with percentage */}
                {task.progress !== null && task.progress !== undefined && (
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-base-content/70">Progress</span>
                            <span className="text-xs font-medium">{task.progress}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={task.progress}
                            onChange={(e) => handleQuickUpdate({ progress: parseInt(e.target.value) })}
                            className="range range-xs range-primary w-full cursor-pointer"
                            disabled={isUpdating}
                        />
                    </div>
                )}                {/* Assignment dropdown */}
                <div className="mb-3">
                    <select
                        value={task.assigned_to || ""}
                        onChange={(e) => handleQuickUpdate({ assigned_to: e.target.value || null })}
                        className="select select-xs select-bordered w-full bg-base-100 hover:bg-base-200 transition-colors"
                        disabled={isUpdating}
                    >
                        <option value="">Unassigned</option>
                        {crews.map((crew) => (
                            <option key={crew.id} value={crew.id}>
                                {crew.name}
                            </option>
                        ))}
                    </select>
                </div>{/* Due date info */}
                <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-base-content/60">
                        Project: {task.project_name}
                    </span>

                    {task.end_date && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-error' : 'text-base-content/70'}`}>
                            <i className="far fa-calendar"></i>
                            {isOverdue ? (
                                <span className="font-medium text-error">
                                    Overdue {formatDistanceToNow(new Date(task.end_date))}
                                </span>
                            ) : (
                                <span>Due {formatDate(task.end_date)}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Description preview */}
                {task.description && (
                    <div className="text-sm text-base-content/80 line-clamp-2">
                        {task.description}
                    </div>
                )}                {/* Status badges and metadata */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-base-200">
                    <div className="flex items-center gap-2">
                        {taskStatusOptions.badge(task.status as TaskStatus, "badge-xs")}
                        {taskPriorityOptions.badge(task.priority as TaskPriority, "badge-xs")}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-base-content/50">
                        {task.created_at && (
                            <span title={`Created ${formatDate(task.created_at)}`}>
                                <i className="far fa-clock"></i>
                                {formatDistanceToNow(new Date(task.created_at))}
                            </span>
                        )}
                    </div>
                </div>                {/* Action Buttons */}
                <div className="card-actions justify-between items-center pt-2 mt-auto">
                    <div className={`flex gap-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-30'}`}>
                        <button
                            onClick={() => onDelete(task.id)}
                            className="btn btn-ghost btn-sm btn-circle hover:btn-error"
                            title="Delete task"
                        >
                            <i className="far fa-trash"></i>
                        </button>

                        <Link
                            href={`/dashboard/projects/${task.project_id}`}
                            className="btn btn-ghost btn-sm btn-circle hover:btn-info"
                            title="View project"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <i className="far fa-folder"></i>
                        </Link>
                    </div>

                    <button
                        onClick={() => onOpenDetails(task)}
                        className="btn btn-primary btn-xs"
                    >
                        <i className="far fa-eye mr-1"></i>
                        View Details
                    </button>
                </div>
            </div>            {/* Loading overlay */}
            {isUpdating && (
                <div className="absolute inset-0 bg-base-100/50 flex items-center justify-center rounded-2xl">
                    <span className="loading loading-spinner loading-sm"></span>
                </div>
            )}
        </div>
    );
}
