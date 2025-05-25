"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogImage, DailyLogImageInsert, DailyLogImageUpdate } from "@/types/daily-log-image";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getDailyLogImages = async (): Promise<DailyLogImage[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch daily log images.");
        return [];
    }

    const { data, error } = await fetchByBusiness("daily_log_images", businessId);

    if (error) {
        console.error("Error fetching daily log images:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as DailyLogImage[];
    }

    return data as unknown as DailyLogImage[];
}

export const getDailyLogImageById = async (id: string): Promise<DailyLogImage | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch daily log images.");
        return null;
    }

    const { data, error } = await fetchByBusiness("daily_log_images", businessId, id);

    if (error) {
        console.error("Error fetching daily log image by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as DailyLogImage;
    }

    return null;
};

export const createDailyLogImage = async (image: DailyLogImageInsert): Promise<DailyLogImage | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a daily log image.");
        return null;
    }

    const { data, error } = await insertWithBusiness("daily_log_images", image, businessId);

    if (error) {
        console.error("Error creating daily log image:", error);
        return null;
    }

    return data as unknown as DailyLogImage;
}

export const updateDailyLogImage = async (id: string, image: DailyLogImageUpdate): Promise<DailyLogImage | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a daily log image.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("daily_log_images", id, image, businessId);

    if (error) {
        console.error("Error updating daily log image:", error);
        return null;
    }

    return data as unknown as DailyLogImage;
}

export const deleteDailyLogImage = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a daily log image.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("daily_log_images", id, businessId);

    if (error) {
        console.error("Error deleting daily log image:", error);
        return false;
    }

    return true;
}

export const searchDailyLogImages = async (query: string): Promise<DailyLogImage[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search daily log images.");
        return [];
    }

    const { data, error } = await fetchByBusiness("daily_log_images", businessId, "*", {
        filter: {
            or: [
                { image_url: { ilike: `%${query}%` } },
                { caption: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching daily log images:", error);
        return [];
    }

    return data as unknown as DailyLogImage[];
};
