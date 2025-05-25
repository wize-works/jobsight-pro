"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { MediaTag, MediaTagInsert, MediaTagUpdate } from "@/types/media-tags";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getMediaTags = async (): Promise<MediaTag[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch media tags.");
        return [];
    }

    const { data, error } = await fetchByBusiness("media_tags", businessId);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch media tags.");
        return null;
    }

    const { data, error } = await fetchByBusiness("media_tags", businessId, id);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a media tag.");
        return null;
    }

    const { data, error } = await insertWithBusiness("media_tags", tag, businessId);

    if (error) {
        console.error("Error creating media tag:", error);
        return null;
    }

    return data as unknown as MediaTag;
}

export const updateMediaTag = async (id: string, tag: MediaTagUpdate): Promise<MediaTag | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a media tag.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("media_tags", id, tag, businessId);

    if (error) {
        console.error("Error updating media tag:", error);
        return null;
    }

    return data as unknown as MediaTag;
}

export const deleteMediaTag = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a media tag.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("media_tags", id, businessId);

    if (error) {
        console.error("Error deleting media tag:", error);
        return false;
    }

    return true;
}

export const searchMediaTags = async (query: string): Promise<MediaTag[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search media tags.");
        return [];
    }

    const { data, error } = await fetchByBusiness("media_tags", businessId, "*", {
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
