import React, { useState, useEffect } from "react";
import { Equipment } from "@/types/equipment";
import { EquipmentAssignment, EquipmentAssignmentStatus, assignmentStatusOptions } from "@/types/equipment-assignments";

interface EquipmentAssignmentData {
    id?: string;
    equipment_id: string;
    start_date: string;
    end_date?: string;
    status: EquipmentAssignmentStatus;
    notes?: string;
    equipment_name?: string;
    equipment_model?: string;
    equipment_type?: string;
}

interface ModalEquipmentProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => Promise<{ success: boolean }>;
    equipment: Equipment[];
    initialData?: EquipmentAssignmentData; // For edit mode
}

const ModalEquipment: React.FC<ModalEquipmentProps> = ({
    title,
    loading,
    onClose,
    onSubmit,
    equipment,
    initialData
}) => {
    const [formData, setFormData] = useState({
        equipmentId: "",
        startDate: "",
        endDate: "",
        status: "assigned" as EquipmentAssignmentStatus,
        notes: "",
    });

    // Populate form data when editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                equipmentId: initialData.equipment_id || "",
                startDate: initialData.start_date || "",
                endDate: initialData.end_date || "",
                status: initialData.status || "assigned",
                notes: initialData.notes || "",
            });
        }
    }, [initialData]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedEquipment = equipment.find(eq => eq.id === formData.equipmentId);

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
            if (!formData.equipmentId) {
                throw new Error("Please select equipment");
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
            const errorMessage = err instanceof Error ? err.message : "An error occurred while saving the equipment assignment";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setFormData({
            equipmentId: "",
            startDate: "",
            endDate: "",
            status: "assigned",
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
                        {/* Equipment Selection */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-tools text-primary"></i>
                                    Equipment Assignment
                                </h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Equipment *</span>
                                    </label>
                                    <select
                                        name="equipmentId"
                                        className="select select-bordered select-secondary w-full"
                                        value={formData.equipmentId}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Select equipment</option>
                                        {equipment.map((eq) => (
                                            <option key={eq.id} value={eq.id}>
                                                {eq.name} - {eq.model} ({eq.type})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="label">
                                        <span className="label-text-alt text-base-content/70">
                                            Choose the equipment to assign to this crew
                                        </span>
                                    </div>
                                </div>

                                {/* Selected Equipment Preview */}
                                {selectedEquipment && (
                                    <div className="mt-4 p-4 bg-base-200 rounded-lg">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <i className="far fa-info-circle text-primary"></i>
                                            Equipment Details
                                        </h4>
                                        <div>
                                            <div className="font-medium text-lg">{selectedEquipment.name}</div>
                                            <div className="text-sm text-base-content/70 mt-1">
                                                <span className="font-medium">Model:</span> {selectedEquipment.model}
                                            </div>
                                            <div className="text-sm text-base-content/70">
                                                <span className="font-medium">Type:</span> {selectedEquipment.type}
                                            </div>
                                            {selectedEquipment.serial_number && (
                                                <div className="text-sm text-base-content/70">
                                                    <span className="font-medium">Serial:</span> {selectedEquipment.serial_number}
                                                </div>
                                            )}
                                            <div className="text-sm text-base-content/70">
                                                <i className="far fa-circle mr-1"></i>
                                                Status: <span className="badge badge-sm badge-primary">{selectedEquipment.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assignment Details */}
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

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text font-medium">Assignment Status *</span>
                                    </label>                                    <select
                                        name="status"
                                        className="select select-bordered select-secondary w-full"
                                        value={formData.status}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                    >
                                        <option value="assigned">Assigned</option>
                                        <option value="available">Available</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="repair">Repair</option>
                                        <option value="retired">Retired</option>
                                    </select>
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
                                        placeholder="Add any special instructions or notes for this equipment assignment..."
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
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.equipmentId || !formData.startDate}
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

export default ModalEquipment;
