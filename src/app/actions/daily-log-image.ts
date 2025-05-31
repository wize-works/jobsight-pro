"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLogImage, DailyLogImageInsert, DailyLogImageUpdate } from "@/types/daily-log-image";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getDailyLogImages = async (): Promise<DailyLogImage[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_log_images", business.id);

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
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_log_images", business.id, "*", {
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

export const createDailyLogImage = async (image: DailyLogImageInsert): Promise<DailyLogImage | null> => {
    const { business } = await withBusinessServer();

    image = await applyCreated<DailyLogImageInsert>(image);

    const { data, error } = await insertWithBusiness("daily_log_images", image, business.id);

    if (error) {
        console.error("Error creating daily log image:", error);
        return null;
    }

    return data as unknown as DailyLogImage;
}

export const updateDailyLogImage = async (id: string, image: DailyLogImageUpdate): Promise<DailyLogImage | null> => {
    const { business } = await withBusinessServer();

    image = await applyUpdated<DailyLogImageUpdate>(image);

    const { data, error } = await updateWithBusinessCheck("daily_log_images", id, image, business.id);

    if (error) {
        console.error("Error updating daily log image:", error);
        return null;
    }

    return data as unknown as DailyLogImage;
}

export const deleteDailyLogImage = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("daily_log_images", id, business.id);

    if (error) {
        console.error("Error deleting daily log image:", error);
        return false;
    }

    return true;
}

export const searchDailyLogImages = async (query: string): Promise<DailyLogImage[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_log_images", business.id, "*", {
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
