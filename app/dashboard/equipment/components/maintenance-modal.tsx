import { EquipmentMaintenance } from '@/types/equipment-maintenance';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createEquipment } from '@/lib/equipment';
import { createEquipmentMaintenance } from '@/app/actions/equipment-maintenance';
import { toast } from '@/hooks/use-toast';


export const MaintenanceModal = () => {
    const router = useRouter();
    const params = useParams();
    const equipmentId = params?.id as string;
    const [maintenanceDate, setMaintenanceDate] = useState('');
    const [maintenanceType, setMaintenanceType] = useState('');
    const [description, setDescription] = useState('');
    const [technician, setTechnician] = useState('');
    const [cost, setCost] = useState('');
    const [notes, setNotes] = useState('');

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

        } as EquipmentMaintenance;

        await createEquipmentMaintenance(maintenanceData);
        setMaintenanceType('');
        setMaintenanceDate('');
        setDescription('');
        setTechnician('');
        setCost('');
        setNotes('');
        toast.success('Maintenance record added successfully');
        router.refresh();
    };

    return (
        <dialog id="maintenance-modal" className="modal modal-open">
            <form method="dialog" className="modal-box space-y-4" onSubmit={handleSubmit}>
                <h3 className="font-bold text-lg">Add Maintenance</h3>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Maintenance Type</span>
                    </label>
                    <select className="select select-bordered" onChange={(e) => setMaintenanceType(e.target.value)} required>
                        <option disabled>Select maintenance type</option>
                        <option>Inspection</option>
                        <option>Repair</option>
                        <option>Replacement</option>
                    </select>
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Maintenance Date</span>
                    </label>
                    <input
                        type="date"
                        className="input input-bordered w-full"
                        onChange={(e) => setMaintenanceDate(e.target.value)}
                        required
                    />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Description</span>
                    </label>
                    <textarea className="textarea textarea-bordered w-full" placeholder="Enter maintenance description" onChange={(e) => setDescription(e.target.value)}></textarea>
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Technician</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered w-full"
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
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="Enter cost"
                    />
                </div>
                <div className="modal-action">
                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" className="btn" onClick={() => close()}>Cancel</button>
                </div>
            </form>
        </dialog>
    );
}