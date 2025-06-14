import React, { useState, useEffect } from "react";
import { Task, TaskInsert, TaskStatus, TaskPriority, taskStatusOptions, taskPriorityOptions, TaskWithDetails } from "@/types/tasks";
import { createTask, updateTask } from "@/app/actions/tasks";
import { toast } from "@/hooks/use-toast";
import { Project } from "@/types/projects";
import { Crew } from "@/types/crews";
import { getProjects } from "@/app/actions/projects";
import { getCrews } from "@/app/actions/crews";

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task?: TaskWithDetails | null;
    onSave?: (task: Task) => void;
}

export default function TaskModal({ isOpen, onClose, task, onSave }: TaskModalProps) {
    const isEditing = !!task?.id;

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        project_id: "",
        start_date: "",
        end_date: "",
        status: "not_started" as TaskStatus,
        priority: "medium" as TaskPriority,
        progress: 0,
        assigned_to: "",
    });

    const [projects, setProjects] = useState<Project[]>([]);
    const [crews, setCrews] = useState<Crew[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch projects and crews when the modal is opened
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [fetchedProjects, fetchedCrews] = await Promise.all([getProjects(), getCrews()]);
                    setProjects(fetchedProjects);
                    setCrews(fetchedCrews);
                } catch (err) {
                    console.error("Error fetching projects or crews:", err);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    // Reset form values when task prop changes
    useEffect(() => {
        if (task) {
            setFormData({
                name: task.name || "",
                description: task.description || "",
                project_id: task.project_id || "",
                start_date: task.start_date?.split("T")[0] || "",
                end_date: task.end_date?.split("T")[0] || "",
                status: (task.status as TaskStatus) || "not_started",
                priority: (task.priority as TaskPriority) || "medium",
                progress: task.progress || 0,
                assigned_to: task.assigned_to || "",
            });
        } else {
            setFormData({
                name: "",
                description: "",
                project_id: "",
                start_date: "",
                end_date: "",
                status: "not_started" as TaskStatus,
                priority: "medium" as TaskPriority,
                progress: 0,
                assigned_to: "",
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

        if (!formData.project_id) {
            setError("Please select a project");
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
                assigned_to: formData.assigned_to || null,
            } as TaskInsert;

            if (isEditing && task) {
                // Update existing task
                taskData.id = task.id;
                const updatedTask = await updateTask(task.id, taskData);

                if (updatedTask) {
                    toast.success({
                        title: "Success",
                        description: "Task updated successfully"
                    });
                    if (onSave) onSave(updatedTask);
                }
            } else {
                // Create new task
                const newTask = await createTask(taskData);

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
            <div className="modal-box max-w-4xl max-h-[90vh] p-0 rounded-lg">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            {isEditing ? 'Edit Task' : 'Add New Task'}
                        </h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Task Details */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-tasks text-primary"></i>
                                    Task Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Task Name</span>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Project</span>
                                            </label>
                                            <select
                                                name="project_id"
                                                className="select select-bordered select-secondary w-full"
                                                value={formData.project_id}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">Select a project</option>
                                                {projects.map(project => (
                                                    <option key={project.id} value={project.id}>{project.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Assigned To</span>
                                            </label>
                                            <select
                                                name="assigned_to"
                                                className="select select-bordered select-secondary w-full"
                                                value={formData.assigned_to}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            >
                                                <option value="">Unassigned</option>
                                                {crews.map(crew => (
                                                    <option key={crew.id} value={crew.id}>{crew.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Description</span>
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

                        {/* Schedule & Priority */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-calendar-alt text-primary"></i>
                                    Schedule & Priority
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Start Date</span>
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
                                            <span className="label-text">End Date</span>
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
                                            <span className="label-text">Priority</span>
                                        </label>
                                        {taskPriorityOptions.select(
                                            formData.priority,
                                            (value: TaskPriority) => setFormData(prev => ({ ...prev, priority: value })),
                                            "select-secondary w-full"
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status & Progress */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-chart-line text-primary"></i>
                                    Status & Progress
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Status</span>
                                        </label>
                                        {taskStatusOptions.select(
                                            formData.status,
                                            (value: TaskStatus) => setFormData(prev => ({ ...prev, status: value })),
                                            "select-secondary w-full"
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Progress</span>
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
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>0%</span>
                                        <span>100%</span>
                                    </div>
                                    <input type="range" name="progress" min={0} max={100} value={formData.progress} className="range range-primary w-full" onChange={(e) => handleNumberChange(e)} />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="fas fa-exclamation-triangle"></i>
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
                            disabled={loading || !formData.name || !formData.project_id || !formData.start_date || !formData.end_date}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {isEditing ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <i className={isEditing ? "fas fa-save" : "fas fa-plus"}></i>
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