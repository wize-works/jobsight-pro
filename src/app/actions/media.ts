"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Media, MediaInsert, MediaType, MediaUpdate } from "@/types/media";
import { MediaLink } from "@/types/media_links";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    SASProtocol,
} from '@azure/storage-blob';
import { createServerClient } from "@/lib/supabase";

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

    const { data, error } = await fetchByBusiness("media", business.id, "*", { filter: { id: id } });

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

export const getMediaByProjectId = async (projectId: string, type: string): Promise<Media[]> => {
    const { business } = await withBusinessServer();

    const { data: linkData, error: linkError } = await fetchByBusiness("media_links", business.id, "*", {
        filter: { linked_id: projectId, linked_type: "project" },
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

export const linkMediaToEquipment = async (mediaId: string, equipmentId: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Check if link already exists
        const { data: existingLinks } = await fetchByBusiness("media_links", business.id, "*", {
            filter: {
                media_id: mediaId,
                linked_id: equipmentId,
                linked_type: "equipment"
            }
        });

        if (existingLinks && existingLinks.length > 0) {
            console.log("Media already linked to equipment");
            return true;
        }

        // Create new link using insertWithBusiness
        const newLink = {
            media_id: mediaId,
            linked_id: equipmentId,
            linked_type: "equipment"
        };

        const { data, error } = await insertWithBusiness("media_links", newLink, business.id, {
            userId: userId
        });

        if (error) {
            console.error("Error linking media to equipment:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error linking media to equipment:", error);
        return false;
    }
};

export const setEquipmentPrimaryImage = async (equipmentId: string, mediaId: string): Promise<boolean> => {
    try {
        const { business } = await withBusinessServer();

        // Get the media item to get its URL
        const { data: mediaData } = await fetchByBusiness("media", business.id, "*", {
            filter: { id: mediaId }
        });

        if (!mediaData || mediaData.length === 0) {
            console.error("Media not found");
            return false;
        }

        const media = mediaData[0] as unknown as Media;

        // Update equipment with the new image URL
        const { error } = await updateWithBusinessCheck("equipment", equipmentId, {
            image_url: media.url
        }, business.id);

        if (error) {
            console.error("Error setting equipment primary image:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error setting equipment primary image:", error);
        return false;
    }
};

export const uploadEquipmentImage = async (equipmentId: string, file: File): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Generate upload URL
        const uploadData = await generateUploadUrl("images", file.name);
        if (!uploadData) {
            throw new Error("Failed to generate upload URL");
        }

        // Upload file to Azure Blob Storage
        const uploadResponse = await fetch(uploadData.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'x-ms-blob-type': 'BlockBlob',
                'Content-Type': file.type,
            },
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        // Create media record
        const mediaData: MediaInsert = {
            name: file.name,
            description: `Primary image for equipment`,
            type: "image",
            url: uploadData.fileUrl,
            file_name: uploadData.fileName,
            size: file.size
        };

        const media = await createMedia(mediaData);
        if (!media) {
            throw new Error("Failed to create media record");
        }

        // Link media to equipment
        await linkMediaToEquipment(media.id, equipmentId);

        // Set as primary image
        await setEquipmentPrimaryImage(equipmentId, media.id);

        return true;
    } catch (error) {
        console.error("Error uploading equipment image:", error);
        return false;
    }
};

export const unlinkMediaFromEquipment = async (mediaId: string, equipmentId: string): Promise<boolean> => {
    try {
        const { business } = await withBusinessServer();

        // Find the link to delete
        const { data: existingLinks } = await fetchByBusiness("media_links", business.id, "*", {
            filter: {
                media_id: mediaId,
                linked_id: equipmentId,
                linked_type: "equipment"
            }
        });

        if (!existingLinks || existingLinks.length === 0) {
            console.log("No media link found to remove");
            return true;
        }

        // Delete the link using deleteWithBusinessCheck
        const { error } = await deleteWithBusinessCheck("media_links", existingLinks[0].id, business.id);

        if (error) {
            console.error("Error unlinking media from equipment:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error unlinking media from equipment:", error);
        return false;
    }
};

const account = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;
const endpoint = process.env.AZURE_STORAGE_ENDPOINT;

const credentials = new StorageSharedKeyCredential(account || "", accountKey || "");
const blobServiceClient = new BlobServiceClient(endpoint || "", credentials);

export async function generateUploadUrl(type: MediaType, filename: string): Promise<{ uploadUrl: string; fileUrl: string; fileName: string } | null> {
    const { business } = await withBusinessServer();

    const timestamp = Date.now();
    const safeFilename = `${timestamp}-${filename.replace(/[^a-zA-Z0-9_.-]/g, "_").toLowerCase()}`;
    const blobName = `${timestamp}=${safeFilename}`;

    const containerClient = blobServiceClient.getContainerClient(type);
    const blobClient = containerClient.getBlockBlobClient(blobName);

    const startsOn = new Date(Date.now() - 2 * 60 * 1000);
    const expiresOn = new Date(Date.now() + 10 * 60 * 1000);

    const sas = generateBlobSASQueryParameters({
        containerName: type,
        blobName: blobName,
        permissions: BlobSASPermissions.parse("wd"),
        startsOn: startsOn,
        expiresOn: expiresOn,
        protocol: SASProtocol.Https,
    }, credentials).toString();

    const uploadUrl = `${blobClient.url}?${sas}`;
    const fileUrl = blobClient.url;

    return {
        uploadUrl,
        fileUrl,
        fileName: blobName,
    };
}