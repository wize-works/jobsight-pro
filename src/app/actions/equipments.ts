"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Equipment, EquipmentInsert, EquipmentStatus, EquipmentUpdate } from "@/types/equipment";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { triggerEquipmentNotification } from "@/lib/push/notification-triggers";

export const getEquipments = async (): Promise<Equipment[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("equipment", business.id);

    if (error) {
        console.error("Error fetching equipments:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Equipment[];
    }

    return data as unknown as Equipment[];
}

export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("equipment", business.id, "*", {
        filter: { id: id },
    });

    if (error) {
        console.error("Error fetching equipment by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as Equipment;
    }

    return null;
};

export const createEquipment = async (equipment: EquipmentInsert): Promise<Equipment | null> => {
    const { business } = await withBusinessServer();

    equipment = await applyCreated<EquipmentInsert>(equipment);

    const { data, error } = await insertWithBusiness("equipment", equipment, business.id);

    if (error) {
        console.error("Error creating equipment:", error);
        return null;
    }

    return data as unknown as Equipment;
}

export const updateEquipment = async (id: string, equipment: EquipmentUpdate): Promise<Equipment | null> => {
    const { business } = await withBusinessServer();

    equipment = await applyUpdated<EquipmentUpdate>(equipment);

    const { data, error } = await updateWithBusinessCheck("equipment", id, equipment, business.id);

    if (error) {
        console.error("Error updating equipment:", error);
        return null;
    }

    return data as unknown as Equipment;
}

export const deleteEquipment = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("equipment", id, business.id);

    if (error) {
        console.error("Error deleting equipment:", error);
        return false;
    }

    return true;
}

export const searchEquipments = async (query: string): Promise<Equipment[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("equipment", business.id, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { description: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error searching equipments:", error);
        return [];
    }

    return data as unknown as Equipment[];
};

export const setEquipmentStatus = async (id: string, status: EquipmentStatus): Promise<Equipment | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await updateWithBusinessCheck("equipment", id, { status } as EquipmentUpdate, business.id);

    if (error) {
        console.error("Error setting equipment status:", error);
        return null;
    }

    return data as unknown as Equipment;
}

export const setEquipmentLocation = async (equipment: EquipmentUpdate): Promise<Equipment | null> => {
    const { business } = await withBusinessServer();

    equipment = await applyUpdated<EquipmentUpdate>(equipment);

    const { data, error } = await updateWithBusinessCheck("equipment", equipment.id, equipment, business.id);

    if (error) {
        console.error("Error setting equipment location:", error);
        return null;
    }

    return data as unknown as Equipment;
}
