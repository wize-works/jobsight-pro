"use client";
import { useState } from "react";
import type { EquipmentWithDetails } from "@/types/equipment";
import type { EquipmentSpecification } from "@/types/equipment-specifications";
import { useRouter } from "next/navigation";

// Use only the fields needed for the form UI
interface SpecFormState {
    name: string;
    value: string;
}

export default function EditEquipment({ initialEquipment }: { initialEquipment: EquipmentWithDetails }) {
    console.log("Editing equipment:", initialEquipment);
    const [equipment, setEquipment] = useState<Partial<EquipmentWithDetails>>(initialEquipment);

    const [specifications, setSpecifications] = useState<SpecFormState[]>([]);
    const router = useRouter();

    const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setSpecifications((prev) => [...prev, { name: "", value: "" }]);
    };

    const removeSpecification = (idx: number) => {
        setSpecifications((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Submit logic here
        // await updateEquipment({ ...equipment, specifications });
        router.push("/dashboard/equipment");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-lg col-span-2">
                <div className="card-body">
                    <h2 className="text-xl font-bold mb-4">Edit Equipment</h2>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* General Details - Column 1 */}
                            <div className="flex flex-col gap-4 col-span-1">
                                <div>
                                    <label className="label">Name</label>
                                    <input
                                        className="input input-bordered w-full"
                                        name="name"
                                        defaultValue={initialEquipment.name || ""}
                                        onChange={handleEquipmentChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Serial Number</label>
                                    <input
                                        className="input input-bordered w-full"
                                        name="serial_number"
                                        defaultValue={initialEquipment.serial_number || ""}
                                        onChange={handleEquipmentChange}
                                    />
                                </div>
                                <div>
                                    <label className="label">Purchase Date</label>
                                    <input
                                        className="input input-bordered w-full"
                                        type="date"
                                        name="purchase_date"
                                        defaultValue={initialEquipment.purchase_date || ""}
                                        onChange={handleEquipmentChange}
                                    />
                                </div>
                            </div>

                            {/* General Details - Column 2 */}
                            <div className="flex flex-col gap-4 col-span-1">
                                <div>
                                    <label className="label">Purchase Price</label>
                                    <input
                                        className="input input-bordered w-full"
                                        type="number"
                                        name="purchase_price"
                                        defaultValue={initialEquipment.purchase_price ?? ""}
                                        onChange={handleEquipmentChange}
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className="label">Current Value</label>
                                    <input
                                        className="input input-bordered w-full"
                                        type="number"
                                        name="current_value"
                                        defaultValue={initialEquipment.current_value ?? ""}
                                        onChange={handleEquipmentChange}
                                        min={0}
                                    />
                                </div>
                                {/* Add more general fields as needed */}
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-4">
                            <button type="submit" className="btn btn-primary">
                                Save
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>


            {/* Specifications - Column 3 */}
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
                                    <input
                                        className="input input-bordered w-1/2"
                                        placeholder="Name"
                                        value={spec.name}
                                        onChange={(e) => handleSpecChange(idx, "name", e.target.value)}
                                    />
                                    <input
                                        className="input input-bordered w-1/2"
                                        placeholder="Value"
                                        value={spec.value}
                                        onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-error"
                                        onClick={() => removeSpecification(idx)}
                                        title="Remove"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
