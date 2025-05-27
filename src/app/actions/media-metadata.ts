"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { MediaMetadata, MediaMetadataInsert, MediaMetadataUpdate } from "@/types/media-metadata";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getMediaMetadatas = async (): Promise<MediaMetadata[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch media metadatas.");
        return [];
    }

    const { data, error } = await fetchByBusiness("media_metadata", businessId);

    if (error) {
        console.error("Error fetching media metadatas:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as MediaMetadata[];
    }

    return data as unknown as MediaMetadata[];
}

export const getMediaMetadataById = async (id: string): Promise<MediaMetadata | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch media metadatas.");
        return null;
    }

    const { data, error } = await fetchByBusiness("media_metadata", businessId, id);

    if (error) {
        console.error("Error fetching media metadata by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as MediaMetadata;
    }

    return null;
};

export const createMediaMetadata = async (metadata: MediaMetadataInsert): Promise<MediaMetadata | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a media metadata.");
        return null;
    }

    const { data, error } = await insertWithBusiness("media_metadata", metadata, businessId);

    if (error) {
        console.error("Error creating media metadata:", error);
        return null;
    }

    return data as unknown as MediaMetadata;
}

export const updateMediaMetadata = async (id: string, metadata: MediaMetadataUpdate): Promise<MediaMetadata | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a media metadata.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("media_metadata", id, metadata, businessId);

    if (error) {
        console.error("Error updating media metadata:", error);
        return null;
    }

    return data as unknown as MediaMetadata;
}

export const deleteMediaMetadata = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a media metadata.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("media_metadata", id, businessId);

    if (error) {
        console.error("Error deleting media metadata:", error);
        return false;
    }

    return true;
}

export const searchMediaMetadatas = async (query: string): Promise<MediaMetadata[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search media metadatas.");
        return [];
    }

    const { data, error } = await fetchByBusiness("media_metadata", businessId, "*", {
        filter: {
            or: [
                { key: { ilike: `%${query}%` } },
                { value: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "key", ascending: true },
    });

    if (error) {
        console.error("Error searching media metadatas:", error);
        return [];
    }

    return data as unknown as MediaMetadata[];
};
