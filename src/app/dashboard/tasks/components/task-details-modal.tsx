"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Task, TaskPriority, taskPriorityOptions, TaskStatus, taskStatusOptions, TaskWithDetails, TaskUpdate } from "@/types/tasks";
import { Project } from "@/types/projects";
import { Crew } from "@/types/crews";
import { updateTask, deleteTask, createTask } from "@/app/actions/tasks";
import { useBusiness } from "@/lib/business-context";
import { formatDate } from "@/utils/date";
import { formatDistance, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import LocationDisplay from "@/components/location-display";

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: TaskWithDetails | null;
    project?: Project | null;
    projects?: Project[]; // For new task creation
    crews: Crew[];
    onTaskUpdate: (updatedTask: Task) => void;
    onTaskDelete: (taskId: string) => void;
    onTaskCreate?: (newTask: Task) => void; // For new task creation
}

export default function TaskDetailsModal({
    isOpen,
    onClose,
    task,
    project,
    projects = [],
    crews,
    onTaskUpdate,
    onTaskDelete,
    onTaskCreate
}: TaskDetailsModalProps) {
    const { businessId } = useBusiness();
    const [isEditing, setIsEditing] = useState(!task); // Auto-edit mode for new tasks
    const [isUpdating, setIsUpdating] = useState(false);
    const [formData, setFormData] = useState<Partial<TaskUpdate>>({});

    const isCreating = !task;

    useEffect(() => {
        if (isOpen) {
            if (task) {
                setFormData({
                    name: task.name,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    assigned_to: task.assigned_to,
                    start_date: task.start_date,
                    end_date: task.end_date,
                    progress: task.progress,
                    project_id: task.project_id
                });
                setIsEditing(false);
            } else {
                // Initialize with defaults for new task
                setFormData({
                    name: '',
                    description: '',
                    status: 'not_started',
                    priority: 'medium',
                    assigned_to: null,
                    start_date: '',
                    end_date: '',
                    progress: 0,
                    project_id: project?.id || ''
                });
                setIsEditing(true);
            }
        }
    }, [task, isOpen, project]);

    const handleSave = async () => {
        try {
            setIsUpdating(true);

            if (isCreating) {
                // Create new task
                if (!formData.name?.trim() || !formData.project_id) {
                    toast.error("Please fill in required fields (name and project)");
                    return;
                }

                const newTask = await createTask(businessId, formData as TaskUpdate);
                if (newTask && onTaskCreate) {
                    onTaskCreate(newTask);
                }
                onClose();
                toast.success("Task created successfully!");
            } else {
                // Update existing task
                const updatedTask = await updateTask(businessId, task!.id, formData as TaskUpdate);
                onTaskUpdate(updatedTask);
                setIsEditing(false);
                toast.success("Task updated successfully!");
            }
        } catch (error) {
            console.error(isCreating ? "Error creating task:" : "Error updating task:", error);
            toast.error(isCreating ? "Failed to create task" : "Failed to update task");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !confirm("Are you sure you want to delete this task?")) return;

        try {
            setIsUpdating(true);
            await deleteTask(businessId, task.id);
            onTaskDelete(task.id);
            onClose();
            toast.success("Task deleted successfully!");
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Failed to delete task");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    const isOverdue = task?.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed';

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-5xl p-0 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">
                                {isCreating ? 'Create New Task' : isEditing ? 'Edit Task' : 'Task Details'}
                            </h2>
                            {task && (
                                <div className="flex items-center gap-2 mt-2">
                                    {isOverdue && (
                                        <div className="badge badge-error badge-sm">
                                            <i className="far fa-exclamation-triangle mr-1"></i>
                                            Overdue
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            disabled={isUpdating}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Progress */}
                            <div className="card bg-base-100 border border-base-300">
                                <div className="card-body p-4">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <i className="far fa-chart-bar text-primary"></i>
                                        Progress
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        {isEditing ? (
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={formData.progress || 0}
                                                onChange={(e) => handleInputChange('progress', parseInt(e.target.value))}
                                                className="range range-primary flex-1"
                                            />
                                        ) : (
                                            <progress
                                                className="progress progress-primary flex-1"
                                                value={task?.progress || 0}
                                                max="100"
                                            ></progress>
                                        )}
                                        <span className="text-lg font-semibold min-w-[3rem] text-center">
                                            {isEditing ? (formData.progress || 0) : (task?.progress || 0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Basic Information */}
                            <div className="card bg-base-100 border border-base-300">
                                <div className="card-body p-4">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <i className="far fa-info-circle text-primary"></i>
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Task Name *</span>
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.name || ''}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                    className="input input-bordered input-secondary w-full"
                                                    placeholder="Enter task name"
                                                    disabled={isUpdating}
                                                />
                                            ) : (
                                                <div className="py-2 text-lg font-medium">{task?.name}</div>
                                            )}
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Project *</span>
                                            </label>
                                            {isCreating ? (
                                                <select
                                                    value={formData.project_id || ''}
                                                    onChange={(e) => handleInputChange('project_id', e.target.value)}
                                                    className="select select-bordered select-secondary w-full"
                                                    disabled={isUpdating}
                                                >
                                                    <option value="">Select a project</option>
                                                    {projects.map((proj) => (
                                                        <option key={proj.id} value={proj.id}>
                                                            {proj.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : task ? (
                                                <Link
                                                    href={`/dashboard/projects/${task.project_id}`}
                                                    className="link link-primary py-2 block font-medium"
                                                >
                                                    {task.project_name}
                                                </Link>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="form-control mt-4">
                                        <label className="label">
                                            <span className="label-text font-medium">Description</span>
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                value={formData.description || ''}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                className="textarea textarea-bordered textarea-secondary w-full"
                                                placeholder="Enter task description"
                                                rows={3}
                                                disabled={isUpdating}
                                            />
                                        ) : (
                                            <div className="py-2">
                                                {task?.description || <span className="text-base-content/50">No description</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Task Details */}
                            <div className="card bg-base-100 border border-base-300">
                                <div className="card-body p-4">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <i className="far fa-cogs text-primary"></i>
                                        Task Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Status</span>
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    value={formData.status || ''}
                                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                                    className="select select-bordered select-secondary w-full"
                                                    disabled={isUpdating}
                                                >
                                                    <option value="not_started">Not Started</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="on_hold">On Hold</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            ) : (
                                                <div className="py-2">
                                                    {taskStatusOptions.badge(task?.status as TaskStatus)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Priority</span>
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    value={formData.priority || ''}
                                                    onChange={(e) => handleInputChange('priority', e.target.value)}
                                                    className="select select-bordered select-secondary w-full"
                                                    disabled={isUpdating}
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                </select>
                                            ) : (
                                                <div className="py-2">
                                                    {taskPriorityOptions.badge(task?.priority as TaskPriority)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Assigned To</span>
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    value={formData.assigned_to || ''}
                                                    onChange={(e) => handleInputChange('assigned_to', e.target.value || null)}
                                                    className="select select-bordered select-secondary w-full"
                                                    disabled={isUpdating}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {crews.map((crew) => (
                                                        <option key={crew.id} value={crew.id}>
                                                            {crew.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="py-2">{task?.crew_name || "Unassigned"}</div>
                                            )}
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Start Date</span>
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={formData.start_date || ''}
                                                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                                                    className="input input-bordered input-secondary w-full"
                                                    disabled={isUpdating}
                                                />
                                            ) : (
                                                <div className="py-2">
                                                    {task?.start_date ? formatDate(task.start_date) : "Not set"}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">End Date</span>
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={formData.end_date || ''}
                                                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                                                    className="input input-bordered input-secondary w-full"
                                                    disabled={isUpdating}
                                                />
                                            ) : (
                                                <div className="py-2">
                                                    {task?.end_date ? formatDate(task.end_date) : "Not set"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="card bg-base-100 border border-base-300">
                                <div className="card-body p-4">
                                    <h3 className="font-semibold text-lg mb-4">Actions</h3>
                                    <div className="space-y-3">
                                        {!isEditing && !isCreating && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="btn btn-secondary btn-sm w-full gap-2"
                                                disabled={isUpdating}
                                            >
                                                <i className="far fa-edit"></i>
                                                Edit Task
                                            </button>
                                        )}
                                        {(isEditing || isCreating) && (
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="btn btn-outline btn-sm w-full gap-2"
                                                disabled={isUpdating || isCreating}
                                            >
                                                <i className="far fa-times"></i>
                                                Cancel Edit
                                            </button>
                                        )}
                                        {task && task.project_id && (
                                            <Link
                                                href={`/dashboard/projects/${task.project_id}`}
                                                className="btn btn-outline btn-sm w-full gap-2"
                                            >
                                                <i className="far fa-external-link"></i>
                                                View Project
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Task Info */}
                            {task && (
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4">Task Info</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                                                    <i className="far fa-calendar text-primary text-xs"></i>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Created</div>
                                                    <div className="text-base-content/70">{formatDate(task.created_at)}</div>
                                                </div>
                                            </div>
                                            {task.start_date && (
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-info/10 p-2 h-8 w-8 flex items-center justify-center">
                                                        <i className="far fa-calendar text-info text-xs"></i>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Scheduled Start</div>
                                                        <div className="text-base-content/70">{formatDate(task.start_date)}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {task.end_date && (
                                                <div className="flex items-center gap-3">
                                                    <div className={`rounded-full p-2 h-8 w-8 flex items-center justify-center ${isOverdue ? 'bg-error/10' : 'bg-warning/10'}`}>
                                                        <i className={`far fa-flag text-xs ${isOverdue ? 'text-error' : 'text-warning'}`}></i>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Due Date</div>
                                                        <div className={`text-base-content/70 ${isOverdue ? 'text-error' : ''}`}>
                                                            {formatDate(task.end_date)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {task.updated_at && (
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-success/10 p-2 h-8 w-8 flex items-center justify-center">
                                                        <i className="far fa-clock text-success text-xs"></i>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">Last Updated</div>
                                                        <div className="text-base-content/70">{formatDate(task.updated_at)}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Time Stats */}
                            {task && (task.start_date || task.end_date) && (
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4">Time Tracking</h3>
                                        <div className="space-y-3">
                                            {task.start_date && (
                                                <div className="stat">
                                                    <div className="stat-title">Time Since Start</div>
                                                    <div className="stat-value text-lg">
                                                        {formatDistanceToNow(new Date(task.start_date))}
                                                    </div>
                                                    <div className="stat-desc">
                                                        Started {formatDate(task.start_date)}
                                                    </div>
                                                </div>
                                            )}
                                            {task.end_date && (
                                                <div className="stat">
                                                    <div className="stat-title">
                                                        {new Date(task.end_date) < new Date() ? "Overdue By" : "Time Remaining"}
                                                    </div>
                                                    <div className={`stat-value text-lg ${new Date(task.end_date) < new Date() ? "text-error" : "text-success"}`}>
                                                        {formatDistanceToNow(new Date(task.end_date))}
                                                    </div>
                                                    <div className="stat-desc">
                                                        Due {formatDate(task.end_date)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    <div className="flex justify-end gap-3">
                        {!isCreating && !isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-secondary gap-2"
                                    disabled={isUpdating}
                                >
                                    <i className="far fa-edit"></i>
                                    Edit Task
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn btn-error gap-2"
                                    disabled={isUpdating}
                                >
                                    <i className="far fa-trash"></i>
                                    Delete Task
                                </button>
                            </>
                        )}

                        {(isCreating || isEditing) && (
                            <>
                                <button
                                    onClick={() => {
                                        if (isCreating) {
                                            onClose();
                                        } else {
                                            setIsEditing(false);
                                        }
                                    }}
                                    className="btn btn-outline"
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn btn-primary gap-2"
                                    disabled={isUpdating || !formData.name?.trim() || (!formData.project_id && isCreating)}
                                >
                                    {isUpdating ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            {isCreating ? 'Creating...' : 'Updating...'}
                                        </>
                                    ) : (
                                        <>
                                            <i className={isCreating ? "far fa-plus" : "far fa-save"}></i>
                                            {isCreating ? 'Create Task' : 'Update Task'}
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
