import React, { useState, useEffect } from "react";
import { Project, ProjectStatus, projectStatusOptions } from "@/types/projects";

interface ProjectData {
    id?: string;
    name: string;
    type: string;
    status: ProjectStatus;
    start_date: string;
    end_date: string;
    budget: string;
    location: string;
    description: string;
}

interface ModalProjectProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: ProjectData) => Promise<{ success: boolean }>;
    initialData?: ProjectData; // For edit mode
    clientName?: string;
}

const ModalProject: React.FC<ModalProjectProps> = ({
    title,
    loading,
    onClose,
    onSubmit,
    initialData,
    clientName
}) => {
    const [formData, setFormData] = useState<ProjectData>({
        name: "",
        type: "",
        status: "in_progress" as ProjectStatus,
        start_date: "",
        end_date: "",
        budget: "",
        location: "",
        description: "",
    });

    // Populate form data when editing
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null); // Clear error when user makes changes
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validate required fields
            if (!formData.name.trim()) {
                throw new Error("Project name is required");
            }
            if (!formData.status) {
                throw new Error("Project status is required");
            }

            // Validate dates
            if (formData.start_date && formData.end_date) {
                const startDate = new Date(formData.start_date);
                const endDate = new Date(formData.end_date);
                if (endDate < startDate) {
                    throw new Error("End date must be after start date");
                }
            }

            const result = await onSubmit({
                ...formData,
                id: initialData?.id, // Include ID for edit operations
            });

            if (result.success) {
                onClose();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred while saving the project";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setFormData({
            name: "",
            type: "",
            status: "in_progress",
            start_date: "",
            end_date: "",
            budget: "",
            location: "",
            description: "",
        });
        onClose();
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] p-0 rounded-lg">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">{title}</h2>
                        <button
                            type="button"
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    {clientName && (
                        <p className="text-primary-content/80 mt-2">
                            <i className="fas fa-building mr-2"></i>
                            Client: {clientName}
                        </p>
                    )}
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-info-circle text-primary"></i>
                                    Project Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Project Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                            placeholder="Enter project name"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Project Type</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="type"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.type}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            placeholder="e.g., Commercial Construction, Renovation"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Status *</span>
                                        </label>
                                        <select
                                            name="status"
                                            className="select select-bordered select-secondary w-full"
                                            value={formData.status}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                        >
                                            <option value="in_progress">In Progress</option>
                                            <option value="planning">Planning</option>
                                            <option value="on_hold">On Hold</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Location</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.location}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            placeholder="Project address or location"
                                        />
                                    </div>
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text font-medium">Description</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        className="textarea textarea-bordered textarea-secondary w-full"
                                        value={formData.description}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        rows={3}
                                        placeholder="Brief description of the project scope and objectives..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Timeline & Budget */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-calendar-alt text-primary"></i>
                                    Timeline & Budget
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Start Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.start_date}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">End Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.end_date}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            min={formData.start_date} // Ensure end date is after start date
                                        />
                                        <div className="label">
                                            <span className="label-text-alt text-base-content/70">
                                                Expected completion date
                                            </span>
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Budget (USD)</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="budget"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                        <div className="label">
                                            <span className="label-text-alt text-base-content/70">
                                                Total project budget
                                            </span>
                                        </div>
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
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.name.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {initialData ? "Updating Project..." : "Creating Project..."}
                                </>
                            ) : (
                                <>
                                    <i className={`fas ${initialData ? "fa-save" : "fa-plus"}`}></i>
                                    {initialData ? "Update Project" : "Create Project"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalProject;
