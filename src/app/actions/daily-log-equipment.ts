"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogEquipment, DailyLogEquipmentInsert, DailyLogEquipmentUpdate } from "@/types/daily-log-equipment";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getDailyLogEquipments = async (): Promise<DailyLogEquipment[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_log_equipment", business.id);

    if (error) {
        console.error("Error fetching daily log equipments:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as DailyLogEquipment[];
    }

    return data as unknown as DailyLogEquipment[];
}

export const getDailyLogEquipmentById = async (id: string): Promise<DailyLogEquipment | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_log_equipment", business.id, id);

    if (error) {
        console.error("Error fetching daily log equipment by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as DailyLogEquipment;
    }

    return null;
};

export const createDailyLogEquipment = async (equipment: DailyLogEquipmentInsert): Promise<DailyLogEquipment | null> => {
    const { business } = await withBusinessServer();

    equipment = await applyCreated<DailyLogEquipmentInsert>(equipment);

    const { data, error } = await insertWithBusiness("daily_log_equipment", equipment, business.id);

    if (error) {
        console.error("Error creating daily log equipment:", error);
        return null;
    }

    return data as unknown as DailyLogEquipment;
}

export const updateDailyLogEquipment = async (id: string, equipment: DailyLogEquipmentUpdate): Promise<DailyLogEquipment | null> => {
    const { business } = await withBusinessServer();

    equipment = await applyUpdated<DailyLogEquipmentUpdate>(equipment);

    const { data, error } = await updateWithBusinessCheck("daily_log_equipment", id, equipment, business.id);

    if (error) {
        console.error("Error updating daily log equipment:", error);
        return null;
    }

    return data as unknown as DailyLogEquipment;
}

export const deleteDailyLogEquipment = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("daily_log_equipment", id, business.id);

    if (error) {
        console.error("Error deleting daily log equipment:", error);
        return false;
    }

    return true;
}

export const searchDailyLogEquipments = async (query: string): Promise<DailyLogEquipment[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_log_equipment", business.id, "*", {
        filter: {
            or: [
                { equipment_id: { ilike: `%${query}%` } },
                { notes: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching daily log equipments:", error);
        return [];
    }

    return data as unknown as DailyLogEquipment[];
};
