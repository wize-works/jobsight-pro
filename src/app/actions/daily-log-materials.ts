"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogMaterial, DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusiness } from "@/lib/auth/with-business";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getDailyLogMaterials = async (): Promise<DailyLogMaterial[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_log_materials", business.id);

    if (error) {
        console.error("Error fetching daily log materials:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as DailyLogMaterial[];
    }

    return data as unknown as DailyLogMaterial[];
}

export const getDailyLogMaterialById = async (id: string): Promise<DailyLogMaterial | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_log_materials", business.id, "*", {
        filter: { id: id }
    });

    if (error) {
        console.error("Error fetching daily log material by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as DailyLogMaterial;
    }

    return null;
};

export const createDailyLogMaterial = async (material: DailyLogMaterialInsert): Promise<DailyLogMaterial | null> => {
    const { business } = await withBusinessServer();

    material = await applyCreated<DailyLogMaterialInsert>(material);

    const { data, error } = await insertWithBusiness("daily_log_materials", material, business.id);

    if (error) {
        console.error("Error creating daily log material:", error);
        return null;
    }

    return data as unknown as DailyLogMaterial;
}

export const updateDailyLogMaterial = async (id: string, material: DailyLogMaterialUpdate): Promise<DailyLogMaterial | null> => {
    const { business } = await withBusinessServer();

    material = await applyUpdated<DailyLogMaterialUpdate>(material);

    const { data, error } = await updateWithBusinessCheck("daily_log_materials", id, material, business.id);

    if (error) {
        console.error("Error updating daily log material:", error);
        return null;
    }

    return data as unknown as DailyLogMaterial;
}

export const deleteDailyLogMaterial = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("daily_log_materials", id, business.id);

    if (error) {
        console.error("Error deleting daily log material:", error);
        return false;
    }

    return true;
}

export const searchDailyLogMaterials = async (query: string): Promise<DailyLogMaterial[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_log_materials", business.id, "*", {
        filter: {
            or: [
                { material_name: { ilike: `%${query}%` } },
                { notes: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching daily log materials:", error);
        return [];
    }

    return data as unknown as DailyLogMaterial[];
};
