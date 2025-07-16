"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateEquipment } from "@/app/actions/equipments";
import { createEquipmentSpecification, updateEquipmentSpecification, deleteEquipmentSpecification } from "@/app/actions/equipment-specifications";
import { setEquipmentRate, getEquipmentRate } from "@/app/actions/client/rate-management";
import { useRateManagement } from "@/hooks/useRateManagement";
import { toast } from "@/hooks/use-toast";
import type { EquipmentWithDetails, EquipmentUpdate, EquipmentStatus, EquipmentType } from "@/types/equipment";
import type { EquipmentSpecification, EquipmentSpecificationUpdate } from "@/types/equipment-specifications";
import type { BillingRate } from "@/types/invoice-automation";
import { equipmentStatusOptions, equipmentTypeOptions } from "@/types/equipment";
import { useBusiness } from "@/lib/business-context";
import { useCurrentPosition } from "@/hooks/use-geolocation";

interface EquipmentEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (equipment: any) => void;
    equipment: EquipmentWithDetails;
    specifications: EquipmentSpecification[];
}

export default function EquipmentEditModal({ isOpen, onClose, onSave, equipment, specifications }: EquipmentEditModalProps) {
    const router = useRouter();
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(false);

    // Use the new rate management hook
    const { updateEquipmentRate, getEquipmentRate } = useRateManagement();

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        type: "other" as EquipmentType,
        status: "available" as EquipmentStatus,
        description: "",
        serial_number: "",
        make: "",
        model: "",
        year: new Date().getFullYear(),
        purchase_date: "",
        purchase_price: "",
        current_value: "",
        location: "",
        next_maintenance: "",
        image_url: "",
        // Rate management fields
        is_billable: false,
        hourly_rate: 0,
    });

    const [equipmentSpecs, setEquipmentSpecs] = useState<EquipmentSpecification[]>([]);

    // Load existing equipment rates
    const loadExistingRates = async (equipmentId: string) => {
        try {
            const rateResult = await getEquipmentRate(equipmentId, businessId);
            if (rateResult && typeof rateResult === 'object' && 'hourlyRate' in rateResult) {
                setFormData(prev => ({
                    ...prev,
                    hourly_rate: rateResult.hourlyRate || 0,
                }));
            }
        } catch (error) {
            console.error('Error loading equipment rates:', error);
        }
    };

    // Initialize form data when equipment changes
    useEffect(() => {
        if (equipment) {
            setFormData({
                name: equipment.name || "",
                type: equipment.type as EquipmentType || "other",
                status: equipment.status as EquipmentStatus || "available",
                description: equipment.description || "",
                serial_number: equipment.serial_number || "",
                make: equipment.make || "",
                model: equipment.model || "",
                year: equipment.year || new Date().getFullYear(),
                purchase_date: equipment.purchase_date || "",
                purchase_price: equipment.purchase_price?.toString() || "",
                current_value: equipment.current_value?.toString() || "",
                location: equipment.location || "",
                next_maintenance: equipment.next_maintenance || "",
                image_url: equipment.image_url || "",
                is_billable: equipment.is_billable || false,
                hourly_rate: equipment.hourly_rate || 0,
            });
            setEquipmentSpecs(specifications || []);

            // Load existing rates
            loadExistingRates(equipment.id);
        }
    }, [equipment, specifications]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSpecChange = (idx: number, field: "name" | "value", value: string) => {
        setEquipmentSpecs((prev) =>
            prev.map((spec, i) =>
                i === idx ? { ...spec, [field]: value } : spec
            )
        );
    };

    const addSpecification = () => {
        setEquipmentSpecs((prev) => [
            ...prev,
            {
                id: "", // Will be set by backend
                equipment_id: equipment.id,
                business_id: businessId,
                name: "",
                value: "",
                created_at: "",
                created_by: null,
                updated_at: null,
                updated_by: null,
            },
        ]);
    };

    const removeSpecification = async (idx: number) => {
        const spec = equipmentSpecs[idx];
        if (spec.id) {
            // Delete from backend if it has an ID
            try {
                await deleteEquipmentSpecification(businessId, spec.id);
                toast.success({
                    title: "Success",
                    description: "Specification deleted successfully"
                });
            } catch (error) {
                console.error("Error deleting specification:", error);
                toast.error({
                    title: "Error",
                    description: "Failed to delete specification"
                });
                return; // Don't remove from UI if backend delete failed
            }
        }

        setEquipmentSpecs((prev) => prev.filter((_, i) => i !== idx));
    };

    const saveSpecification = async (idx: number) => {
        const spec = equipmentSpecs[idx];
        if (!spec.name.trim()) {
            toast.error({
                title: "Error",
                description: "Specification name is required"
            });
            return;
        }

        try {
            if (!spec.id) {
                // Create new specification
                const newSpec = await createEquipmentSpecification(businessId, {
                    equipment_id: equipment.id,
                    name: spec.name,
                    value: spec.value,
                    id: "",
                    business_id: businessId,
                    created_at: "",
                    created_by: null,
                    updated_at: null,
                    updated_by: null
                });
                // Update the local state with the new ID
                if (newSpec) {
                    setEquipmentSpecs(prev =>
                        prev.map((s, i) => i === idx ? { ...s, id: newSpec.id } : s)
                    );
                }
            } else {
                // Update existing specification
                await updateEquipmentSpecification(businessId, spec.id, {
                    name: spec.name,
                    value: spec.value
                } as EquipmentSpecificationUpdate);
            }

            toast.success({
                title: "Success",
                description: "Specification saved successfully"
            });
        } catch (error) {
            console.error("Error saving specification:", error);
            toast.error({
                title: "Error",
                description: "Failed to save specification"
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!equipment.id) {
                throw new Error("Equipment ID is required to update equipment.");
            } const equipmentData = {
                name: formData.name,
                type: formData.type,
                status: formData.status,
                description: formData.description || null,
                serial_number: formData.serial_number || null,
                make: formData.make || null,
                model: formData.model || null,
                year: formData.year || null,
                purchase_date: formData.purchase_date || null,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
                current_value: formData.current_value ? parseFloat(formData.current_value) : null,
                location: formData.location || null,
                next_maintenance: formData.next_maintenance || null,
                image_url: formData.image_url || null,
                is_billable: formData.is_billable,
                hourly_rate: formData.is_billable ? formData.hourly_rate : 0,
            } as EquipmentUpdate;

            const updatedEquipment = await updateEquipment(businessId, equipment.id, equipmentData);

            if (updatedEquipment) {
                // Update equipment rates
                const rateData: BillingRate = {
                    hourlyRate: formData.is_billable ? formData.hourly_rate : 0,
                };

                await updateEquipmentRate({
                    equipmentId: equipment.id,
                    businessId,
                    hourlyRate: rateData.hourlyRate,
                    overtimeRate: rateData.overtimeRate
                });

                toast.success({
                    title: "Success",
                    description: "Equipment updated successfully"
                });
                onSave(updatedEquipment);
                onClose();
                router.refresh();
            } else {
                toast.error({
                    title: "Error",
                    description: "Failed to update equipment"
                });
            }
        } catch (error) {
            console.error("Error updating equipment:", error);
            toast.error({
                title: "Error",
                description: "Failed to update equipment"
            });
        } finally {
            setLoading(false);
        }
    };

    // Use the safe geolocation hook
    const {
        position,
        error: geoError,
        refetch: requestLocation
    } = useCurrentPosition();

    const getCurrentLocation = () => {
        requestLocation();

        // Watch for position updates
        if (position) {
            const { latitude, longitude } = position.coords;
            setFormData(prev => ({
                ...prev,
                location: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`
            }));
            toast.success({
                title: "Location Updated",
                description: "Current location has been set"
            });
        } else if (geoError) {
            toast.error({
                title: "Location Error",
                description: "Unable to get current location"
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-6xl max-h-[90vh] p-0 rounded-lg">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Edit Equipment</h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form - Spans 2 columns */}
                        <div className="lg:col-span-2">
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
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter equipment name"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Type</span>
                                                </label>
                                                {equipmentTypeOptions.select(
                                                    formData.type,
                                                    (value) => setFormData(prev => ({ ...prev, type: value })),
                                                    "select-secondary w-full"
                                                )}
                                            </div>                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Status</span>
                                                </label>
                                                {equipmentStatusOptions.select(
                                                    formData.status,
                                                    (value) => setFormData(prev => ({ ...prev, status: value })),
                                                    "select select-bordered select-secondary w-full"
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
                                                placeholder="Enter equipment description"
                                                rows={3}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Equipment Details */}
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-cogs text-primary"></i>
                                            Equipment Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Serial Number</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="serial_number"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.serial_number}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter serial number"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Make</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="make"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.make}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter manufacturer"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Model</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="model"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.model}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter model"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Year</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="year"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.year}
                                                    onChange={handleInputChange}
                                                    min={1900}
                                                    max={new Date().getFullYear() + 1}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Details */}
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-dollar-sign text-primary"></i>
                                            Financial Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Purchase Date</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="purchase_date"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.purchase_date}
                                                    onChange={handleInputChange}
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Purchase Price</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="purchase_price"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.purchase_price}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    min={0}
                                                    step="0.01"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Current Value</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="current_value"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.current_value}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    min={0}
                                                    step="0.01"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Next Maintenance</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="next_maintenance"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.next_maintenance}
                                                    onChange={handleInputChange}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Media */}
                                <div className="card bg-base-100 border border-base-300">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-map-marker-alt text-primary"></i>
                                            Location & Media
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="form-control">
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
                                                        placeholder="Enter location or use GPS"
                                                        disabled={loading}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary join-item"
                                                        onClick={getCurrentLocation}
                                                        disabled={loading}
                                                        title="Get current location"
                                                    >
                                                        <i className="far fa-crosshairs"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium">Image URL</span>
                                                </label>
                                                <input
                                                    type="url"
                                                    name="image_url"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.image_url}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter image URL"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rate Management */}
                                <div className="card bg-base-100 border border-base-300 mt-6">
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <i className="far fa-money-bill-wave text-primary"></i>
                                            Rate Management
                                        </h3>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium">Is Billable?</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    name="is_billable"
                                                    className="toggle toggle-secondary"
                                                    checked={formData.is_billable}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, is_billable: e.target.checked }))
                                                    }
                                                    disabled={loading}
                                                />
                                                <span className="text-sm text-base-content/70">
                                                    {formData.is_billable ? "Billable" : "Non-billable"}
                                                </span>
                                            </div>
                                        </div>
                                        {formData.is_billable && (
                                            <div className="form-control mt-4">
                                                <label className="label">
                                                    <span className="label-text font-medium">Hourly Rate</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="hourly_rate"
                                                    className="input input-bordered input-secondary w-full"
                                                    value={formData.hourly_rate}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    min={0}
                                                    step="0.01"
                                                    disabled={loading}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Specifications - Column 3 */}
                        <div className="lg:col-span-1">
                            <div className="card bg-base-100 border border-base-300 h-fit">
                                <div className="card-body p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <i className="far fa-list text-primary"></i>
                                            Specifications
                                        </h3>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            onClick={addSpecification}
                                            disabled={loading}
                                        >
                                            <i className="far fa-plus"></i>
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {equipmentSpecs.map((spec, idx) => (
                                            <div key={idx} className="card bg-base-200 border border-base-300">
                                                <div className="card-body p-3">
                                                    <div className="space-y-2">
                                                        <input
                                                            className="input input-bordered input-sm w-full"
                                                            placeholder="Name"
                                                            value={spec.name}
                                                            onChange={(e) => handleSpecChange(idx, "name", e.target.value)}
                                                            disabled={loading}
                                                        />
                                                        <input
                                                            className="input input-bordered input-sm w-full"
                                                            placeholder="Value"
                                                            value={spec.value || ""}
                                                            onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
                                                            disabled={loading}
                                                        />
                                                        <div className="flex gap-1 justify-end">
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-success"
                                                                onClick={() => saveSpecification(idx)}
                                                                disabled={loading || !spec.name.trim()}
                                                                title="Save"
                                                            >
                                                                <i className="far fa-check"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-error"
                                                                onClick={() => removeSpecification(idx)}
                                                                disabled={loading}
                                                                title="Remove"
                                                            >
                                                                <i className="far fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
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
                                    <i className="far fa-save"></i>
                                    Update Equipment
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
