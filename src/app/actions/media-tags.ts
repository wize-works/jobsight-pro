"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { MediaTag, MediaTagInsert, MediaTagUpdate } from "@/types/media-tags";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { ensureBusinessOrRedirect } from "@/lib/auth/ensure-business";

export const getMediaTags = async (): Promise<MediaTag[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("media_tags", business.id);

    if (error) {
        console.error("Error fetching media tags:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as MediaTag[];
    }

    return data as unknown as MediaTag[];
}

export const getMediaTagById = async (id: string): Promise<MediaTag | null> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("media_tags", business.id, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching media tag by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as MediaTag;
    }

    return null;
};

export const createMediaTag = async (tag: MediaTagInsert): Promise<MediaTag | null> => {
    const { business } = await ensureBusinessOrRedirect();

    tag = await applyCreated<MediaTagInsert>(tag);

    const { data, error } = await insertWithBusiness("media_tags", tag, business.id);

    if (error) {
        console.error("Error creating media tag:", error);
        return null;
    }

    return data as unknown as MediaTag;
}

export const updateMediaTag = async (id: string, tag: MediaTagUpdate): Promise<MediaTag | null> => {
    const { business } = await ensureBusinessOrRedirect();

    tag = await applyUpdated<MediaTagUpdate>(tag);

    const { data, error } = await updateWithBusinessCheck("media_tags", id, tag, business.id);

    if (error) {
        console.error("Error updating media tag:", error);
        return null;
    }

    return data as unknown as MediaTag;
}

export const deleteMediaTag = async (id: string): Promise<boolean> => {
    const { business } = await ensureBusinessOrRedirect();

    const { error } = await deleteWithBusinessCheck("media_tags", id, business.id);

    if (error) {
        console.error("Error deleting media tag:", error);
        return false;
    }

    return true;
}

export const searchMediaTags = async (query: string): Promise<MediaTag[]> => {
    const { business } = await ensureBusinessOrRedirect();

    const { data, error } = await fetchByBusiness("media_tags", business.id, "*", {
        filter: {
            or: [
                { tag: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "tag", ascending: true },
    });

    if (error) {
        console.error("Error searching media tags:", error);
        return [];
    }

    return data as unknown as MediaTag[];
};
