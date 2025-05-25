"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentMaintenance, EquipmentMaintenanceInsert, EquipmentMaintenanceUpdate } from "@/types/equipment-maintenance";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getEquipmentMaintenances = async (): Promise<EquipmentMaintenance[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment maintenances.");
        return [];
    }

    const { data, error } = await fetchByBusiness("equipment_maintenance", businessId);

    if (error) {
        console.error("Error fetching equipment maintenances:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as EquipmentMaintenance[];
    }

    return data as unknown as EquipmentMaintenance[];
}

export const getEquipmentMaintenanceById = async (id: string): Promise<EquipmentMaintenance | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch equipment maintenances.");
        return null;
    }

    const { data, error } = await fetchByBusiness("equipment_maintenance", businessId, id);

    if (error) {
        console.error("Error fetching equipment maintenance by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as EquipmentMaintenance;
    }

    return null;
};

export const createEquipmentMaintenance = async (maintenance: EquipmentMaintenanceInsert): Promise<EquipmentMaintenance | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create an equipment maintenance.");
        return null;
    }

    const { data, error } = await insertWithBusiness("equipment_maintenance", maintenance, businessId);

    if (error) {
        console.error("Error creating equipment maintenance:", error);
        return null;
    }

    return data as unknown as EquipmentMaintenance;
}

export const updateEquipmentMaintenance = async (id: string, maintenance: EquipmentMaintenanceUpdate): Promise<EquipmentMaintenance | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update an equipment maintenance.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("equipment_maintenance", id, maintenance, businessId);

    if (error) {
        console.error("Error updating equipment maintenance:", error);
        return null;
    }

    return data as unknown as EquipmentMaintenance;
}

export const deleteEquipmentMaintenance = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete an equipment maintenance.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("equipment_maintenance", id, businessId);

    if (error) {
        console.error("Error deleting equipment maintenance:", error);
        return false;
    }

    return true;
}

export const searchEquipmentMaintenances = async (query: string): Promise<EquipmentMaintenance[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search equipment maintenances.");
        return [];
    }

    const { data, error } = await fetchByBusiness("equipment_maintenance", businessId, "*", {
        filter: {
            or: [
                { description: { ilike: `%${query}%` } },
                { maintenance_type: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching equipment maintenances:", error);
        return [];
    }

    return data as unknown as EquipmentMaintenance[];
};
