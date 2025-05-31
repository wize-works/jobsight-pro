"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { MediaMetadata, MediaMetadataInsert, MediaMetadataUpdate } from "@/types/media-metadata";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getMediaMetadatas = async (): Promise<MediaMetadata[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("media_metadata", business.id);

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
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("media_metadata", business.id, "*", { filter: { id: id } });

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
    const { business } = await withBusinessServer();

    metadata = await applyCreated<MediaMetadataInsert>(metadata);

    const { data, error } = await insertWithBusiness("media_metadata", metadata, business.id);

    if (error) {
        console.error("Error creating media metadata:", error);
        return null;
    }

    return data as unknown as MediaMetadata;
}

export const updateMediaMetadata = async (id: string, metadata: MediaMetadataUpdate): Promise<MediaMetadata | null> => {
    const { business } = await withBusinessServer();

    metadata = await applyUpdated<MediaMetadataUpdate>(metadata);

    const { data, error } = await updateWithBusinessCheck("media_metadata", id, metadata, business.id);

    if (error) {
        console.error("Error updating media metadata:", error);
        return null;
    }

    return data as unknown as MediaMetadata;
}

export const deleteMediaMetadata = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("media_metadata", id, business.id);

    if (error) {
        console.error("Error deleting media metadata:", error);
        return false;
    }

    return true;
}

export const searchMediaMetadatas = async (query: string): Promise<MediaMetadata[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("media_metadata", business.id, "*", {
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
