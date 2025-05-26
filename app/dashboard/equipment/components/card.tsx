import { Equipment } from "@/types/equipment";
import Link from "next/link";

const statusOptions = {
    in_use: { label: "In Use", color: "badge-primary" },
    available: { label: "Available", color: "badge-success" },
    maintenance: { label: "Maintenance", color: "badge-warning" },
    repair: { label: "Under Repair", color: "badge-error" },
    retired: { label: "Retired", color: "badge-neutral" },
};

export const EquipmentCard = (equipment: Equipment) => {

    const getStatusOption = (status: string | null | undefined) => {
        if (!status) return undefined;
        if (Object.prototype.hasOwnProperty.call(statusOptions, status)) {
            return statusOptions[status as keyof typeof statusOptions];
        }
        return undefined;
    };
    return (
        <div className="card bg-base-100 shadow-lg">
            <figure className="px-4 pt-4">
                <img src={equipment.image_url || "/default-equipment.png"} alt={equipment.name} className="rounded-xl w-full h-48 object-cover" />
            </figure>
            <div className="card-body">
                <div className="flex justify-between items-start">
                    <h2 className="card-title">{equipment.name}</h2>
                    <div className={`badge ${getStatusOption(equipment.status)?.color || "badge-neutral"}`}>
                        {getStatusOption(equipment.status)?.label || equipment.status || "-"}
                    </div>
                </div>
                <div className="mt-2 space-y-1">
                    <p><span className="font-semibold">Type:</span> {equipment.type}</p>
                    <p><span className="font-semibold">Status:</span> {equipment.status}</p>
                    <p><span className="font-semibold">Location:</span> {equipment.location}</p>
                    <p><span className="font-semibold">Description:</span> {equipment.description}</p>
                </div>
                <div className="card-actions justify-end mt-4">
                    <Link href={`/dashboard/equipment/${equipment.id}`} className="btn btn-outline btn-sm">View Details</Link>
                </div>
            </div>
        </div>
    );

}