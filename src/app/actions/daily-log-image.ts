"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogImage, DailyLogImageInsert, DailyLogImageUpdate } from "@/types/daily-log-image";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getDailyLogImages = async (businessId: string): Promise<DailyLogImage[]> => {
    const { data, error } = await fetchByBusiness("daily_log_images", businessId);

    if (error) {
        console.error("Error fetching daily log images:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as DailyLogImage[];
    }

    return data as unknown as DailyLogImage[];
};

export const getDailyLogImageById = async (businessId: string, id: string): Promise<DailyLogImage | null> => {
    const { data, error } = await fetchByBusiness("daily_log_images", businessId, "*", {
        filter: { id: id }
    });

    if (error) {
        console.error("Error fetching daily log image by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as DailyLogImage;
    }

    return null;
};

export const createDailyLogImage = async (businessId: string, image: DailyLogImageInsert): Promise<DailyLogImage | null> => {
    image = await applyCreated<DailyLogImageInsert>(image);

    const { data, error } = await insertWithBusiness("daily_log_images", image, businessId);

    if (error) {
        console.error("Error creating daily log image:", error);
        return null;
    }

    return data as unknown as DailyLogImage;
};

export const updateDailyLogImage = async (businessId: string, id: string, image: DailyLogImageUpdate): Promise<DailyLogImage | null> => {
    image = await applyUpdated<DailyLogImageUpdate>(image);

    const { data, error } = await updateWithBusinessCheck("daily_log_images", id, image, businessId);

    if (error) {
        console.error("Error updating daily log image:", error);
        return null;
    }

    return data as unknown as DailyLogImage;
};

export const deleteDailyLogImage = async (businessId: string, id: string): Promise<boolean> => {
    const { error } = await deleteWithBusinessCheck("daily_log_images", id, businessId);

    if (error) {
        console.error("Error deleting daily log image:", error);
        return false;
    }

    return true;
};

export const searchDailyLogImages = async (businessId: string, query: string): Promise<DailyLogImage[]> => {
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
