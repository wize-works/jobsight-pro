"use server";

import { withBusinessServer } from "@/lib/auth/with-business-server";
import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { ClientUpdate } from "@/types/clients";
import { EquipmentUpdate } from "@/types/equipment";
import { Media, MediaInsert, MediaType, MediaUpdate } from "@/types/media";
import { MediaLink, MediaLinkInsert } from "@/types/media_links";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    SASProtocol,
} from '@azure/storage-blob';


const account = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;
const endpoint = process.env.AZURE_STORAGE_ENDPOINT;

const credentials = new StorageSharedKeyCredential(account || "", accountKey || "");
const blobServiceClient = new BlobServiceClient(endpoint || "", credentials);

export async function generateUploadUrl(type: MediaType, filename: string): Promise<{ uploadUrl: string; fileUrl: string; fileName: string } | null> {

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

export const getMedias = async (businessId: string): Promise<Media[]> => {
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

export const getMediaById = async (businessId: string, id: string): Promise<Media | null> => {
    const { data, error } = await fetchByBusiness("media", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching media by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as Media;
    }

    return null;
};

export const createMedia = async (businessId: string, media: MediaInsert): Promise<Media | null> => {


    media = await applyCreated<MediaInsert>(media);

    const { data, error } = await insertWithBusiness("media", media, businessId);

    if (error) {
        console.error("Error creating media:", error);
        return null;
    }

    return data as unknown as Media;
}

export const updateMedia = async (businessId: string, id: string, media: MediaUpdate): Promise<Media | null> => {


    media = await applyUpdated<MediaUpdate>(media);

    const { data, error } = await updateWithBusinessCheck("media", id, media, businessId);

    if (error) {
        console.error("Error updating media:", error);
        return null;
    }

    return data as unknown as Media;
}

export const deleteMedia = async (businessId: string, id: string): Promise<boolean> => {
    const { error } = await deleteWithBusinessCheck("media", id, businessId);

    if (error) {
        console.error("Error deleting media:", error);
        return false;
    }

    return true;
}

export const searchMedias = async (businessId: string, query: string): Promise<Media[]> => {


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

export const getMediaByEquipmentId = async (businessId: string, equipmentId: string, type: string): Promise<Media[]> => {


    const { data: linkData, error: linkError } = await fetchByBusiness("media_links", businessId, "*", {
        filter: { linked_id: equipmentId, linked_type: "equipment" },
        orderBy: { column: "created_at", ascending: false },
    });

    if (linkError) {
        console.error("Error fetching media links by equipment ID:", linkError);
        return [];
    }

    if (!linkData || linkData.length === 0) {
        return [];
    }

    const mediaIds = (linkData as unknown as MediaLink[]).map((link: { media_id: string }) => link.media_id).filter(Boolean);

    if (mediaIds.length === 0) {
        return [];
    }
    // Build filter object dynamically
    const filter: any = { id: { in: mediaIds } };
    if (type && type.trim() !== "") {
        filter.type = type;
    }

    const { data, error } = await fetchByBusiness("media", businessId, "*", {
        filter,
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching medias by equipment ID:", error);
        return [];
    }

    return data as unknown as Media[];
}

export const getMediaByProjectId = async (businessId: string, projectId: string, type: string): Promise<Media[]> => {


    const { data: linkData, error: linkError } = await fetchByBusiness("media_links", businessId, "*", {
        filter: { linked_id: projectId, linked_type: "project" },
        orderBy: { column: "created_at", ascending: false },
    });

    if (linkError) {
        console.error("Error fetching media links by equipment ID:", linkError);
        return [];
    }

    if (!linkData || linkData.length === 0) {
        return [];
    }

    const mediaIds = (linkData as unknown as MediaLink[]).map((link: { media_id: string }) => link.media_id).filter(Boolean);

    if (mediaIds.length === 0) {
        return [];
    }

    const { data, error } = await fetchByBusiness("media", businessId, "*", {
        filter: { id: { in: mediaIds }, type: type },
        orderBy: { column: "created_at", ascending: false },
    });

    if (error) {
        console.error("Error fetching medias by equipment ID:", error);
        return [];
    }

    return data as unknown as Media[];
}

export const linkMediaToEquipment = async (businessId: string, mediaId: string, equipmentId: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Check if link already exists
        const { data: existingLinks } = await fetchByBusiness("media_links", businessId, "*", {
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
        let newLink = {
            media_id: mediaId,
            linked_id: equipmentId,
            linked_type: "equipment"
        };

        newLink = await applyCreated<MediaLink>(newLink);


        const { data, error } = await insertWithBusiness("media_links", newLink as MediaLinkInsert, businessId, {
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

export const setEquipmentPrimaryImage = async (businessId: string, equipmentId: string, mediaId: string): Promise<boolean> => {
    try {


        // Get the media item to get its URL
        const { data: mediaData } = await fetchByBusiness("media", businessId, "*", {
            filter: { id: mediaId }
        });

        if (!mediaData || mediaData.length === 0) {
            console.error("Media not found");
            return false;
        }

        const media = mediaData[0] as unknown as Media;

        let equipmentUpdate = {
            image_url: media.url,
        } as EquipmentUpdate;
        equipmentUpdate = await applyUpdated<EquipmentUpdate>(equipmentUpdate);
        // Update equipment with the new image URL
        const { error } = await updateWithBusinessCheck("equipment", equipmentId, equipmentUpdate, businessId);

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

export const uploadEquipmentImage = async (businessId: string, equipmentId: string, file: File): Promise<boolean> => {
    const { business, userId } = await withBusinessServer();
    try {

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
            size: file.size,
            id: "",
            business_id: businessId,
            project_id: null,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };

        const media = await createMedia(businessId, mediaData);
        if (!media) {
            throw new Error("Failed to create media record");
        }

        // Link media to equipment
        await linkMediaToEquipment(businessId, media.id, equipmentId);

        // Set as primary image
        await setEquipmentPrimaryImage(businessId, equipmentId, media.id);

        return true;
    } catch (error) {
        console.error("Error uploading equipment image:", error);
        return false;
    }
};

export const unlinkMediaFromEquipment = async (businessId: string, mediaId: string, equipmentId: string): Promise<boolean> => {
    try {


        // Find the link to delete
        const { data: existingLinks } = await fetchByBusiness("media_links", businessId, "*", {
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
        const { error } = await deleteWithBusinessCheck("media_links", existingLinks[0].id, businessId);

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

export const linkMediaToProject = async (businessId: string, mediaId: string, projectId: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Check if link already exists
        const { data: existingLinks } = await fetchByBusiness("media_links", businessId, "*", {
            filter: {
                media_id: mediaId,
                linked_id: projectId,
                linked_type: "project"
            }
        });

        if (existingLinks && existingLinks.length > 0) {
            console.log("Media already linked to project");
            return true;
        }

        // Create new link using insertWithBusiness
        let newLink = {
            media_id: mediaId,
            linked_id: projectId,
            linked_type: "project"
        };

        newLink = await applyCreated<MediaLink>(newLink);

        const { data, error } = await insertWithBusiness("media_links", newLink as MediaLinkInsert, businessId, {
            userId: userId
        });

        if (error) {
            console.error("Error linking media to project:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error linking media to project:", error);
        return false;
    }
};

export const unlinkMediaFromProject = async (businessId: string, mediaIds: string[], projectId: string): Promise<boolean> => {
    try {


        // Find the link to delete
        const { data: existingLinks } = await fetchByBusiness("media_links", businessId, "*", {
            filter: {
                media_id: { in: mediaIds },
                linked_id: projectId,
                linked_type: "project"
            }
        });

        if (!existingLinks || existingLinks.length === 0) {
            console.log("No media link found to remove");
            return true;
        }

        // Delete the link using deleteWithBusinessCheck
        const { error } = await deleteWithBusinessCheck("media_links", existingLinks[0].id, businessId);

        if (error) {
            console.error("Error unlinking media from project:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error unlinking media from project:", error);
        return false;
    }
};

export const uploadProjectMedia = async (businessId: string, projectId: string, file: File, type: MediaType, description?: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Generate upload URL
        const uploadData = await generateUploadUrl(type, file.name);
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
            description: description || `Media file for project`,
            type: type,
            url: uploadData.fileUrl,
            size: file.size,
            id: "",
            business_id: businessId,
            project_id: projectId,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };

        const media = await createMedia(businessId, mediaData);
        if (!media) {
            throw new Error("Failed to create media record");
        }

        // Link media to project
        await linkMediaToProject(businessId, media.id, projectId);

        return true;
    } catch (error) {
        console.error("Error uploading project media:", error);
        return false;
    }
};

// Client Media Functions
export const getMediaByClientId = async (businessId: string, clientId: string, type?: string): Promise<Media[]> => {
    // First, get all media links for this client
    const { data: linkData, error: linkError } = await fetchByBusiness("media_links", businessId, "*", {
        filter: { linked_id: clientId, linked_type: "client" },
    });

    if (linkError) {
        console.error("Error fetching media links by client ID:", linkError);
        return [];
    }

    if (!linkData || linkData.length === 0) {
        return [];
    }

    const mediaIds = (linkData as unknown as MediaLink[]).map((link: { media_id: string }) => link.media_id).filter(Boolean);

    if (mediaIds.length === 0) {
        return [];
    }

    // Then get the actual media records
    const { data: mediaData, error: mediaError } = await fetchByBusiness("media", businessId, "*", {
        filter: {
            id: { in: mediaIds },
            ...(type && { type: type })
        }
    });

    if (mediaError) {
        console.error("Error fetching media by client ID:", mediaError);
        return [];
    }

    return (mediaData as unknown as Media[]) || [];
};

export const linkMediaToClient = async (businessId: string, mediaId: string, clientId: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        const linkData: MediaLinkInsert = {
            id: "",
            business_id: businessId,
            media_id: mediaId,
            linked_id: clientId,
            linked_type: "client",
            created_at: new Date().toISOString(),
            created_by: userId,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };

        linkData.id = crypto.randomUUID();

        const { error } = await insertWithBusiness("media_links", linkData, businessId);

        if (error) {
            console.error("Error linking media to client:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error linking media to client:", error);
        return false;
    }
};

export const uploadClientMedia = async (businessId: string, clientId: string, file: File, type: MediaType, description: string, tags?: string): Promise<boolean> => {
    const { business, userId } = await withBusinessServer();
    try {
        // Generate upload URL
        const uploadData = await generateUploadUrl(type, file.name);
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
            description: description,
            type: type === "images" ? "image" : type === "videos" ? "video" : type === "audios" ? "audio" : "file",
            url: uploadData.fileUrl,
            size: file.size,
            id: "",
            business_id: businessId,
            project_id: null,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };

        const media = await createMedia(businessId, mediaData);
        if (!media) {
            throw new Error("Failed to create media record");
        }

        // Link media to client
        await linkMediaToClient(businessId, media.id, clientId);

        // Add tags if provided
        if (tags) {
            const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            // Note: You might want to add tag functionality here using media-tags.ts actions
        }

        return true;
    } catch (error) {
        console.error("Error uploading client media:", error);
        return false;
    }
};

export const unlinkMediaFromClient = async (businessId: string, mediaId: string, clientId: string): Promise<boolean> => {
    try {
        // Find the link to delete
        const { data: existingLinks } = await fetchByBusiness("media_links", businessId, "*", {
            filter: {
                media_id: mediaId,
                linked_id: clientId,
                linked_type: "client"
            }
        });

        if (!existingLinks || existingLinks.length === 0) {
            console.log("No media link found to remove");
            return true;
        }

        // Delete the link
        const linkToDelete = (existingLinks as unknown as MediaLink[])[0];
        const { error } = await deleteWithBusinessCheck("media_links", linkToDelete.id, businessId);

        if (error) {
            console.error("Error unlinking media from client:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error unlinking media from client:", error);
        return false;
    }
};

export const getAvailableMediaForClient = async (businessId: string, clientId: string): Promise<Media[]> => {
    try {
        // Get all media for the business
        const { data: allMedia, error: mediaError } = await fetchByBusiness("media", businessId, "*");

        if (mediaError) {
            console.error("Error fetching all media:", mediaError);
            return [];
        }

        if (!allMedia || allMedia.length === 0) {
            return [];
        }

        // Get media already linked to this client
        const { data: linkedMedia, error: linkError } = await fetchByBusiness("media_links", businessId, "*", {
            filter: { linked_id: clientId, linked_type: "client" }
        });

        if (linkError) {
            console.error("Error fetching linked media:", linkError);
            return allMedia as unknown as Media[];
        }

        // Get IDs of already linked media
        const linkedMediaIds = linkedMedia
            ? (linkedMedia as unknown as MediaLink[]).map(link => link.media_id)
            : [];

        // Filter out already linked media
        const availableMedia = (allMedia as unknown as Media[]).filter(
            media => !linkedMediaIds.includes(media.id)
        );

        return availableMedia;
    } catch (error) {
        console.error("Error getting available media for client:", error);
        return [];
    }
};

export const linkExistingMediaToClient = async (businessId: string, mediaIds: string[], clientId: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Link each selected media item to the client
        for (const mediaId of mediaIds) {
            const linkData: MediaLinkInsert = {
                id: crypto.randomUUID(),
                business_id: businessId,
                media_id: mediaId,
                linked_id: clientId,
                linked_type: "client",
                created_at: new Date().toISOString(),
                created_by: userId,
                updated_at: new Date().toISOString(),
                updated_by: userId
            };

            const { error } = await insertWithBusiness("media_links", linkData, businessId);

            if (error) {
                console.error("Error linking existing media to client:", error);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error("Error linking existing media to client:", error);
        return false;
    }
};

export const uploadClientLogo = async (businessId: string, clientId: string, file: File): Promise<{ success: boolean; logoUrl?: string }> => {
    const { business, userId } = await withBusinessServer();
    try {
        // Generate upload URL for images
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

        // Create media record for the logo
        const mediaData: MediaInsert = {
            name: `${file.name}-client-logo`,
            description: `Logo for client`,
            type: "image",
            url: uploadData.fileUrl,
            size: file.size,
            id: "",
            business_id: businessId,
            project_id: null,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };

        const media = await createMedia(businessId, mediaData);
        if (!media) {
            throw new Error("Failed to create media record");
        }

        // Link media to client
        await linkMediaToClient(businessId, media.id, clientId);        // Update client logo_url
        const clientUpdate: ClientUpdate = {
            logo_url: uploadData.fileUrl,
            updated_at: new Date().toISOString(),
            updated_by: userId
        } as ClientUpdate;

        const { error: updateError } = await updateWithBusinessCheck("clients", clientId, clientUpdate, businessId);

        if (updateError) {
            throw new Error("Failed to update client logo URL");
        }

        return { success: true, logoUrl: uploadData.fileUrl };
    } catch (error) {
        console.error("Error uploading client logo:", error);
        return { success: false };
    }
};

// Daily Log Media Functions
export const getMediaByDailyLogId = async (businessId: string, dailyLogId: string, searchTerm: string = ""): Promise<Media[]> => {
    try {
        const { data, error } = await fetchByBusiness(
            "media",
            businessId,
            "*",
            {}
        );

        if (error) {
            console.error("Error fetching media:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Get media links for this daily log
        const { data: links } = await fetchByBusiness(
            "media_links",
            businessId,
            "*",
            {
                filter: {
                    linked_id: dailyLogId,
                    linked_type: "daily_log"
                }
            }
        );

        if (!links || links.length === 0) {
            return [];
        }

        const linkedMediaIds = links.map(link => link.media_id);
        let media = (data as unknown as Media[]).filter(m => linkedMediaIds.includes(m.id));

        // Apply search filter if provided
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            media = media.filter(m =>
                (m.name || "").toLowerCase().includes(term) ||
                (m.description || "").toLowerCase().includes(term)
            );
        }

        return media;
    } catch (error) {
        console.error("Error fetching daily log media:", error);
        return [];
    }
};

export const linkMediaToDailyLog = async (businessId: string, mediaId: string, dailyLogId: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Check if link already exists
        const { data: existingLinks } = await fetchByBusiness(
            "media_links",
            businessId,
            "*",
            {
                filter: {
                    media_id: mediaId,
                    linked_id: dailyLogId,
                    linked_type: "daily_log"
                }
            }
        );

        if (existingLinks && existingLinks.length > 0) {
            return true; // Already linked
        }

        // Create new link
        let linkData: MediaLinkInsert = {
            id: "",
            media_id: mediaId,
            linked_id: dailyLogId,
            linked_type: "daily_log",
            business_id: businessId,
            created_at: new Date().toISOString(),
            created_by: userId,
            updated_at: new Date().toISOString(),
            updated_by: userId,
        };

        linkData = await applyCreated<MediaLinkInsert>(linkData);

        const { error } = await insertWithBusiness("media_links", linkData, businessId);

        if (error) {
            console.error("Error linking media to daily log:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error linking media to daily log:", error);
        return false;
    }
};

export const unlinkMediaFromDailyLog = async (businessId: string, mediaId: string, dailyLogId: string): Promise<boolean> => {
    try {
        // Find existing links
        const { data: existingLinks } = await fetchByBusiness(
            "media_links",
            businessId,
            "*",
            {
                filter: {
                    media_id: mediaId,
                    linked_id: dailyLogId,
                    linked_type: "daily_log"
                }
            }
        );

        if (!existingLinks || existingLinks.length === 0) {
            return true; // Nothing to unlink
        }

        // Delete the link
        const { error } = await deleteWithBusinessCheck("media_links", existingLinks[0].id, businessId);

        if (error) {
            console.error("Error unlinking media from daily log:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error unlinking media from daily log:", error);
        return false;
    }
};

export const uploadDailyLogMedia = async (businessId: string, dailyLogId: string, file: File, type: MediaType, description?: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Generate upload URL
        const uploadData = await generateUploadUrl(type, file.name);
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
            description: description || `Media file for daily log`,
            type: type,
            url: uploadData.fileUrl,
            size: file.size,
            id: "",
            business_id: businessId,
            project_id: null,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };

        const media = await createMedia(businessId, mediaData);
        if (!media) {
            throw new Error("Failed to create media record");
        }

        // Link media to daily log
        await linkMediaToDailyLog(businessId, media.id, dailyLogId);

        return true;
    } catch (error) {
        console.error("Error uploading daily log media:", error);
        return false;
    }
};

export const linkExistingMediaToDailyLog = async (businessId: string, mediaIds: string[], dailyLogId: string): Promise<boolean> => {
    try {
        for (const mediaId of mediaIds) {
            const success = await linkMediaToDailyLog(businessId, mediaId, dailyLogId);
            if (!success) {
                console.error(`Failed to link media ${mediaId} to daily log ${dailyLogId}`);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error("Error linking existing media to daily log:", error);
        return false;
    }
};

export const linkExistingMediaToProject = async (businessId: string, mediaIds: string[], projectId: string): Promise<boolean> => {
    try {
        const { business, userId } = await withBusinessServer();

        for (const mediaId of mediaIds) {
            const success = await linkMediaToProject(businessId, mediaId, projectId);
            if (!success) {
                throw new Error(`Failed to link media ${mediaId} to project`);
            }
        }

        return true;
    } catch (error) {
        console.error("Error linking existing media to project:", error);
        return false;
    }
};

export const getAvailableMediaForProject = async (businessId: string, projectId: string): Promise<Media[]> => {
    try {
        const { business, userId } = await withBusinessServer();

        // Get all media for the business
        const { data: allMedia, error: mediaError } = await fetchByBusiness("media", businessId, "*");
        if (mediaError || !allMedia) {
            console.error("Error fetching media:", mediaError);
            return [];
        }

        // Get all media links for this project
        const { data: projectMediaLinks, error: linkError } = await fetchByBusiness("media_links", businessId, "*", {
            filter: { linked_type: "project", linked_id: projectId }
        });
        if (linkError) {
            console.error("Error fetching project media links:", linkError);
            return allMedia as Media[]; // Return all media if we can't get links
        }

        const linkedProjectMediaIds = (projectMediaLinks || []).map((link: any) => link.media_id);

        // Filter out media that is already linked to this project
        const availableMedia = (allMedia as Media[]).filter(media => !linkedProjectMediaIds.includes(media.id));

        return availableMedia;
    } catch (error) {
        console.error("Error getting available media for project:", error);
        return [];
    }
};

export const getAvailableMediaForEquipment = async (businessId: string, equipmentId: string): Promise<Media[]> => {
    try {
        // Get all media for the business
        const { data: allMedia, error: mediaError } = await fetchByBusiness("media", businessId, "*", {
            orderBy: { column: "created_at", ascending: false }
        });

        if (mediaError) {
            console.error("Error fetching all media:", mediaError);
            return [];
        }

        if (!allMedia || allMedia.length === 0) {
            return [];
        }

        // Get media already linked to this equipment
        const { data: linkedMedia, error: linkError } = await fetchByBusiness("media_links", businessId, "*", {
            filter: { linked_id: equipmentId, linked_type: "equipment" }
        });

        if (linkError) {
            console.error("Error fetching linked media:", linkError);
            return allMedia as unknown as Media[];
        }

        // Get IDs of already linked media
        const linkedMediaIds = linkedMedia
            ? (linkedMedia as unknown as MediaLink[]).map(link => link.media_id)
            : [];

        // Filter out already linked media
        const availableMedia = (allMedia as unknown as Media[]).filter(
            media => !linkedMediaIds.includes(media.id)
        );

        return availableMedia;
    } catch (error) {
        console.error("Error getting available media for equipment:", error);
        return [];
    }
};

export const linkExistingMediaToEquipment = async (businessId: string, mediaIds: string[], equipmentId: string): Promise<boolean> => {
    try {
        for (const mediaId of mediaIds) {
            const success = await linkMediaToEquipment(businessId, mediaId, equipmentId);
            if (!success) {
                console.error(`Failed to link media ${mediaId} to equipment ${equipmentId}`);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error("Error linking existing media to equipment:", error);
        return false;
    }
};

export const getAllMediaByEquipmentId = async (businessId: string, equipmentId: string): Promise<Media[]> => {
    try {
        // Get all media types for this equipment
        const [images, videos, documents, audios] = await Promise.all([
            getMediaByEquipmentId(businessId, equipmentId, "image"),
            getMediaByEquipmentId(businessId, equipmentId, "video"),
            getMediaByEquipmentId(businessId, equipmentId, "document"),
            getMediaByEquipmentId(businessId, equipmentId, "audio")
        ]);

        return [...images, ...videos, ...documents, ...audios];
    } catch (error) {
        console.error("Error getting all media for equipment:", error);
        return [];
    }
};

export async function uploadPdfBuffer(
    businessId: string,
    buffer: Buffer,
    filename: string,
    description: string = "Generated PDF document"
): Promise<{ success: boolean; media?: Media; fileUrl?: string; error?: string }> {
    const { business, userId } = await withBusinessServer();

    try {
        // Generate upload URL for documents
        const uploadData = await generateUploadUrl("documents", filename);
        if (!uploadData) {
            throw new Error("Failed to generate upload URL");
        }

        // Upload buffer to Azure Blob Storage
        const uploadResponse = await fetch(uploadData.uploadUrl, {
            method: 'PUT',
            body: buffer,
            headers: {
                'x-ms-blob-type': 'BlockBlob',
                'Content-Type': 'application/pdf',
            },
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        // Create media record
        const mediaData: MediaInsert = {
            name: filename,
            description: description,
            type: "document",
            url: uploadData.fileUrl,
            size: buffer.length,
            id: "",
            business_id: businessId,
            project_id: null,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: userId,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };

        const media = await createMedia(businessId, mediaData);
        if (!media) {
            throw new Error("Failed to create media record");
        }

        return {
            success: true,
            media: media,
            fileUrl: uploadData.fileUrl
        };

    } catch (error) {
        console.error("Error uploading PDF buffer:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}