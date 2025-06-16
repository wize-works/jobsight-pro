export const dynamic = "force-dynamic";

import EquipmentList from "./components/list";
import { getEquipments } from "@/app/actions/equipments";
import { withBusinessServer } from "@/lib/auth/with-business-server";

export default async function EquipmentPage() {
    const { business } = await withBusinessServer();
    const businessId = business.id;

    const equipments = await getEquipments(businessId);

    return (
        <div>
            <EquipmentList initialEquipments={equipments} />
        </div>
    );
}
