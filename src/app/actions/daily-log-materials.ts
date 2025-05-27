"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogMaterial, DailyLogMaterialInsert, DailyLogMaterialUpdate } from "@/types/daily-log-materials";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getDailyLogMaterials = async (): Promise<DailyLogMaterial[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch daily log materials.");
        return [];
    }

    const { data, error } = await fetchByBusiness("daily_log_materials", businessId);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch daily log materials.");
        return null;
    }

    const { data, error } = await fetchByBusiness("daily_log_materials", businessId, id);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a daily log material.");
        return null;
    }

    const { data, error } = await insertWithBusiness("daily_log_materials", material, businessId);

    if (error) {
        console.error("Error creating daily log material:", error);
        return null;
    }

    return data as unknown as DailyLogMaterial;
}

export const updateDailyLogMaterial = async (id: string, material: DailyLogMaterialUpdate): Promise<DailyLogMaterial | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a daily log material.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("daily_log_materials", id, material, businessId);

    if (error) {
        console.error("Error updating daily log material:", error);
        return null;
    }

    return data as unknown as DailyLogMaterial;
}

export const deleteDailyLogMaterial = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a daily log material.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("daily_log_materials", id, businessId);

    if (error) {
        console.error("Error deleting daily log material:", error);
        return false;
    }

    return true;
}

export const searchDailyLogMaterials = async (query: string): Promise<DailyLogMaterial[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search daily log materials.");
        return [];
    }

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

    return data as unknown as DailyLogMaterial[];
};
