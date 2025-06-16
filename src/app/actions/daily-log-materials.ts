"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogMaterial, DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { withBusinessServer } from "@/lib/auth/with-business-server";

export const getDailyLogMaterials = async (businessId: string): Promise<DailyLogMaterial[]> => {


    const { data, error } = await fetchByBusiness("daily_log_materials", businessId);

    if (error) {
        console.error("Error fetching daily log materials:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}

export const getDailyLogMaterialById = async (businessId: string, id: string): Promise<DailyLogMaterial | null> => {


    const { data, error } = await fetchByBusiness("daily_log_materials", businessId, "*", {
        filter: { id: id }
    });

    if (error) {
        console.error("Error fetching daily log material by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0];
    }

    return null;
};

export const createDailyLogMaterial = async (businessId: string, material: DailyLogMaterialInsert): Promise<DailyLogMaterial | null> => {


    material = await applyCreated<DailyLogMaterialInsert>(material);

    const { data, error } = await insertWithBusiness("daily_log_materials", material, businessId);

    if (error) {
        console.error("Error creating daily log material:", error);
        return null;
    }

    return data;
}

export const updateDailyLogMaterial = async (businessId: string, id: string, material: DailyLogMaterialUpdate): Promise<DailyLogMaterial | null> => {


    material = await applyUpdated<DailyLogMaterialUpdate>(material);

    const { data, error } = await updateWithBusinessCheck("daily_log_materials", id, material, businessId);

    if (error) {
        console.error("Error updating daily log material:", error);
        return null;
    }

    return data;
}

export const deleteDailyLogMaterial = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("daily_log_materials", id, businessId);

    if (error) {
        console.error("Error deleting daily log material:", error);
        return false;
    }

    return true;
}

export const searchDailyLogMaterials = async (businessId: string, query: string): Promise<DailyLogMaterial[]> => {


    const { data, error } = await fetchByBusiness("daily_log_materials", businessId, "*", {
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

    return data as DailyLogMaterial[];
};

export const getDailyLogMaterialsWithDetailsByLogId = async (businessId: string, id: string): Promise<DailyLogMaterial[]> => {


    const { data, error } = await fetchByBusiness("daily_log_materials", businessId, "*", {
        filter: { daily_log_id: id },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching daily log materials:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    return data;
}