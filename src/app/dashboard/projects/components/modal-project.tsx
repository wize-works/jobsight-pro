import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Project, ProjectInsert, ProjectStatus, projectStatusOptions, ProjectType, projectTypeOptions } from "@/types/projects";
import { Client } from "@/types/clients";
import { CrewMember } from "@/types/crew-members";
import { createProject } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import { getCrewMembers } from "@/app/actions/crew-members";

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Project) => void;
}

export default function ProjectModal({
    isOpen,
    onClose,
    onSave,
}: ProjectModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        client_id: "",
        manager_id: "",
        budget: "0",
        location: "",
        type: "other" as ProjectType,
        start_date: "",
        end_date: "",
        status: "pending" as ProjectStatus,
    });

    const [clients, setClients] = useState<Client[]>([]);
    const [managers, setManagers] = useState<CrewMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsData, managersData] = await Promise.all([
                    getClients(),
                    getCrewMembers()
                ]);
                setClients(clientsData);
                setManagers(managersData);
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error({
                    title: "Error",
                    description: "Failed to load data"
                });
            } finally {
                setLoadingData(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

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

        if (!formData.client_id) {
            setError("Please select a client");
            setLoading(false);
            return;
        }

        try {
            const projectData = {
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

            const newProject = await createProject(projectData);

            if (newProject) {
                toast.success({
                    title: "Success",
                    description: "Project created successfully"
                });
                onSave(newProject);
                onClose();
                // Reset form
                setFormData({
                    name: "",
                    description: "",
                    client_id: "",
                    manager_id: "",
                    budget: "0",
                    location: "",
                    type: "other" as ProjectType,
                    start_date: "",
                    end_date: "",
                    status: "pending" as ProjectStatus,
                });
            }
        } catch (error) {
            console.error("Error creating project:", error);
            const errorMessage = "Failed to create project";
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
                            Create New Project
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
                                            <span className="label-text font-medium">Client *</span>
                                        </label>
                                        {loadingData ? (
                                            <select className="select select-bordered select-secondary w-full" disabled>
                                                <option>Loading clients...</option>
                                            </select>
                                        ) : (
                                            <select
                                                name="client_id"
                                                className="select select-bordered select-secondary w-full"
                                                value={formData.client_id}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">Select a client</option>
                                                {clients.map(client => (
                                                    <option key={client.id} value={client.id}>
                                                        {client.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Project Manager</span>
                                        </label>
                                        {loadingData ? (
                                            <select className="select select-bordered select-secondary w-full" disabled>
                                                <option>Loading managers...</option>
                                            </select>
                                        ) : (
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
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Project Type</span>
                                        </label>
                                        {projectTypeOptions.select(
                                            formData.type,
                                            (value) => setFormData(prev => ({ ...prev, type: value })),
                                            "select-secondary w-full"
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Status</span>
                                        </label>
                                        {projectStatusOptions.select(
                                            formData.status,
                                            (value) => setFormData(prev => ({ ...prev, status: value })),
                                            "select-secondary w-full"
                                        )}
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
                                        <label className="input input-secondary">
                                            <i className="fas fa-dollar-sign text-secondary mr-2"></i>
                                            <input
                                                type="number"
                                                name="budget"
                                                className="grow"
                                                value={formData.budget}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                disabled={loading}
                                            />
                                        </label>
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
                            disabled={loading || !formData.name || !formData.client_id}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus"></i>
                                    Create Project
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}