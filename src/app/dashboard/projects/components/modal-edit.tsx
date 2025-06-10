import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Project, ProjectInsert, ProjectStatus, projectStatusOptions, ProjectType, projectTypeOptions } from "@/types/projects";
import { User } from "@/types/users";
import { updateProject } from "@/app/actions/projects";
import { formatDate } from "@/utils/formatters";
import { getCrewMembers } from "@/app/actions/crew-members";
import { CrewMember } from "@/types/crew-members";

interface ProjectEditModalProps {
    onClose: () => void;
    project: Project;
    onSave?: (project: Project) => void;
}

export default function ProjectEditModal({
    onClose,
    project,
    onSave
}: ProjectEditModalProps) {
    const [name, setName] = useState(project.name || "");
    const [description, setDescription] = useState(project.description || "");
    const [clientId, setClientId] = useState(project.client_id || "");
    const [managerId, setManagerId] = useState(project.manager_id || "");
    const [budget, setBudget] = useState(project.budget?.toString() || "0");
    const [location, setLocation] = useState(project.location || "");
    const [type, setType] = useState<ProjectType>((project.type || "other") as ProjectType);
    const [startDate, setStartDate] = useState(project.start_date ? formatDate(project.start_date) : "");
    const [endDate, setEndDate] = useState(project.end_date ? formatDate(project.end_date) : "");
    const [status, setStatus] = useState<ProjectStatus>(project.status as ProjectStatus || "pending");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [managers, setManagers] = useState<CrewMember[]>([]);

    useEffect(() => {
        // Reset form when project changes
        setName(project.name || "");
        setDescription(project.description || "");
        setClientId(project.client_id || "");
        setManagerId(project.manager_id || "");
        setBudget(project.budget?.toString() || "0");
        setLocation(project.location || "");
        setType((project.type || "other") as ProjectType);
        setStartDate(project.start_date ? project.start_date : "");
        setEndDate(project.end_date ? project.end_date : "");
        setStatus(project.status as ProjectStatus || "pending");

        const fetchManagers = async () => {
            try {
                const crewMembers = await getCrewMembers();
                setManagers(crewMembers);
            } catch (error) {
                console.error("Error fetching managers:", error);
                toast.error("Failed to load managers");
            }
        };
        fetchManagers();
    }, [project]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            toast.error("Project name is required");
            return;
        }

        setIsSubmitting(true);

        try {
            const projectData = {
                id: project.id,
                name,
                description,
                client_id: clientId,
                manager_id: managerId || null,
                budget: budget ? parseFloat(budget) : 0,
                location,
                type,
                start_date: startDate || null,
                end_date: endDate || null,
                status,
            } as ProjectInsert;

            const updatedProject = await updateProject(project.id, projectData);

            if (updatedProject) {
                toast.success("Project updated successfully");
                if (onSave) onSave(updatedProject);
                onClose();
            }
        } catch (error) {
            console.error("Error updating project:", error);
            toast.error("Failed to update project");
        } finally {
            setIsSubmitting(false);
        }
    };
    console.log("ProjectEditModal", project.start_date);
    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl">
                <h3 className="font-bold text-lg mb-4">Edit Project</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Project Name*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter project name"
                                className="input input-bordered w-full"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Project Manager</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={managerId}
                                onChange={(e) => setManagerId(e.target.value)}
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
                                <span className="label-text">Budget</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Enter project budget"
                                className="input input-bordered w-full"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label mb-2">Location</label>
                            <div className="join w-full">
                                <input
                                    className="input input-bordered w-full join-item mt-0"
                                    name="location"
                                    value={location || ""}
                                    onChange={(e) => e}
                                />
                                <button className="btn btn-secondary join-item" type="button" onClick={() => navigator.geolocation.getCurrentPosition((position) => {
                                    const { latitude, longitude } = position.coords;
                                    setLocation(`${latitude}, ${longitude}`);
                                })}>
                                    <i className="fas fa-map-marker-alt"></i>
                                </button>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Project Type</span>
                            </label>
                            {projectTypeOptions.select(
                                type,
                                (value) => setType(value as ProjectType),
                            )}
                        </div>
                        <div className="flex gap-6">
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
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Status</span>
                            </label>
                            {projectStatusOptions.select(
                                status,
                                (value) => setStatus(value as ProjectStatus)
                            )}
                        </div>
                    </div>

                    <div className="form-control mt-4">
                        <label className="label">
                            <span className="label-text">Description</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-24"
                            placeholder="Enter project description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
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
                                "Update Project"
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