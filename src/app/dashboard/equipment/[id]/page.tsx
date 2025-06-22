"use client";
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
import { useBusiness } from "@/lib/business-context";
import { useEffect, useState } from "react";
import { Equipment } from "@/types/equipment";
import EquipmentDetailLoading from "./loading";

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [maintenances, setMaintenances] = useState<EquipmentMaintenance[]>([]);
    const [usages, setUsages] = useState<EquipmentUsage[]>([]);
    const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
    const [specifications, setSpecifications] = useState<EquipmentSpecification[]>([]);
    const [media, setMedia] = useState<Media[]>([]);

    useEffect(() => {
        if (!businessId) {
            return;
        }
        const fetchData = async () => {
            try {
                setLoading(true);
                const { id } = await params;

                const [equipmentData, maintenancesData, usagesData, assignmentsData, specificationsData, mediaData] = await Promise.all([
                    getEquipmentById(businessId, id),
                    getEquipmentMaintenancesByEquipmentId(businessId, id),
                    getEquipmentUsagesWithDetailsByEquipmentId(businessId, id),
                    getEquipmentAssignmentsByEquipmentId(businessId, id),
                    getEquipmentSpecificationsByEquipmentId(businessId, id),
                    getMediaByEquipmentId(businessId, id, "")
                ]);
                setEquipment(equipmentData);
                setMaintenances(maintenancesData);
                setUsages(usagesData);
                setAssignments(assignmentsData);
                setSpecifications(specificationsData);
                setMedia(mediaData);

            } catch (error) {
                console.error("Error fetching equipment details:", error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [businessId, params]);

    if (loading) {
        return <EquipmentDetailLoading />;
    }

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
            documents={media}
        />
    );
}