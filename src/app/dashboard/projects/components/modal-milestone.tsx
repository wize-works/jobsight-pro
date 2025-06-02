import React, { useState, useEffect } from "react";
import { ProjectMilestone, ProjectMilestoneInsert, ProjectMilestoneStatus, projectMilestoneStatusOptions } from "@/types/project_milestones";
import { createProjectMilestone, updateProjectMilestone } from "@/app/actions/project_milestones";
import { toast } from "@/hooks/use-toast";

interface MilestoneModalProps {
    onClose: () => void;
    projectId: string;
    milestone?: ProjectMilestone | null;
    onSave?: (milestone: ProjectMilestone) => void;
}

export default function MilestoneModal({ onClose, projectId, milestone, onSave }: MilestoneModalProps) {
    const isEditing = !!milestone?.id;

    const [name, setName] = useState(milestone?.name || "");
    const [description, setDescription] = useState(milestone?.description || "");
    const [dueDate, setDueDate] = useState(milestone?.due_date?.split("T")[0] || "");
    const [status, setStatus] = useState<ProjectMilestoneStatus>(
        (milestone?.status as ProjectMilestoneStatus) || "planned"
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form values when milestone prop changes
    useEffect(() => {
        if (milestone) {
            setName(milestone.name || "");
            setDescription(milestone.description || "");
            setDueDate(milestone.due_date?.split("T")[0] || "");
            setStatus((milestone.status as ProjectMilestoneStatus) || "planned");
        } else {
            resetForm();
        }
    }, [milestone]);

    const resetForm = () => {
        setName("");
        setDescription("");
        setDueDate("");
        setStatus("planned");
        setIsSubmitting(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            toast.error("Milestone name is required");
            return;
        }

        if (!dueDate) {
            toast.error("Due date is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const milestoneData = {
                name,
                description,
                due_date: dueDate,
                status,
                project_id: projectId,
            } as ProjectMilestoneInsert;

            if (isEditing && milestone) {
                // Update existing milestone
                milestoneData.id = milestone.id;
                const updatedMilestone = await updateProjectMilestone(milestone.id, milestoneData);

                if (updatedMilestone) {
                    toast.success("Milestone updated successfully");
                    if (onSave) onSave(updatedMilestone);
                }
            } else {
                // Create new milestone
                const newMilestone = await createProjectMilestone(milestoneData); if (newMilestone) {
                    toast.success("Milestone created successfully");
                    if (onSave) onSave(newMilestone);
                }
            }

            handleClose();
        } catch (error) {
            console.error("Error saving milestone:", error);
            toast.error("Failed to save milestone");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">
                    {isEditing ? "Edit Milestone" : "Add New Milestone"}
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Milestone Name</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter milestone name"
                            className="input input-bordered w-full"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Due Date</span>
                        </label>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Status</span>
                        </label>
                        {projectMilestoneStatusOptions.select(
                            status,
                            (value) => setStatus(value as ProjectMilestoneStatus)
                        )}
                    </div>

                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Description</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-24"
                            placeholder="Enter milestone description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>                    <div className="modal-action">
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
                                "Update Milestone"
                            ) : (
                                "Add Milestone"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={handleClose}></div>
        </div>
    );
}