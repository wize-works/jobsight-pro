import React, { useState, useEffect } from "react";
import { Task, TaskInsert, TaskStatus, TaskPriority, taskStatusOptions, taskPriorityOptions, TaskWithDetails } from "@/types/tasks";
import { createTask, updateTask } from "@/app/actions/tasks";
import { toast } from "@/hooks/use-toast";

interface TaskModalProps {
    onClose: () => void;
    projectId: string;
    task?: TaskWithDetails | null;
    onSave?: (task: Task) => void;
    crews?: { id: string; name: string }[];
}

export default function TaskModal({ onClose, projectId, task, onSave, crews = [] }: TaskModalProps) {
    const isEditing = !!task?.id;

    // Form state
    const [name, setName] = useState(task?.name || "");
    const [description, setDescription] = useState(task?.description || "");
    const [startDate, setStartDate] = useState(task?.start_date?.split("T")[0] || "");
    const [endDate, setEndDate] = useState(task?.end_date?.split("T")[0] || "");
    const [status, setStatus] = useState<TaskStatus>((task?.status as TaskStatus) || "not_started");
    const [priority, setPriority] = useState<TaskPriority>((task?.priority as TaskPriority) || "medium");
    const [progress, setProgress] = useState(task?.progress || 0);
    const [assignedTo, setAssignedTo] = useState(task?.assigned_to || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form values when task prop changes
    useEffect(() => {
        if (task) {
            setName(task.name || "");
            setDescription(task.description || "");
            setStartDate(task.start_date?.split("T")[0] || "");
            setEndDate(task.end_date?.split("T")[0] || "");
            setStatus((task.status as TaskStatus) || "not_started");
            setPriority((task.priority as TaskPriority) || "medium");
            setProgress(task.progress || 0);
            setAssignedTo(task.assigned_to || "");
        } else {
            resetForm();
        }
    }, [task]);

    const resetForm = () => {
        setName("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        setStatus("not_started");
        setPriority("medium");
        setProgress(0);
        setAssignedTo("");
        setIsSubmitting(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            toast.error("Task name is required");
            return;
        }

        if (!startDate) {
            toast.error("Start date is required");
            return;
        }

        if (!endDate) {
            toast.error("End date is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const taskData = {
                name,
                description,
                start_date: startDate,
                end_date: endDate,
                status,
                priority,
                progress,
                assigned_to: assignedTo,
                project_id: projectId,
            } as TaskInsert;

            if (isEditing && task) {
                // Update existing task
                taskData.id = task.id;
                const updatedTask = await updateTask(task.id, taskData);

                if (updatedTask) {
                    toast.success("Task updated successfully");
                    if (onSave) onSave(updatedTask);
                }
            } else {
                // Create new task
                const newTask = await createTask(taskData);

                if (newTask) {
                    toast.success("Task created successfully");
                    if (onSave) onSave(newTask);
                }
            }

            handleClose();
        } catch (error) {
            console.error("Error saving task:", error);
            toast.error("Failed to save task");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-3xl">
                <h3 className="font-bold text-lg mb-4">
                    {isEditing ? "Edit Task" : "Add New Task"}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="form-control md:col-span-2">
                            <label className="label">
                                <span className="label-text">Task Name</span>
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

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Start Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">End Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Status</span>
                            </label>
                            {taskStatusOptions.select(
                                status,
                                (value) => setStatus(value as TaskStatus)
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Priority</span>
                            </label>
                            {taskPriorityOptions.select(
                                priority,
                                (value) => setPriority(value as TaskPriority)
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Assigned To</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                            >
                                <option value="">Not Assigned</option>
                                {crews.map((crew) => (
                                    <option key={crew.id} value={crew.id}>
                                        {crew.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Progress (%)</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="input input-bordered w-full"
                                value={progress}
                                onChange={(e) => setProgress(Number(e.target.value))}
                            />
                        </div>

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
                            type="button"
                            className="btn btn-ghost"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
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
                            ) : isEditing ? (
                                "Update Task"
                            ) : (
                                "Add Task"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={handleClose}></div>
        </div>
    );
}