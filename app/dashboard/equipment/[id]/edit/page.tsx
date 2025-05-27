import { EquipmentWithDetails } from "@/types/equipment";
import EditEquipment from "../../components/edit";
import { getEquipmentById } from "@/app/actions/equipments";
import Link from "next/link";

export default async function EditEquipmentPage({ params }: { params: { id: string } }) {
    const equipmentId = (await params).id;
    const equipment = await getEquipmentById(equipmentId);
    if (!equipment) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Equipment not found</h2>
                <p>The requested equipment does not exist or you don't have permission to view it.</p>
            </div>
        );
    }
    console.log("Editing equipment:", equipment);

    return (
        <div className="">
            <div className="flex justify-start items-center mb-4">
                <Link href={`/dashboard/equipment/${equipmentId}`} className="btn btn-ghost btn-sm mb-4 mr-2">
                    <i className="fas fa-arrow-left"></i>
                </Link>
                <h1 className="text-2xl font-bold mb-4">Edit Equipment</h1>
            </div>
            <EditEquipment initialEquipment={equipment} />
        </div>
    );
}