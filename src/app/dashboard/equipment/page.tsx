export const dynamic = "force-dynamic";

import EquipmentList from "./components/list";
import { getEquipments } from "@/app/actions/equipments";

export default async function EquipmentPage() {
    const equipments = await getEquipments();

    return (
        <div>
            <EquipmentList initialEquipments={equipments} />
        </div>
    )
}
