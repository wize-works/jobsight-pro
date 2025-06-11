import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Project, ProjectInsert, ProjectStatus, projectStatusOptions, ProjectType, projectTypeOptions } from "@/types/projects";
import { User } from "@/types/users";
import { updateProject } from "@/app/actions/projects";
import { formatDate } from "@/utils/formatters";
import { getCrewMembers } from "@/app/actions/crew-members";
import { CrewMember } from "@/types/crew-members";

interface ProjectEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onSave?: (project: Project) => void;
}

export default function ProjectEditModal({
    isOpen,
    onClose,
    project,
    onSave
}: ProjectEditModalProps) {
    const [formData, setFormData] = useState({
        name: project.name || "",
        description: project.description || "",
        client_id: project.client_id || "",
        manager_id: project.manager_id || "",
        budget: project.budget?.toString() || "0",
        location: project.location || "",
        type: (project.type || "other") as ProjectType,
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        status: project.status as ProjectStatus || "pending"
    });

    const [loading, setLoading] = useState(false);
    const [managers, setManagers] = useState<CrewMember[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        // Reset form when project changes
        setFormData({
            name: project.name || "",
            description: project.description || "",
            client_id: project.client_id || "",
            manager_id: project.manager_id || "",
            budget: project.budget?.toString() || "0",
            location: project.location || "",
            type: (project.type || "other") as ProjectType,
            start_date: project.start_date || "",
            end_date: project.end_date || "",
            status: project.status as ProjectStatus || "pending"
        });

        const fetchManagers = async () => {
            try {
                const crewMembers = await getCrewMembers();
                setManagers(crewMembers);
            } catch (error) {
                console.error("Error fetching managers:", error);
                toast.error({
                    title: "Error",
                    description: "Failed to load managers"
                });
            }
        };
        fetchManagers();
    }, [project]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(prev => ({
                        ...prev,
                        location: `${latitude}, ${longitude}`
                    }));
                    toast.success({
                        title: "Location Updated",
                        description: "Current location has been set"
                    });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    toast.error({
                        title: "Location Error",
                        description: "Unable to get current location"
                    });
                }
            );
        } else {
            toast.error({
                title: "Location Error",
                description: "Geolocation is not supported by this browser"
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.name) {
            setError("Project name is required");
            setLoading(false);
            return;
        }

        try {
            const projectData = {
                id: project.id,
                name: formData.name,
                description: formData.description,
                client_id: formData.client_id,
                manager_id: formData.manager_id || null,
                budget: formData.budget ? parseFloat(formData.budget) : 0,
                location: formData.location,
                type: formData.type,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                status: formData.status,
            } as ProjectInsert;

            const updatedProject = await updateProject(project.id, projectData);

            if (updatedProject) {
                toast.success({
                    title: "Success",
                    description: "Project updated successfully"
                });
                if (onSave) onSave(updatedProject);
                onClose();
            }
        } catch (error) {
            console.error("Error updating project:", error);
            const errorMessage = "Failed to update project";
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
                            Edit Project
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
                        {/* Basic Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-info-circle text-primary"></i>
                                    Basic Information
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
                                            onChange={handleInputChange}
                                            placeholder="Enter project name"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Project Manager</span>
                                        </label>
                                        <select
                                            name="manager_id"
                                            className="select select-bordered select-secondary w-full"
                                            value={formData.manager_id}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            <option value="">Select Manager</option>
                                            {managers.map((manager) => (
                                                <option key={manager.id} value={manager.id}>
                                                    {manager.name} ({manager.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Project Type</span>
                                        </label>
                                        <select
                                            name="type"
                                            className="select select-bordered select-secondary w-full"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            {Object.entries(projectTypeOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
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
                                            {Object.entries(projectStatusOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
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
                                        onChange={handleInputChange}
                                        placeholder="Enter project description"
                                        rows={4}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Financial Details */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-dollar-sign text-primary"></i>
                                    Financial Details
                                </h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Budget</span>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-base-200">$</span>
                                        <input
                                            type="number"
                                            name="budget"
                                            className="input input-bordered input-secondary flex-1 "
                                            value={formData.budget}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule & Location */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-calendar-alt text-primary"></i>
                                    Schedule & Location
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Start Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.start_date}
                                            onChange={handleInputChange}
                                            disabled={loading}
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
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text font-medium">Location</span>
                                    </label>
                                    <div className="join w-full">
                                        <input
                                            type="text"
                                            name="location"
                                            className="input input-bordered input-secondary join-item flex-1"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="Enter project location"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary join-item"
                                            onClick={getCurrentLocation}
                                            disabled={loading}
                                            title="Use current location"
                                        >
                                            <i className="fas fa-map-marker-alt"></i>
                                        </button>
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
                            disabled={loading || !formData.name}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Update Project
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}