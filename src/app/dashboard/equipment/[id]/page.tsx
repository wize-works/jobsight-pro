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
    const id = (await params).id;

    try {
        console.log("Fetching equipment by ID:", id);
        const equipment = await getEquipmentById(id);
        if (!equipment) {
            return <div className="p-8 text-center">Equipment not found.</div>;
        }
        console.log("Equipment found:", equipment.name);

        // Fetch all related records with individual error handling
        let maintenances: EquipmentMaintenance[] = [];
        let usages: any[] = [];
        let assignments: any[] = [];
        let specifications: EquipmentSpecification[] = [];
        let documents: any[] = [];

        try {
            console.log("Fetching maintenances...");
            maintenances = await getEquipmentMaintenancesByEquipmentId(id);
            console.log("Maintenances fetched:", maintenances.length);
        } catch (error) {
            console.error("Error fetching maintenances:", error);
        }

        try {
            console.log("Fetching usages...");
            usages = await getEquipmentUsagesWithDetailsByEquipmentId(id);
            console.log("Usages fetched:", usages.length);
        } catch (error) {
            console.error("Error fetching usages:", error);
        }

        try {
            console.log("Fetching assignments...");
            assignments = await getEquipmentAssignmentsByEquipmentId(id);
            console.log("Assignments fetched:", assignments.length);
        } catch (error) {
            console.error("Error fetching assignments:", error);
        }

        try {
            console.log("Fetching specifications...");
            specifications = await getEquipmentSpecificationsByEquipmentId(id);
            console.log("Specifications fetched:", specifications.length);
        } catch (error) {
            console.error("Error fetching specifications:", error);
        }

        try {
            console.log("Fetching documents...");
            documents = await getMediaByEquipmentId(id, "");
            console.log("Documents fetched:", documents.length);
        } catch (error) {
            console.error("Error fetching documents:", error);
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