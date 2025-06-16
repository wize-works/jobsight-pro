"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { MediaMetadata, MediaMetadataInsert, MediaMetadataUpdate } from "@/types/media-metadata";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";


export const getMediaMetadatas = async (businessId: string): Promise<MediaMetadata[]> => {


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

export const getMediaMetadataById = async (businessId: string, id: string): Promise<MediaMetadata | null> => {


    const { data, error } = await fetchByBusiness("media_metadata", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching media metadata by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as MediaMetadata;
    }

    return null;
};

export const createMediaMetadata = async (businessId: string, metadata: MediaMetadataInsert): Promise<MediaMetadata | null> => {


    metadata = await applyCreated<MediaMetadataInsert>(metadata);

    const { data, error } = await insertWithBusiness("media_metadata", metadata, businessId);

    if (error) {
        console.error("Error creating media metadata:", error);
        return null;
    }

    return data as unknown as MediaMetadata;
}

export const updateMediaMetadata = async (businessId: string, id: string, metadata: MediaMetadataUpdate): Promise<MediaMetadata | null> => {


    metadata = await applyUpdated<MediaMetadataUpdate>(metadata);

    const { data, error } = await updateWithBusinessCheck("media_metadata", id, metadata, businessId);

    if (error) {
        console.error("Error updating media metadata:", error);
        return null;
    }

    return data as unknown as MediaMetadata;
}

export const deleteMediaMetadata = async (businessId: string, id: string): Promise<boolean> => {


    const { error } = await deleteWithBusinessCheck("media_metadata", id, businessId);

    if (error) {
        console.error("Error deleting media metadata:", error);
        return false;
    }

    return true;
}

export const searchMediaMetadatas = async (businessId: string, query: string): Promise<MediaMetadata[]> => {


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
