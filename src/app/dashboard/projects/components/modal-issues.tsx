import { getCrewMembers } from "@/app/actions/crew-members";
import { createProjectIssue, updateProjectIssue } from "@/app/actions/projects-issues";
import { toast } from "@/hooks/use-toast";
import { CrewMember } from "@/types/crew-members";
import { ProjectIssue, ProjectIssuePriority, projectIssuePriorityOptions, ProjectIssueStatus, projectIssueStatusOptions } from "@/types/projects-issues";
import { useEffect, useState } from "react";

interface IssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialIssue?: Partial<ProjectIssue>;
    projectId: string;
}

const IssueModal = ({ isOpen, onClose, initialIssue, projectId }: IssueModalProps) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        reported_by: "",
        reported_date: new Date().toISOString().split('T')[0],
        priority: "low" as ProjectIssuePriority,
        status: "open" as ProjectIssueStatus,
        assigned_to: "",
        resolution: "",
    });

    const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCrewMembers = async () => {
            try {
                const members = await getCrewMembers();
                setCrewMembers(members);
            } catch (error) {
                console.error("Error fetching crew members:", error);
                toast.error({
                    title: "Error",
                    description: "Failed to load crew members"
                });
            } finally {
                setLoadingData(false);
            }
        };
        fetchCrewMembers();
    }, []);

    useEffect(() => {
        if (initialIssue) {
            setFormData({
                title: initialIssue.title || "",
                description: initialIssue.description || "",
                reported_by: initialIssue.reported_by || "",
                reported_date: initialIssue.reported_date ? new Date(initialIssue.reported_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                priority: (initialIssue.priority || "low") as ProjectIssuePriority,
                status: (initialIssue.status || "open") as ProjectIssueStatus,
                assigned_to: initialIssue.assigned_to || "",
                resolution: initialIssue.resolution || "",
            });
        } else {
            setFormData({
                title: "",
                description: "",
                reported_by: "",
                reported_date: new Date().toISOString().split('T')[0],
                priority: "low" as ProjectIssuePriority,
                status: "open" as ProjectIssueStatus,
                assigned_to: "",
                resolution: "",
            });
        }
    }, [initialIssue]);

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

        if (!formData.title) {
            setError("Issue title is required");
            setLoading(false);
            return;
        }

        try {
            const issueData = {
                ...formData,
                project_id: projectId,
                reported_date: formData.reported_date || new Date().toISOString(),
            } as ProjectIssue;

            if (initialIssue?.id) {
                await updateProjectIssue(initialIssue.id, issueData);
                toast.success({
                    title: "Success",
                    description: "Issue updated successfully"
                });
            } else {
                await createProjectIssue(issueData);
                toast.success({
                    title: "Success",
                    description: "Issue created successfully"
                });
            }

            onClose();
        } catch (error) {
            console.error("Error saving issue:", error);
            const errorMessage = initialIssue?.id ? "Failed to update issue" : "Failed to create issue";
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
                            {initialIssue?.id ? 'Edit Issue' : 'Create New Issue'}
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
                        {/* Issue Details */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-exclamation-triangle text-primary"></i>
                                    Issue Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Issue Title *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            className="input input-bordered input-secondary w-full"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Enter issue title"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Description *</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            className="textarea textarea-bordered textarea-secondary w-full"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Describe the issue in detail"
                                            rows={4}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Reported By</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="reported_by"
                                                className="input input-bordered input-secondary w-full"
                                                value={formData.reported_by}
                                                onChange={handleInputChange}
                                                placeholder="Who reported this issue?"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Reported Date</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="reported_date"
                                                className="input input-bordered input-secondary w-full"
                                                value={formData.reported_date}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Priority & Status */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-flag text-primary"></i>
                                    Priority & Status
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Priority</span>
                                        </label>
                                        <select
                                            name="priority"
                                            className="select select-bordered select-secondary w-full"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            {Object.entries(projectIssuePriorityOptions).map(([key, { label }]) => (
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
                                            {Object.entries(projectIssueStatusOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Assignment & Resolution */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-user-check text-primary"></i>
                                    Assignment & Resolution
                                </h3>
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Assigned To</span>
                                        </label>
                                        {loadingData ? (
                                            <select className="select select-bordered select-secondary w-full" disabled>
                                                <option>Loading crew members...</option>
                                            </select>
                                        ) : (
                                            <select
                                                name="assigned_to"
                                                className="select select-bordered select-secondary w-full"
                                                value={formData.assigned_to}
                                                onChange={handleInputChange}
                                                disabled={loading}
                                            >
                                                <option value="">Select a crew member</option>
                                                {crewMembers.map(member => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.name} ({member.role})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Resolution</span>
                                        </label>
                                        <textarea
                                            name="resolution"
                                            className="textarea textarea-bordered textarea-secondary w-full"
                                            value={formData.resolution}
                                            onChange={handleInputChange}
                                            placeholder="Describe the resolution or action taken"
                                            rows={4}
                                            disabled={loading}
                                        />
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
                            disabled={loading || !formData.title || !formData.description}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {initialIssue?.id ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <i className={initialIssue?.id ? "fas fa-save" : "fas fa-plus"}></i>
                                    {initialIssue?.id ? 'Update Issue' : 'Create Issue'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueModal;