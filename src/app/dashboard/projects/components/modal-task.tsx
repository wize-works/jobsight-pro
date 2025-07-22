"use client";
import React, { useState, useEffect } from "react";
import { Task, TaskInsert, TaskUpdate, TaskStatus, TaskPriority, taskStatusOptions, taskPriorityOptions, TaskWithDetails } from "@/types/tasks";
import { createTask, updateTask } from "@/app/actions/tasks";
import { toast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";
import { formatDateForInput } from "@/utils/date";
import { getProjectMilestonesByProjectId } from "@/app/actions/project-milestones";
import { ProjectMilestone } from "@/types/project_milestones";

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    task?: TaskWithDetails | null;
    onSave?: (task: Task) => void;
    crews?: { id: string; name: string }[];
}

export default function TaskModal({ isOpen, onClose, projectId, task, onSave, crews = [] }: TaskModalProps) {
    const isEditing = !!task?.id;
    const { businessId } = useBusiness();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        status: "not_started" as TaskStatus,
        priority: "medium" as TaskPriority,
        progress: 0,
        assigned_to: "",
        milestone_id: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
    const [loadingMilestones, setLoadingMilestones] = useState(false);

    // Load milestones for the project
    useEffect(() => {
        if (projectId) {
            loadMilestones(projectId);
        }
    }, [projectId]);

    // Function to load milestones for a project
    const loadMilestones = async (projectId: string) => {
        if (!projectId) {
            setMilestones([]);
            return;
        }

        try {
            setLoadingMilestones(true);
            const projectMilestones = await getProjectMilestonesByProjectId(businessId, projectId);
            setMilestones(projectMilestones || []);
        } catch (error) {
            console.error("Error loading milestones:", error);
        } finally {
            setLoadingMilestones(false);
        }
    };

    // Reset form values when task prop changes
    useEffect(() => {
        if (task) {
            setFormData({
                name: task.name || "",
                description: task.description || "",
                start_date: formatDateForInput(task.start_date),
                end_date: formatDateForInput(task.end_date),
                status: (task.status as TaskStatus) || "not_started",
                priority: (task.priority as TaskPriority) || "medium",
                progress: task.progress || 0,
                assigned_to: task.assigned_to || "",
                milestone_id: task.milestone_id || "",
            });
        } else {
            setFormData({
                name: "",
                description: "",
                start_date: "",
                end_date: "",
                status: "not_started" as TaskStatus,
                priority: "medium" as TaskPriority,
                progress: 0,
                assigned_to: "",
                milestone_id: "",
            });
        }
    }, [task]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: Number(value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.name) {
            setError("Task name is required");
            setLoading(false);
            return;
        }

        if (!formData.start_date) {
            setError("Start date is required");
            setLoading(false);
            return;
        }

        if (!formData.end_date) {
            setError("End date is required");
            setLoading(false);
            return;
        }

        try {
            const taskData = {
                ...formData,
                project_id: projectId,
                assigned_to: formData.assigned_to || null,
                milestone_id: formData.milestone_id || null,
            };

            if (isEditing && task) {
                // Update existing task - use TaskUpdate type
                const updatedTask = await updateTask(businessId, task.id, taskData as TaskUpdate);

                if (updatedTask) {
                    toast.success({
                        title: "Success",
                        description: "Task updated successfully"
                    });
                    if (onSave) onSave(updatedTask);
                }
            } else {
                // Create new task - use TaskInsert type
                const newTask = await createTask(businessId, taskData as TaskInsert);

                if (newTask) {
                    toast.success({
                        title: "Success",
                        description: "Task created successfully"
                    });
                    if (onSave) onSave(newTask);
                }
            }

            onClose();
        } catch (error) {
            console.error("Error saving task:", error);
            const errorMessage = isEditing ? "Failed to update task" : "Failed to create task";
            setError(errorMessage);
            toast.error({
                title: "Error",
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl p-0 rounded-lg flex flex-col" style={{ maxHeight: "90vh", height: "auto" }}>
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            {isEditing ? 'Edit Task' : 'Add New Task'}
                        </h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 145px)" }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Task Details */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-tasks text-primary"></i>
                                    Task Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Task Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter task name"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Description</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            className="textarea textarea-bordered textarea-secondary w-full"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Describe the task..."
                                            rows={4}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule & Assignment */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-calendar-alt text-primary"></i>
                                    Schedule & Assignment
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Start Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.start_date}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">End Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.end_date}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Assigned To</span>
                                        </label>
                                        <select
                                            name="assigned_to"
                                            className="select select-bordered select-secondary w-full"
                                            value={formData.assigned_to}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            <option value="">Not Assigned</option>
                                            {crews.map((crew) => (
                                                <option key={crew.id} value={crew.id}>
                                                    {crew.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Milestone Selection */}
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Milestone</span>
                                        </label>
                                        <select
                                            name="milestone_id"
                                            className="select select-bordered select-secondary w-full"
                                            value={formData.milestone_id}
                                            onChange={handleInputChange}
                                            disabled={loading || loadingMilestones}
                                        >
                                            <option value="">None (No milestone)</option>
                                            {loadingMilestones ? (
                                                <option disabled>Loading milestones...</option>
                                            ) : milestones.length === 0 ? (
                                                <option disabled>No milestones for this project</option>
                                            ) : (
                                                milestones.map((milestone) => (
                                                    <option key={milestone.id} value={milestone.id}>
                                                        {milestone.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status & Progress */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-chart-line text-primary"></i>
                                    Status & Progress
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Status</span>
                                        </label>
                                        {taskStatusOptions.select(
                                            formData.status,
                                            () => handleInputChange,
                                            "select-secondary w-full"
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Priority</span>
                                        </label>
                                        {taskPriorityOptions.select(
                                            formData.priority,
                                            () => handleInputChange,
                                            "select-secondary w-full"
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Progress (%)</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="progress"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.progress}
                                            onChange={handleNumberChange}
                                            placeholder="0"
                                            min="0"
                                            max="100"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                {formData.progress > 0 && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Progress</span>
                                            <span>{formData.progress}%</span>
                                        </div>
                                        <progress
                                            className="progress progress-primary w-full"
                                            value={formData.progress}
                                            max="100"
                                        ></progress>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300 flex-shrink-0">
                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="far fa-exclamation-triangle"></i>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={loading || !formData.name || !formData.start_date || !formData.end_date}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {isEditing ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <i className={isEditing ? "far fa-save" : "far fa-plus"}></i>
                                    {isEditing ? 'Update Task' : 'Create Task'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}