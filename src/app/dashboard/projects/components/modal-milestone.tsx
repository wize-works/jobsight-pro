import React, { useState, useEffect } from "react";
import { ProjectMilestone, ProjectMilestoneInsert, ProjectMilestoneStatus, projectMilestoneStatusOptions } from "@/types/project_milestones";
import { createProjectMilestone, updateProjectMilestone } from "@/app/actions/project_milestones";
import { toast } from "@/hooks/use-toast";

interface MilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    milestone?: ProjectMilestone | null;
    onSave?: (milestone: ProjectMilestone) => void;
}

export default function MilestoneModal({ isOpen, onClose, projectId, milestone, onSave }: MilestoneModalProps) {
    const isEditing = !!milestone?.id;

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        due_date: "",
        status: "planned" as ProjectMilestoneStatus,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Reset form values when milestone prop changes
    useEffect(() => {
        if (milestone) {
            setFormData({
                name: milestone.name || "",
                description: milestone.description || "",
                due_date: milestone.due_date?.split("T")[0] || "",
                status: (milestone.status as ProjectMilestoneStatus) || "planned",
            });
        } else {
            setFormData({
                name: "",
                description: "",
                due_date: "",
                status: "planned" as ProjectMilestoneStatus,
            });
        }
    }, [milestone]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.name) {
            setError("Milestone name is required");
            setLoading(false);
            return;
        }

        if (!formData.due_date) {
            setError("Due date is required");
            setLoading(false);
            return;
        }

        try {
            const milestoneData = {
                name: formData.name,
                description: formData.description,
                due_date: formData.due_date,
                status: formData.status,
                project_id: projectId,
            } as ProjectMilestoneInsert;

            if (isEditing && milestone) {
                // Update existing milestone
                milestoneData.id = milestone.id;
                const updatedMilestone = await updateProjectMilestone(milestone.id, milestoneData);

                if (updatedMilestone) {
                    toast.success({
                        title: "Success",
                        description: "Milestone updated successfully"
                    });
                    if (onSave) onSave(updatedMilestone);
                }
            } else {
                // Create new milestone
                const newMilestone = await createProjectMilestone(milestoneData);
                if (newMilestone) {
                    toast.success({
                        title: "Success",
                        description: "Milestone created successfully"
                    });
                    if (onSave) onSave(newMilestone);
                }
            }

            onClose();
        } catch (error) {
            console.error("Error saving milestone:", error);
            const errorMessage = isEditing ? "Failed to update milestone" : "Failed to create milestone";
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
                            {isEditing ? 'Edit Milestone' : 'Add New Milestone'}
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
                        {/* Milestone Details */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-flag-checkered text-primary"></i>
                                    Milestone Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Milestone Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter milestone name"
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
                                            placeholder="Describe this milestone..."
                                            rows={4}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule & Status */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-calendar-alt text-primary"></i>
                                    Schedule & Status
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Due Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="due_date"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.due_date}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Status</span>
                                        </label>
                                        <select
                                            name="status"
                                            className="select select-bordered select-secondary w-full"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            {Object.entries(projectMilestoneStatusOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
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
                            disabled={loading || !formData.name || !formData.due_date}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {isEditing ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <i className={isEditing ? "fas fa-save" : "fas fa-plus"}></i>
                                    {isEditing ? 'Update Milestone' : 'Create Milestone'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}