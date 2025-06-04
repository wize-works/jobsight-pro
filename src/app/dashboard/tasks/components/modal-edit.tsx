
"use client";

import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Task, TaskStatus, TaskPriority } from "@/types/tasks";
import { updateTask } from "@/app/actions/tasks";

interface TaskEditModalProps {
    onClose: () => void;
    task: Task;
    onSave?: (task: Task) => void;
    projects?: { id: string; name: string }[];
    crews?: { id: string; name: string }[];
}

export default function TaskEditModal({
    onClose,
    task,
    onSave,
    projects = [],
    crews = []
}: TaskEditModalProps) {
    const [name, setName] = useState(task.name || "");
    const [description, setDescription] = useState(task.description || "");
    const [status, setStatus] = useState<TaskStatus>((task.status as TaskStatus) || "not_started");
    const [priority, setPriority] = useState<TaskPriority>((task.priority as TaskPriority) || "medium");
    const [progress, setProgress] = useState(task.progress || 0);
    const [startDate, setStartDate] = useState(task.start_date ? task.start_date.split("T")[0] : "");
    const [endDate, setEndDate] = useState(task.end_date ? task.end_date.split("T")[0] : "");
    const [assignedTo, setAssignedTo] = useState(task.assigned_to || "");
    const [projectId, setProjectId] = useState(task.project_id || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Reset form when task changes
        setName(task.name || "");
        setDescription(task.description || "");
        setStatus((task.status as TaskStatus) || "not_started");
        setPriority((task.priority as TaskPriority) || "medium");
        setProgress(task.progress || 0);
        setStartDate(task.start_date ? task.start_date.split("T")[0] : "");
        setEndDate(task.end_date ? task.end_date.split("T")[0] : "");
        setAssignedTo(task.assigned_to || "");
        setProjectId(task.project_id || "");
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Task name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const taskData = {
                name: name.trim(),
                description: description.trim(),
                status,
                priority,
                progress,
                start_date: startDate || null,
                end_date: endDate || null,
                assigned_to: assignedTo || null,
                project_id: projectId || task.project_id,
            };

            const updatedTask = await updateTask(task.id, taskData);

            if (updatedTask) {
                toast.success("Task updated successfully");
                if (onSave) onSave(updatedTask);
                onClose();
            }
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-3xl">
                <h3 className="font-bold text-lg mb-4">Edit Task</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Task Name */}
                        <div className="form-control md:col-span-2">
                            <label className="label">
                                <span className="label-text">Task Name*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter task name"
                                className="input input-bordered w-full"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Project */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Project</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                            >
                                <option value="">Select Project</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assigned To */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Assigned To</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                            >
                                <option value="">Select Crew Member</option>
                                {crews.map((crew) => (
                                    <option key={crew.id} value={crew.id}>
                                        {crew.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Status</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                            >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Priority</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        {/* Progress */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Progress ({progress}%)</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                className="range range-primary"
                                onChange={(e) => setProgress(parseInt(e.target.value))}
                            />
                            <div className="w-full flex justify-between text-xs px-2">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Start Date */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Start Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        {/* End Date */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">End Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        {/* Description */}
                        <div className="form-control md:col-span-2">
                            <label className="label">
                                <span className="label-text">Description</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered h-24"
                                placeholder="Enter task description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-action">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-xs mr-2"></span>
                                    Saving...
                                </>
                            ) : (
                                "Update Task"
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
