import React, { useState, useEffect } from "react";
import { CrewMember, CrewMemberRole, crewMemberRoleOptions } from "@/types/crew-members";
import { BillingRate } from "@/types/invoice-automation";
import { useRateManagement } from "@/hooks/useRateManagement";
import { useBusiness } from "@/lib/business-context";

interface ModalMemberProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<{ success: boolean }>;

    initialMember?: CrewMember; // Add optional initialMember prop for editing mode
}

const ModalMember: React.FC<ModalMemberProps> = ({ title, loading, onClose, onSubmit, initialMember }) => {
    const isEditMode = !!initialMember;
    const { businessId } = useBusiness();

    // Use the new rate management hook
    const { updateCrewMemberRate, getCrewMemberRate } = useRateManagement();

    const [formData, setFormData] = useState({
        name: "",
        role: "laborer" as CrewMemberRole,
        experience: 0,
        phone: "",
        email: "",
        avatar_url: "",
        // Rate fields
        isBillable: true,
        regularRate: 0,
        overtimeRate: 0,
        doubletimeRate: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingRates, setLoadingRates] = useState(false);

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
                // Default rate values
                isBillable: true,
                regularRate: 0,
                overtimeRate: 0,
                doubletimeRate: 0,
                effectiveDate: new Date().toISOString().split('T')[0],
            });

            // Load existing rates if in edit mode
            loadExistingRates();
        }
    }, [initialMember]);

    const loadExistingRates = async () => {
        if (!initialMember?.id) return;

        setLoadingRates(true);
        try {
            const currentRate = await getCrewMemberRate(initialMember.id, businessId);
            if (currentRate) {
                setFormData(prev => ({
                    ...prev,
                    isBillable: true, // Default to billable if rate exists
                    regularRate: currentRate.hourlyRate,
                    overtimeRate: currentRate.overtimeRate || 0,
                    doubletimeRate: currentRate.doubletimeRate || 0,
                    effectiveDate: currentRate.effectiveDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                }));
            }
        } catch (error) {
            console.error('Error loading existing rates:', error);
        } finally {
            setLoadingRates(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "experience" || name === "regularRate" || name === "overtimeRate" || name === "doubletimeRate"
                ? Number(value) : value
        }));
        setError(null); // Clear error when user makes changes
    };

    const handleRoleChange = (role: CrewMemberRole) => {
        setFormData((prev) => ({ ...prev, role }));
        setError(null);
    };

    const handleBillableChange = (isBillable: boolean) => {
        setFormData((prev) => ({ ...prev, isBillable }));
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
            if (formData.isBillable && formData.regularRate <= 0) {
                throw new Error("Regular rate must be greater than 0 for billable members");
            }

            // If we're in edit mode, include the ID in the submission
            const submissionData = isEditMode ? { ...formData, id: initialMember?.id } : formData;

            const result = await onSubmit(submissionData);
            if (result.success) {
                // If successful and member is billable, save the rate
                if (formData.isBillable) {
                    await saveRateData(submissionData);
                }
                onClose();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `An error occurred while ${isEditMode ? 'updating' : 'adding'} the crew member`;
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const saveRateData = async (memberData: any) => {
        try {
            const memberId = memberData.id || memberData.name; // Use ID if available, fallback to name for new members

            await updateCrewMemberRate({
                crewMemberId: memberId,
                businessId,
                hourlyRate: formData.regularRate,
                overtimeRate: formData.overtimeRate || undefined,
                doubletimeRate: formData.doubletimeRate || undefined,
            });
        } catch (error) {
            console.error('Error saving rate data:', error);
            // Don't fail the whole operation if rate saving fails
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

                        {/* Billing Rate Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-dollar-sign text-primary"></i>
                                    Billing Rate Information
                                </h3>

                                {/* Billable Toggle */}
                                <div className="form-control mb-4">
                                    <label className="label cursor-pointer justify-start gap-3">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-secondary"
                                            checked={formData.isBillable}
                                            onChange={(e) => handleBillableChange(e.target.checked)}
                                            disabled={isSubmitting}
                                        />
                                        <span className="label-text font-medium">This member is billable to clients</span>
                                    </label>
                                </div>

                                {/* Rate Fields - Only show if billable */}
                                {formData.isBillable && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Regular Rate ($/hour) *</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="regularRate"
                                                className="input input-bordered input-secondary"
                                                value={formData.regularRate}
                                                onChange={handleChange}
                                                disabled={isSubmitting || loadingRates}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                required={formData.isBillable}
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Overtime Rate ($/hour)</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="overtimeRate"
                                                className="input input-bordered input-secondary"
                                                value={formData.overtimeRate}
                                                onChange={handleChange}
                                                disabled={isSubmitting || loadingRates}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Double Time Rate ($/hour)</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="doubletimeRate"
                                                className="input input-bordered input-secondary"
                                                value={formData.doubletimeRate}
                                                onChange={handleChange}
                                                disabled={isSubmitting || loadingRates}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Effective Date</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="effectiveDate"
                                                className="input input-bordered input-secondary"
                                                value={formData.effectiveDate}
                                                onChange={handleChange}
                                                disabled={isSubmitting || loadingRates}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Loading indicator for rates */}
                                {loadingRates && (
                                    <div className="flex items-center gap-2 text-sm text-base-content mt-2">
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Loading existing rates...
                                    </div>
                                )}

                                {/* Help text */}
                                <div className="text-sm text-base-content/70 mt-4">
                                    <p>💡 <strong>Tip:</strong> Rates are used for invoice automation and cost calculations.</p>
                                    <p>• Leave overtime/double-time rates empty to use regular rate × multiplier</p>
                                    <p>• Effective date determines when this rate becomes active</p>
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
                            disabled={isSubmitting || !formData.name.trim() || !formData.role || (formData.isBillable && formData.regularRate <= 0)}
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