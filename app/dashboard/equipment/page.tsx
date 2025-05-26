import EquipmentList from "./components/list";
import { getEquipments } from "@/app/actions/equipments";

export default async function EquipmentPage() {
    const equipments = await getEquipments();
    if (!equipments || equipments.length === 0) {
        return <div className="p-8 text-center">No equipments found.</div>;
    }

    return (
        <div>
            <EquipmentList initialEquipments={equipments} />
        </div>
    )
}
