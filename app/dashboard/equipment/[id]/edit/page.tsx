import { EquipmentWithDetails } from "@/types/equipment";
import EditEquipment from "../../components/edit";
import { getEquipmentById } from "@/app/actions/equipments";

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

    return <EditEquipment initialEquipment={equipment} />;
}