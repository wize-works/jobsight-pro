import React, { useState } from "react";
import { CrewMember } from "@/types/crew-members";

interface ModalLinkProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<{ success: boolean }>;
    allMembers: CrewMember[];
}

const ModalLink: React.FC<ModalLinkProps> = ({ title, loading, onClose, onSubmit, allMembers }) => {
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedMember = allMembers.find(member => member.id === selectedMemberId);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMemberId(e.target.value);
        setError(null); // Clear error when user makes changes
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validate required fields
            if (!selectedMemberId) {
                throw new Error("Please select a crew member to link");
            }

            const result = await onSubmit({ memberId: selectedMemberId, member: selectedMember });
            if (result.success) {
                onClose();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred while linking the crew member";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setSelectedMemberId("");
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
                        {/* Member Selection */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-link text-primary"></i>
                                    Select Crew Member
                                </h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Available Crew Members *</span>
                                    </label>
                                    <select
                                        name="memberId"
                                        className="select select-bordered select-secondary w-full"
                                        value={selectedMemberId}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Select a crew member</option>
                                        {allMembers.map((member) => (
                                            <option key={member.id} value={member.id}>
                                                {member.name} - {member.role}
                                                {member.phone && ` • ${member.phone}`}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="label">
                                        <span className="label-text-alt text-base-content/70">
                                            Choose an existing crew member to link to this crew
                                        </span>
                                    </div>
                                </div>

                                {/* Selected Member Preview */}
                                {selectedMember && (
                                    <div className="mt-4 p-4 bg-base-200 rounded-lg">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <i className="far fa-user text-primary"></i>
                                            Selected Member Preview
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar">
                                                <div className="w-12 h-12 rounded-full">
                                                    <img
                                                        src={selectedMember.avatar_url || "/diverse-avatars.png"}
                                                        alt={selectedMember.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium">{selectedMember.name}</div>
                                                <div className="text-sm text-base-content/70">
                                                    <span className="badge badge-sm badge-primary mr-2">{selectedMember.role}</span>
                                                    {selectedMember.experience && selectedMember.experience > 0 && (
                                                        <span>{selectedMember.experience} years experience</span>
                                                    )}
                                                </div>
                                                {selectedMember.phone && (
                                                    <div className="text-sm text-base-content/70">
                                                        <i className="far fa-phone mr-1"></i>
                                                        {selectedMember.phone}
                                                    </div>
                                                )}
                                                {selectedMember.email && (
                                                    <div className="text-sm text-base-content/70">
                                                        <i className="far fa-envelope mr-1"></i>
                                                        {selectedMember.email}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                            disabled={isSubmitting || !selectedMemberId}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Linking...
                                </>
                            ) : (
                                <>
                                    <i className="far fa-link"></i>
                                    Link Member
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalLink;