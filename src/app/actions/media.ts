"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Media, MediaInsert, MediaUpdate } from "@/types/media";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { MediaLink } from "@/types/media_links";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getMedias = async (): Promise<Media[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("media", business.id);

    if (error) {
        console.error("Error fetching medias:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Media[];
    }

    return data as unknown as Media[];
}

export const getMediaById = async (id: string): Promise<Media | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("media", business.id, id);

    if (error) {
        console.error("Error fetching media by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as Media;
    }

    return null;
};

export const createMedia = async (media: MediaInsert): Promise<Media | null> => {
    const { business } = await withBusinessServer();

    media = await applyCreated<MediaInsert>(media);

    const { data, error } = await insertWithBusiness("media", media, business.id);

    if (error) {
        console.error("Error creating media:", error);
        return null;
    }

    return data as unknown as Media;
}

export const updateMedia = async (id: string, media: MediaUpdate): Promise<Media | null> => {
    const { business } = await withBusinessServer();

    media = await applyUpdated<MediaUpdate>(media);

    const { data, error } = await updateWithBusinessCheck("media", id, media, business.id);

    if (error) {
        console.error("Error updating media:", error);
        return null;
    }

    return data as unknown as Media;
}

export const deleteMedia = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("media", id, business.id);

    if (error) {
        console.error("Error deleting media:", error);
        return false;
    }

    return true;
}

export const searchMedias = async (query: string): Promise<Media[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("media", business.id, "*", {
        filter: {
            or: [
                { name: { ilike: `%${query}%` } },
                { description: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "name", ascending: true },
    });

    if (error) {
        console.error("Error searching medias:", error);
        return [];
    }

    return data as unknown as Media[];
};

export const getMediaByEquipmentId = async (equipmentId: string, type: string): Promise<Media[]> => {
    const { business } = await withBusinessServer();

    const { data: linkData, error: linkError } = await fetchByBusiness("media_links", business.id, "*", {
        filter: { linked_id: equipmentId, linked_type: "equipment" },
        orderBy: { column: "created_at", ascending: false },
    });

    if (linkError) {
        console.error("Error fetching media links by equipment ID:", linkError);
        return [];
    }

    const mediaIds = (linkData as unknown as MediaLink[]).map((link: { media_id: string }) => link.media_id);

    const { data, error } = await fetchByBusiness("media", business.id, "*", {
        filter: { id: { in: mediaIds }, type: type },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching medias by equipment ID:", error);
        return [];
    }

    return data as unknown as Media[];
}