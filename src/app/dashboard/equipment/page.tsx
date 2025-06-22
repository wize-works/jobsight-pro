"use client";

import EquipmentList from "./components/list";
import { getEquipments } from "@/app/actions/equipments";
import EquipmentListLoading from "./loading";
import { useBusiness } from "@/lib/business-context";
import { Equipment } from "@/types/equipment";
import { useEffect, useState } from "react";

export default function EquipmentPage() {
    const { businessId, loading } = useBusiness();
    const [isLoading, setIsLoading] = useState(true);
    const [equipment, setEquipment] = useState<Equipment[]>([]);

    useEffect(() => {
        if (!businessId) {
            return;
        }

        const fetchData = async () => {
            try {
                const initialEquipment = await getEquipments(businessId);
                setEquipment(initialEquipment);
            }
            catch (error) {
                console.error("Error fetching equipments:", error);
            }
            finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [businessId]);
    if (loading || isLoading) {
        return <EquipmentListLoading />;
    }


    return (
        <div>
            <EquipmentList initialEquipments={equipment} />
        </div>
    );
}
