import { Equipment } from "@/types/equipment";
import Link from "next/link";
import { EquipmentStatus } from "@/types/equipment";
import { equipmentStatusOptions } from "@/types/equipment";

interface EquipmentCardProps extends Equipment {
    onEdit?: (equipment: Equipment) => void;
}

export const EquipmentCard = (props: EquipmentCardProps) => {
    const { onEdit, ...equipment } = props;

    return (
        <div className="card bg-base-100 shadow-lg">
            <figure className="px-4 pt-4">
                <img src={equipment.image_url || "/default-equipment.png"} alt={equipment.name} className="rounded-xl w-full h-48 object-cover" />
            </figure>
            <div className="card-body">
                <div className="flex justify-between items-start">
                    <h2 className="card-title">{equipment.name}</h2>
                    <div>
                        {equipmentStatusOptions.badge(equipment.status as EquipmentStatus)}
                    </div>
                </div>
                <div className="mt-2 space-y-1">
                    <p><span className="font-semibold">Type:</span> {equipment.type}</p>
                    <p><span className="font-semibold">Status:</span> {equipment.status}</p>
                    <p><span className="font-semibold">Location:</span> {equipment.location}</p>
                    <p><span className="font-semibold">Description:</span> {equipment.description}</p>
                </div>
                <div className="card-actions justify-end mt-4 gap-2">
                    <Link href={`/dashboard/equipment/${equipment.id}`} className="btn btn-outline btn-sm">
                        <i className="far fa-eye"></i>
                        View Details
                    </Link>
                    {onEdit && (
                        <button
                            onClick={() => onEdit(equipment)}
                            className="btn btn-primary btn-sm"
                        >
                            <i className="far fa-edit"></i>
                            Edit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

}