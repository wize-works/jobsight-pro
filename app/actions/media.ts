"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Media, MediaInsert, MediaUpdate } from "@/types/media";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getMedias = async (): Promise<Media[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch medias.");
        return [];
    }

    const { data, error } = await fetchByBusiness("media", businessId);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch medias.");
        return null;
    }

    const { data, error } = await fetchByBusiness("media", businessId, id);

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
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a media.");
        return null;
    }

    const { data, error } = await insertWithBusiness("media", media, businessId);

    if (error) {
        console.error("Error creating media:", error);
        return null;
    }

    return data as unknown as Media;
}

export const updateMedia = async (id: string, media: MediaUpdate): Promise<Media | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a media.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("media", id, media, businessId);

    if (error) {
        console.error("Error updating media:", error);
        return null;
    }

    return data as unknown as Media;
}

export const deleteMedia = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a media.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("media", id, businessId);

    if (error) {
        console.error("Error deleting media:", error);
        return false;
    }

    return true;
}

export const searchMedias = async (query: string): Promise<Media[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search medias.");
        return [];
    }

    const { data, error } = await fetchByBusiness("media", businessId, "*", {
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
