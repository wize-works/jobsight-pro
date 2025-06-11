"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEquipment } from "@/app/actions/equipments";
import { toast } from "@/hooks/use-toast";
import type { EquipmentInsert, EquipmentStatus, EquipmentType, EquipmentCondition } from "@/types/equipment";
import { equipmentStatusOptions, equipmentTypeOptions, equipmentConditionOptions } from "@/types/equipment";

interface EquipmentNewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (equipment: any) => void;
}

export default function EquipmentNewModal({ isOpen, onClose, onSave }: EquipmentNewModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        type: "other" as EquipmentType,
        status: "available" as EquipmentStatus,
        condition: "good" as EquipmentCondition,
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
    });

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

        try {
            const equipmentData = {
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
            } as EquipmentInsert;

            const newEquipment = await createEquipment(equipmentData);

            if (newEquipment) {
                toast.success({
                    title: "Success",
                    description: "Equipment created successfully"
                });
                onSave(newEquipment);
                onClose();
                router.refresh();
            } else {
                toast.error({
                    title: "Error",
                    description: "Failed to create equipment"
                });
            }
        } catch (error) {
            console.error("Error creating equipment:", error);
            toast.error({
                title: "Error",
                description: "Failed to create equipment"
            });
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(prev => ({
                        ...prev,
                        location: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`
                    }));
                },
                (error) => {
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

    if (!isOpen) return null;

    return (
        <div className="modal modal-open rounded-xl">
            <div className="modal-box max-w-4xl max-h-[90vh] p-0 rounded-xl">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Add New Equipment</h2>
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
                                            <span className="label-text font-medium">Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="input input-bordered input-secondary"
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
                                        <select
                                            name="type"
                                            className="select select-bordered select-secondary"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            {Object.entries(equipmentTypeOptions).map(([key, { label }]) => (
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
                                            className="select select-bordered select-secondary"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            {Object.entries(equipmentStatusOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Condition</span>
                                        </label>
                                        <select
                                            name="condition"
                                            className="select select-bordered select-secondary"
                                            value={formData.condition}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            {Object.entries(equipmentConditionOptions).map(([key, { label }]) => (
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
                                        className="textarea textarea-bordered textarea-secondary"
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
                                    <i className="fas fa-cogs text-primary"></i>
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
                                            className="input input-bordered input-secondary"
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
                                            className="input input-bordered input-secondary"
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
                                            className="input input-bordered input-secondary"
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
                                            className="input input-bordered input-secondary"
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
                                    <i className="fas fa-dollar-sign text-primary"></i>
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
                                            className="input input-bordered input-secondary"
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
                                            className="input input-bordered input-secondary"
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
                                            className="input input-bordered input-secondary"
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
                                            className="input input-bordered input-secondary"
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
                                    <i className="fas fa-map-marker-alt text-primary"></i>
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
                                                <i className="fas fa-crosshairs"></i>
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
                                            className="input input-bordered input-secondary"
                                            value={formData.image_url}
                                            onChange={handleInputChange}
                                            placeholder="Enter image URL"
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus"></i>
                                    Create Equipment
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}