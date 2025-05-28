"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { EquipmentMaintenance, EquipmentMaintenanceInsert, EquipmentMaintenanceUpdate } from "@/types/equipment-maintenance";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getEquipmentMaintenances = async (): Promise<EquipmentMaintenance[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("equipment_maintenance", business.id);

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
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("equipment_maintenance", business.id, "*", {
        filter: { id: id },
        orderBy: { column: "created_at", ascending: false },
    });

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
    const { business } = await withBusinessServer();

    maintenance = await applyCreated<EquipmentMaintenanceInsert>(maintenance);

    const { data, error } = await insertWithBusiness("equipment_maintenance", maintenance, business.id);

    if (error) {
        console.error("Error creating equipment maintenance:", error);
        return null;
    }

    return data as unknown as EquipmentMaintenance;
}

export const updateEquipmentMaintenance = async (id: string, maintenance: EquipmentMaintenanceUpdate): Promise<EquipmentMaintenance | null> => {
    const { business } = await withBusinessServer();

    maintenance = await applyUpdated<EquipmentMaintenanceUpdate>(maintenance);

    const { data, error } = await updateWithBusinessCheck("equipment_maintenance", id, maintenance, business.id);

    if (error) {
        console.error("Error updating equipment maintenance:", error);
        return null;
    }

    return data as unknown as EquipmentMaintenance;
}

export const deleteEquipmentMaintenance = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("equipment_maintenance", id, business.id);

    if (error) {
        console.error("Error deleting equipment maintenance:", error);
        return false;
    }

    return true;
}

export const searchEquipmentMaintenances = async (query: string): Promise<EquipmentMaintenance[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("equipment_maintenance", business.id, "*", {
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

export const getEquipmentMaintenancesByEquipmentId = async (id: string): Promise<EquipmentMaintenance[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("equipment_maintenance", business.id, "*", {
        filter: { equipment_id: id },
        orderBy: { column: "created_at", ascending: false },
    });
    console.log("Fetched equipment maintenances:", data);
    if (error) {
        console.error("Error fetching equipment maintenance by ID:", error);
        return [];
    }
    if (!data || data.length === 0) {
        return [] as EquipmentMaintenance[];
    }
    console.log("Equipment maintenances data:", data);
    return data as unknown as EquipmentMaintenance[];
};