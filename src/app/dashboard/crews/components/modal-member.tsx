import React, { useState, useEffect } from "react";
import { CrewMember, CrewMemberRole, crewMemberRoleOptions } from "@/types/crew-members";

interface ModalMemberProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<{ success: boolean }>;
    initialMember?: CrewMember; // Add optional initialMember prop for editing mode
}

const ModalMember: React.FC<ModalMemberProps> = ({ title, loading, onClose, onSubmit, initialMember }) => {
    const isEditMode = !!initialMember;

    const [formData, setFormData] = useState({
        name: "",
        role: "laborer" as CrewMemberRole,
        experience: 0,
        phone: "",
        email: "",
        avatar_url: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Populate form data with initialMember values if available
    useEffect(() => {
        if (initialMember) {
            setFormData({
                name: initialMember.name,
                role: (initialMember.role as CrewMemberRole) || "laborer",
                experience: initialMember.experience || 0,
                phone: initialMember.phone || "",
                email: initialMember.email || "",
                avatar_url: initialMember.avatar_url || "",
            });
        }
    }, [initialMember]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "experience" ? Number(value) : value
        }));
        setError(null); // Clear error when user makes changes
    };

    const handleRoleChange = (role: CrewMemberRole) => {
        setFormData((prev) => ({ ...prev, role }));
        setError(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validate required fields
            if (!formData.name.trim()) {
                throw new Error("Member name is required");
            }
            if (!formData.role) {
                throw new Error("Member role is required");
            }

            // If we're in edit mode, include the ID in the submission
            const submissionData = isEditMode ? { ...formData, id: initialMember?.id } : formData;

            const result = await onSubmit(submissionData);
            if (result.success) {
                onClose();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `An error occurred while ${isEditMode ? 'updating' : 'adding'} the crew member`;
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
                        {/* Basic Information */}
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
                                            placeholder="Enter full name"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Role *</span>
                                        </label>
                                        {crewMemberRoleOptions.select(
                                            formData.role,
                                            handleRoleChange,
                                            `select select-bordered select-secondary ${isSubmitting ? 'select-disabled' : ''}`
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-address-book text-primary"></i>
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Phone</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="input input-bordered input-secondary"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            placeholder="Phone number"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Email</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="input input-bordered input-secondary"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            placeholder="Email address"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-cogs text-primary"></i>
                                    Additional Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Experience (Years)</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="experience"
                                            className="input input-bordered input-secondary"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            min="0"
                                            placeholder="Years of experience"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Avatar URL</span>
                                        </label>
                                        <input
                                            type="url"
                                            name="avatar_url"
                                            className="input input-bordered input-secondary"
                                            value={formData.avatar_url}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            placeholder="Profile image URL"
                                        />
                                    </div>
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
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.name.trim() || !formData.role}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {isEditMode ? "Updating..." : "Adding..."}
                                </>
                            ) : (
                                <>
                                    <i className={`far ${isEditMode ? "fa-save" : "fa-user-plus"}`}></i>
                                    {isEditMode ? "Update Member" : "Add Member"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalMember;