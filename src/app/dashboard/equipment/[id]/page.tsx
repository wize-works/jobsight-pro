import { getEquipmentById } from "@/app/actions/equipments";
import { getEquipmentMaintenancesByEquipmentId } from "@/app/actions/equipment-maintenance";
import { getEquipmentUsagesWithDetailsByEquipmentId } from "@/app/actions/equipment_usage";
import { getEquipmentAssignmentsByEquipmentId } from "@/app/actions/equipment-assignments";
import { getEquipmentSpecificationsByEquipmentId } from "@/app/actions/equipment-specifications";
import { getMediaByEquipmentId } from "@/app/actions/media";
import EquipmentDetail from "../components/detail";
import { EquipmentMaintenance } from "@/types/equipment-maintenance";
import { EquipmentUsage } from "@/types/equipment_usage";
import { EquipmentAssignment } from "@/types/equipment-assignments";
import { EquipmentSpecification } from "@/types/equipment-specifications";
import { Media } from "@/types/media";

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {

        const [equipment, maintenances, usages, assignments, specifications, documents] = await Promise.all([
            getEquipmentById(id),
            getEquipmentMaintenancesByEquipmentId(id),
            getEquipmentUsagesWithDetailsByEquipmentId(id),
            getEquipmentAssignmentsByEquipmentId(id),
            getEquipmentSpecificationsByEquipmentId(id),
            getMediaByEquipmentId(id, "")
        ]);

        if (!equipment) {
            return (
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-red-500 mb-4">Equipment Not Found</h2>
                    <p className="text-gray-600">The requested equipment could not be found.</p>
                </div>
            );
        }

        return (
            <EquipmentDetail
                equipment={equipment}
                maintenances={maintenances}
                usages={usages}
                assignments={assignments}
                specifications={specifications}
                documents={documents}
            />
        );
    } catch (error) {
        console.error("Equipment detail page error:", error);
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-500 mb-4">Error Loading Equipment</h2>
                <p className="text-gray-600">There was an error loading the equipment details. Please check the console for more information.</p>
                <pre className="text-left bg-gray-100 p-4 mt-4 text-sm overflow-x-auto">
                    {error instanceof Error ? error.message : 'Unknown error'}
                </pre>
            </div>
        );
    }
}