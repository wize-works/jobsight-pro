"use client";
import { useState } from "react";
import type { EquipmentUpdate, EquipmentWithDetails } from "@/types/equipment";
import type { EquipmentSpecification } from "@/types/equipment-specifications";
import { useRouter } from "next/navigation";
import { updateEquipment } from "@/app/actions/equipments";
import { createEquipmentSpecification, updateEquipmentSpecification } from "@/app/actions/equipment-specifications";

// Use only the fields needed for the form UI
interface SpecFormState {
    name: string;
    value: string;
}

export default function EditEquipment({ initialEquipment, initialSpecifications }: { initialEquipment: EquipmentWithDetails, initialSpecifications: EquipmentSpecification[] }) {
    const [equipment, setEquipment] = useState<Partial<EquipmentWithDetails>>(initialEquipment);
    const [specifications, setSpecifications] = useState<EquipmentSpecification[]>(initialSpecifications);
    const router = useRouter();

    const handleEquipmentChange = (e: { target: { name: any; value: any; }; }) => {
        const { name, value } = e.target;
        setEquipment((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSpecChange = (idx: number, field: "name" | "value", value: string) => {
        setSpecifications((prev) =>
            prev.map((spec, i) =>
                i === idx ? { ...spec, [field]: value } : spec
            )
        );
    };

    const addSpecification = () => {
        setSpecifications((prev) => [
            ...prev,
            {
                id: "", // placeholder, will be set by backend
                equipment_id: equipment.id ?? "",
                business_id: "", // placeholder, set as needed
                name: "",
                value: "",
                created_at: "", // placeholder, set as needed
                created_by: null,
                updated_at: null,
                updated_by: null,
            },
        ]);
    };

    const removeSpecification = (idx: number) => {
        setSpecifications((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Submit logic here
        if (!equipment.id) {
            throw new Error("Equipment ID is required to update equipment.");
        }
        const equipmentModel = equipment as EquipmentUpdate;
        await updateEquipment(equipment.id, equipmentModel);
        router.push("/dashboard/equipment");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-lg md:col-span-2">
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
                        <div className="flex justify-end gap-4">
                            <button type="submit" className="btn btn-primary">
                                Save Changes
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">Name</label>
                                        <input
                                            className="input input-bordered"
                                            name="name"
                                            value={equipment.name || ""}
                                            onChange={handleEquipmentChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">Type</label>
                                        <select
                                            className="select select-bordered w-full"
                                            name="type"
                                            value={equipment.type || "other"}
                                            onChange={handleEquipmentChange}
                                        >
                                            <option value="small-equipment">Small Equipment</option>
                                            <option value="medium-equipment">Medium Equipment</option>
                                            <option value="heavy-equipment">Heavy Equipment</option>
                                            <option value="power-tool">Power Tool</option>
                                            <option value="tool">Tool</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="divider my-6">
                                    <h2 className="font-bold text-lg">
                                        Equipment Details
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">Serial Number</label>
                                        <input
                                            className="input input-bordered"
                                            name="serial_number"
                                            value={equipment.serial_number || ""}
                                            onChange={handleEquipmentChange}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">Make</label>
                                        <input
                                            className="input input-bordered w-full"
                                            name="make"
                                            value={equipment.make || ""}
                                            onChange={handleEquipmentChange}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">Model</label>
                                        <input
                                            className="input input-bordered w-full"
                                            name="model"
                                            value={equipment.model || ""}
                                            onChange={handleEquipmentChange}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">Year</label>
                                        <input
                                            className="input input-bordered w-full"
                                            type="number"
                                            name="year"
                                            value={equipment.year || ""}
                                            onChange={handleEquipmentChange}
                                            min={1900}
                                            max={new Date().getFullYear()}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="divider my-6">
                                    <h3 className="font-bold text-lg">
                                        Financial Details
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">Purchase Date</label>
                                        <input
                                            className="input input-bordered w-full"
                                            type="date"
                                            name="purchase_date"
                                            value={equipment.purchase_date || ""}
                                            onChange={handleEquipmentChange}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">Purchase Price</label>
                                        <input
                                            className="input input-bordered w-full"
                                            type="number"
                                            name="purchase_price"
                                            value={equipment.purchase_price ?? ""}
                                            onChange={handleEquipmentChange}
                                            min={0}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">Current Value</label>
                                        <input
                                            className="input input-bordered w-full"
                                            type="number"
                                            name="current_value"
                                            value={equipment.current_value ?? ""}
                                            onChange={handleEquipmentChange}
                                            min={0}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label mb-2">Location</label>
                                        <div className="join w-full">
                                            <input
                                                className="input input-bordered w-full join-item mt-0"
                                                name="location"
                                                value={equipment.location || ""}
                                                onChange={handleEquipmentChange}
                                            />
                                            <button className="btn btn-secondary join-item" type="button" onClick={() => navigator.geolocation.getCurrentPosition((position) => {
                                                const { latitude, longitude } = position.coords;
                                                setEquipment((prev) => ({
                                                    ...prev,
                                                    location: `Lat: ${latitude}, Lon: ${longitude}`,
                                                }));
                                            })}>
                                                <i className="fas fa-map-marker-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="divider my-6">
                                    <h3 className="font-bold text-lg">
                                        Status Details
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">Status</label>
                                        <select
                                            className="select select-bordered w-full"
                                            name="status"
                                            value={equipment.status || "available"}
                                            onChange={handleEquipmentChange}
                                        >
                                            <option value="available">Available</option>
                                            <option value="in_use">In Use</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="repair">Repair</option>
                                            <option value="retired">Retired</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">Next Maintenance</label>
                                        <input
                                            className="input input-bordered w-full"
                                            type="date"
                                            name="next_maintenance"
                                            value={equipment.next_maintenance || ""}
                                            onChange={handleEquipmentChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="form-control">
                                <label className="label">Image URL</label>
                                <input
                                    className="input input-bordered w-full"
                                    name="image_url"
                                    value={equipment.image_url || ""}
                                    onChange={handleEquipmentChange}
                                />
                            </div>
                            <div className="form-control col-span-2">
                                <label className="label">Description</label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    name="description"
                                    value={equipment.description || ""}
                                    onChange={handleEquipmentChange}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>


            {/* Specifications - Column 3 */}
            <div className="flex flex-col gap-4">
                <div className="card bg-base-100 shadow-lg col-span-1">
                    <div className="card-body">
                        <div className="flex flex-col gap-4 col-span-1">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-lg">Specifications</h2>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={addSpecification}
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {specifications.map((spec, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <form className="flex flex-row gap-2 items-center w-full">
                                            <input
                                                className="input input-bordered"
                                                placeholder="Name"
                                                value={spec.name}
                                                onChange={(e) => handleSpecChange(idx, "name", e.target.value)}
                                            />
                                            <input
                                                className="input input-bordered"
                                                placeholder="Value"
                                                value={spec.value || ""}
                                                onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline btn-secondary"
                                                onClick={async () => {
                                                    if (!spec.id) {
                                                        await createEquipmentSpecification({
                                                            equipment_id: equipment.id ?? "",
                                                            name: spec.name,
                                                            value: spec.value,
                                                            id: "",
                                                            business_id: "",
                                                            created_at: "",
                                                            created_by: null,
                                                            updated_at: null,
                                                            updated_by: null
                                                        });
                                                    } else {
                                                        await updateEquipmentSpecification(spec.id, { ...spec, name: spec.name, value: spec.value });
                                                    }
                                                }}
                                                title="Update"
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                        </form>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline btn-error"
                                            onClick={() => removeSpecification(idx)}
                                            title="Remove"
                                        >
                                            <i className="fas fa-x"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
