import React, { use, useEffect, useState } from "react";
import { Crew } from "@/types/crews";
import { CrewMember } from "@/types/crew-members";
import { getCrewMembers } from "@/app/actions/crew-members"
import { useBusiness } from "@/lib/business-context";

interface ModalEditProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<{ success: boolean }>;
    initialCrew?: Crew;
    initialMembers?: CrewMember[];
}

const ModalEdit: React.FC<ModalEditProps> = ({ title, onClose, onSubmit, initialCrew, initialMembers }) => {
    const { businessId } = useBusiness();
    const [formData, setFormData] = useState({
        name: initialCrew?.name || "",
        status: initialCrew?.status || "active",
        leader_id: initialCrew?.leader_id || "",
        specialty: initialCrew?.specialty || "",
        notes: initialCrew?.notes || "",
    });

    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<CrewMember[]>(initialMembers || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const loadData = async () => {
            try {
                const fetchedMembers = await getCrewMembers(businessId);
                setMembers(fetchedMembers || []);
            } catch (err) {
                console.error("Error fetching crew members:", err);
                setError("Failed to load crew members");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [loading]);

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
                throw new Error("Crew name is required");
            }

            const result = await onSubmit(formData);
            if (result.success) {
                onClose();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred while updating the crew";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl max-h-[90vh] p-0 rounded-lg">
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
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-info-circle text-primary"></i>
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="input input-bordered input-secondary"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Status *</span>
                                        </label>
                                        <select
                                            name="status"
                                            className="select select-bordered select-secondary"
                                            value={formData.status}
                                            onChange={handleChange}
                                            required
                                            disabled={isSubmitting}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Crew Details */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-cogs text-primary"></i>
                                    Crew Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Leader</span>
                                        </label>
                                        <select
                                            name="leader_id"
                                            className="select select-bordered select-secondary"
                                            value={formData.leader_id}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select a leader</option>
                                            {members.map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Specialty</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="specialty"
                                            className="input input-bordered input-secondary"
                                            value={formData.specialty}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            placeholder="e.g., Electrical, Plumbing, General"
                                        />
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
                                        <span className="label-text font-medium">Notes</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        className="textarea textarea-bordered textarea-secondary w-full"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        rows={4}
                                        placeholder="Additional notes about this crew..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
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
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <i className="far fa-save"></i>
                                    Update Crew
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalEdit;