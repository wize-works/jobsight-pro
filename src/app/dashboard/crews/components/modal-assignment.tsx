import React, { useState, useEffect } from "react";
import { Project } from "@/types/projects";

interface Assignment {
    id?: string;
    project_id: string;
    start_date: string;
    end_date?: string;
    notes?: string;
    project_name?: string;
}

interface ModalAssignmentProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<{ success: boolean }>;
    projects: Project[];
    initialData?: Assignment; // For edit mode
}

const ModalAssignment: React.FC<ModalAssignmentProps> = ({ title, loading, onClose, onSubmit, projects, initialData }) => {
    const [formData, setFormData] = useState({
        projectId: "",
        startDate: "",
        endDate: "",
        notes: "",
    });

    // Populate form data when editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                projectId: initialData.project_id || "",
                startDate: initialData.start_date || "",
                endDate: initialData.end_date || "",
                notes: initialData.notes || "",
            });
        }
    }, [initialData]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedProject = projects.find(project => project.id === formData.projectId);

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
            if (!formData.projectId) {
                throw new Error("Please select a project");
            }
            if (!formData.startDate) {
                throw new Error("Start date is required");
            }

            const result = await onSubmit({
                ...formData,
                id: initialData?.id, // Include ID for edit operations
            });
            if (result.success) {
                onClose();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred while creating the assignment";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setFormData({
            projectId: "",
            startDate: "",
            endDate: "",
            notes: "",
        });
        onClose();
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl p-0 rounded-lg flex flex-col" style={{ maxHeight: "90vh", height: "auto" }}>
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">{title}</h2>
                        <button
                            type="button"
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 145px)" }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Project Selection */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-screwdriver-wrench text-primary"></i>
                                    Project Assignment
                                </h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Project *</span>
                                    </label>
                                    <select
                                        name="projectId"
                                        className="select select-bordered select-secondary w-full"
                                        value={formData.projectId}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Select a project</option>
                                        {projects.map((project) => (<option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                        ))}
                                    </select>
                                    <div className="label">
                                        <span className="label-text-alt text-base-content/70">
                                            Choose the project this crew will be assigned to
                                        </span>
                                    </div>
                                </div>

                                {/* Selected Project Preview */}
                                {selectedProject && (
                                    <div className="mt-4 p-4 bg-base-200 rounded-lg">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <i className="far fa-info-circle text-primary"></i>
                                            Project Details
                                        </h4>
                                        <div>
                                            <div className="font-medium text-lg">{selectedProject.name}</div>                                            {selectedProject.description && (
                                                <div className="text-sm text-base-content/70 mt-1">
                                                    {selectedProject.description}
                                                </div>
                                            )}
                                            {selectedProject.location && (
                                                <div className="text-sm text-base-content/70 mt-2">
                                                    <i className="far fa-map-marker-alt mr-1"></i>
                                                    Location: {selectedProject.location}
                                                </div>
                                            )}
                                            <div className="text-sm text-base-content/70">
                                                <i className="far fa-calendar mr-1"></i>
                                                Status: <span className="badge badge-sm badge-primary">{selectedProject.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assignment Schedule */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-calendar-alt text-primary"></i>
                                    Assignment Schedule
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Start Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">End Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            min={formData.startDate} // Ensure end date is after start date
                                        />
                                        <div className="label">
                                            <span className="label-text-alt text-base-content/70">
                                                Leave empty for ongoing assignment
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-sticky-note text-primary"></i>
                                    Additional Information
                                </h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Assignment Notes</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        className="textarea textarea-bordered textarea-secondary w-full"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        rows={4}
                                        placeholder="Add any special instructions or notes for this assignment..."
                                    ></textarea>
                                </div>
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
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.projectId || !formData.startDate}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {initialData ? "Updating Assignment..." : "Creating Assignment..."}
                                </>
                            ) : (
                                <>
                                    <i className={`far ${initialData ? "fa-save" : "fa-plus"}`}></i>
                                    {initialData ? "Update Assignment" : "Create Assignment"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalAssignment;