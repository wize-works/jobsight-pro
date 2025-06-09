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
import { on } from 'events';

type MaintenanceModalProps = {
    maintenance?: EquipmentMaintenance;
    onClose: () => void;
    onSave: (maintenance: EquipmentMaintenance) => void;
}

export const MaintenanceModal = ({ maintenance, onClose, onSave }: MaintenanceModalProps) => {
    const router = useRouter();
    const params = useParams();
    const equipmentId = params?.id as string;
    const [maintenanceDate, setMaintenanceDate] = useState('');
    const [maintenanceType, setMaintenanceType] = useState('');
    const [description, setDescription] = useState('');
    const [technician, setTechnician] = useState('');
    const [cost, setCost] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState(maintenance?.maintenance_status || 'scheduled');

    // If we have a maintenance record, populate the form
    useEffect(() => {
        if (maintenance) {
            setMaintenanceDate(maintenance.maintenance_date ? new Date(maintenance.maintenance_date).toISOString().split('T')[0] : '');
            setMaintenanceType(maintenance.maintenance_type || '');
            setDescription(maintenance.description || '');
            setTechnician(maintenance.technician || '');
            setCost(maintenance.cost ? maintenance.cost.toString() : '');
            setNotes(maintenance.notes || '');
        }
    }, [maintenance]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const maintenanceData = {
            equipment_id: equipmentId,
            maintenance_type: maintenanceType,
            maintenance_date: new Date(maintenanceDate).toISOString(),
            description,
            technician,
            cost: cost ? parseFloat(cost) : 0,
            notes,
            maintenance_status: status,
            ...(maintenance?.id && { id: maintenance.id }) // Include ID if editing
        } as EquipmentMaintenance;

        try {
            if (maintenance?.id) {
                // Update existing maintenance record
                await updateEquipmentMaintenance(maintenance.id, maintenanceData);
                toast.success('Maintenance record updated successfully');
            } else {
                // Create new maintenance record
                await createEquipmentMaintenance(maintenanceData);
                toast.success('Maintenance record added successfully');
            }
            onSave(maintenanceData);
            onClose();
            router.refresh();
        } catch (error) {
            toast.error(maintenance?.id ? 'Failed to update maintenance record' : 'Failed to add maintenance record');
        }
    };

    return (
        <dialog id="maintenance-modal" className="modal modal-open">
            <form method="dialog" className="modal-box space-y-4" onSubmit={handleSubmit}>
                <h3 className="font-bold text-lg">{maintenance ? 'Edit' : 'Add'} Maintenance</h3>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Maintenance Type</span>
                    </label>
                    {maintenanceTypeOptions.select(maintenanceType as EquipmentMaintenanceType, (value) => setMaintenanceType(value), "w-full")}
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Maintenance Date</span>
                    </label>
                    <input
                        type="date"
                        className="input input-bordered w-full"
                        value={maintenanceDate}
                        onChange={(e) => setMaintenanceDate(e.target.value)}
                        required
                    />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Description</span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered w-full"
                        value={description}
                        placeholder="Enter maintenance description"
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Technician</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        value={technician}
                        placeholder="Enter technician name"
                        onChange={(e) => setTechnician(e.target.value)}
                    />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Cost</span>
                    </label>
                    <input
                        type="number"
                        className="input input-bordered w-full"
                        value={cost}
                        placeholder="Enter cost"
                        onChange={(e) => setCost(e.target.value)}
                    />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Notes</span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered w-full"
                        value={notes}
                        placeholder="Enter additional notes"
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Status</span>
                    </label>
                    {maintenanceStatusOptions.select(status as EquipmentMaintenanceStatus, (value) => setStatus(value), "w-full")}
                </div>
                <div className="modal-action">
                    <button type="submit" className="btn btn-primary">{maintenance ? 'Update' : 'Save'}</button>
                    <button type="button" className="btn" onClick={onClose}>Cancel</button>
                </div>
            </form>
        </dialog>
    );
}