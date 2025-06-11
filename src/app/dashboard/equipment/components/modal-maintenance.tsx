"use client";

import {
    EquipmentMaintenance,
    type EquipmentMaintenanceType,
    maintenanceTypeOptions,
    maintenanceStatusOptions,
    EquipmentMaintenanceStatus
} from '@/types/equipment-maintenance';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createEquipmentMaintenance, updateEquipmentMaintenance } from '@/app/actions/equipment-maintenance';
import { toast } from '@/hooks/use-toast';

type MaintenanceModalProps = {
    isOpen: boolean;
    maintenance?: EquipmentMaintenance;
    onClose: () => void;
    onSave: (maintenance: EquipmentMaintenance) => void;
}

export const MaintenanceModal = ({ isOpen, maintenance, onClose, onSave }: MaintenanceModalProps) => {
    const router = useRouter();
    const params = useParams();
    const equipmentId = params?.id as string;
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        maintenance_date: '',
        maintenance_type: '' as EquipmentMaintenanceType,
        description: '',
        technician: '',
        cost: '',
        notes: '',
        status: 'scheduled' as EquipmentMaintenanceStatus
    });

    // If we have a maintenance record, populate the form
    useEffect(() => {
        if (maintenance) {
            setFormData({
                maintenance_date: maintenance.maintenance_date ? new Date(maintenance.maintenance_date).toISOString().split('T')[0] : '',
                maintenance_type: (maintenance.maintenance_type as EquipmentMaintenanceType) || 'other',
                description: maintenance.description || '',
                technician: maintenance.technician || '',
                cost: maintenance.cost ? maintenance.cost.toString() : '',
                notes: maintenance.notes || '',
                status: (maintenance.maintenance_status as EquipmentMaintenanceStatus) || 'scheduled'
            });
        } else {
            // Reset form for new maintenance
            setFormData({
                maintenance_date: '',
                maintenance_type: 'other' as EquipmentMaintenanceType,
                description: '',
                technician: '',
                cost: '',
                notes: '',
                status: 'scheduled'
            });
        }
    }, [maintenance]);

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
            const maintenanceData = {
                equipment_id: equipmentId,
                maintenance_type: formData.maintenance_type,
                maintenance_date: new Date(formData.maintenance_date).toISOString(),
                description: formData.description,
                technician: formData.technician || null,
                cost: formData.cost ? parseFloat(formData.cost) : null,
                notes: formData.notes || null,
                maintenance_status: formData.status,
                ...(maintenance?.id && { id: maintenance.id })
            } as EquipmentMaintenance;

            if (maintenance?.id) {
                await updateEquipmentMaintenance(maintenance.id, maintenanceData);
                toast.success({
                    title: "Success",
                    description: "Maintenance record updated successfully"
                });
            } else {
                await createEquipmentMaintenance(maintenanceData);
                toast.success({
                    title: "Success",
                    description: "Maintenance record added successfully"
                });
            }

            onSave(maintenanceData);
            onClose();
            router.refresh();
        } catch (error) {
            console.error("Error saving maintenance:", error);
            toast.error({
                title: "Error",
                description: maintenance?.id ? "Failed to update maintenance record" : "Failed to add maintenance record"
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
                            {maintenance ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
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
                                            <span className="label-text font-medium">Maintenance Type *</span>
                                        </label>
                                        <select
                                            name="maintenance_type"
                                            className="select select-bordered select-secondary"
                                            value={formData.maintenance_type}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="">Select maintenance type</option>
                                            {Object.entries(maintenanceTypeOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Maintenance Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="maintenance_date"
                                            className="input input-bordered input-secondary"
                                            value={formData.maintenance_date}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Technician</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="technician"
                                            className="input input-bordered input-secondary"
                                            value={formData.technician}
                                            onChange={handleInputChange}
                                            placeholder="Enter technician name"
                                            disabled={loading}
                                        />
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
                                            {Object.entries(maintenanceStatusOptions).map(([key, { label }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text font-medium">Description *</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        className="textarea textarea-bordered textarea-secondary"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Enter maintenance description"
                                        rows={3}
                                        required
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
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Cost</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="cost"
                                            className="input input-bordered input-secondary"
                                            value={formData.cost}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            min={0}
                                            step="0.01"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-sticky-note text-primary"></i>
                                    Additional Notes
                                </h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Notes</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        className="textarea textarea-bordered textarea-secondary"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="Enter additional notes or observations"
                                        rows={4}
                                        disabled={loading}
                                    />
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
                            disabled={loading || !formData.maintenance_type || !formData.maintenance_date || !formData.description}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    {maintenance ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <i className={maintenance ? "fas fa-save" : "fas fa-plus"}></i>
                                    {maintenance ? 'Update Maintenance' : 'Create Maintenance'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}