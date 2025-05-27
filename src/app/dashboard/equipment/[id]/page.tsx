import { getEquipmentById } from "@/app/actions/equipments";
import { getEquipmentMaintenancesByEquipmentId } from "@/app/actions/equipment-maintenance";
import { getEquipmentUsagesByEquipmentId } from "@/app/actions/equipment_usage";
import { getEquipmentAssignmentsByEquipmentId } from "@/app/actions/equipment-assignments";
import { getEquipmentSpecificationsByEquipmentId } from "@/app/actions/equipment-specifications";
import { getMediaByEquipmentId } from "@/app/actions/media";
import EquipmentDetail from "../components/detail";
import { EquipmentMaintenance } from "@/types/equipment-maintenance";
import { EquipmentUsage } from "@/types/equipment_usage";
import { EquipmentAssignment } from "@/types/equipment-assignments";
import { EquipmentSpecification } from "@/types/equipment-specifications";
import { Media } from "@/types/media";

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
    const id = (await params).id;
    const equipment = await getEquipmentById(id);
    if (!equipment) {
        return <div className="p-8 text-center">Equipment not found.</div>;
    }
    // Fetch all related records and filter by equipmentId
    const [maintenances, usages, assignments, specifications, documents] = await Promise.all([
        getEquipmentMaintenancesByEquipmentId(id),
        getEquipmentUsagesByEquipmentId(id),
        getEquipmentAssignmentsByEquipmentId(id),
        getEquipmentSpecificationsByEquipmentId(id),
        getMediaByEquipmentId(id, "documents"),
    ]);
    return (
        <EquipmentDetail
            equipment={equipment}
            maintenances={maintenances as unknown as EquipmentMaintenance[] || []}
            usages={usages as unknown as EquipmentUsage[] || []}
            assignments={assignments as unknown as EquipmentAssignment[] || []}
            specifications={specifications as unknown as EquipmentSpecification[] || []}
            documents={documents as unknown as Media[] || []}
        />
    );
}
