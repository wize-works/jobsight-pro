import { createServerClient } from '@/lib/supabase';
import { serverInsertWithBusiness, serverFetchByBusiness, serverUpdateWithBusinessCheck, serverDeleteWithBusinessCheck } from '@/lib/db';
import { generateAzureUploadUrl } from './azure';
import { MediaInsert, Media, MediaUpdate } from '@/types/media';
import { MediaLinkInsert } from '@/types/media_links';

/**
 * Server-side utility to upload PDF buffer to Azure and create media record
 * Replaces server action for API route usage
 */
export async function uploadPdfBufferServer(
    businessId: string,
    userId: string,
    buffer: Buffer,
    filename: string,
    description: string = "Generated PDF document"
): Promise<{ success: boolean; media?: Media; fileUrl?: string; error?: string }> {
    try {
        // Generate upload URL for documents
        const uploadData = await generateAzureUploadUrl("documents", filename);
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
        const mediaData: Partial<MediaInsert> = {
            name: filename,
            description: description,
            type: "document",
            url: uploadData.fileUrl,
            size: buffer.length,
            project_id: null,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString(),
        };

        const result = await serverInsertWithBusiness(
            "media",
            mediaData as MediaInsert,
            businessId,
            userId
        );

        if (result.error) {
            throw new Error("Failed to create media record");
        }

        const media = Array.isArray(result.data) ? result.data[0] : result.data;

        return {
            success: true,
            media: media as Media,
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

/**
 * Server-side utility to link existing media to client
 * Replaces server action for API route usage
 */
export async function linkExistingMediaToClientServer(
    businessId: string,
    userId: string,
    mediaIds: string[],
    clientId: string
): Promise<boolean> {
    try {
        // Link each selected media item to the client
        for (const mediaId of mediaIds) {
            const linkData: Partial<MediaLinkInsert> = {
                media_id: mediaId,
                linked_id: clientId,
                linked_type: "client",
            };

            const result = await serverInsertWithBusiness(
                "media_links",
                linkData as MediaLinkInsert,
                businessId,
                userId
            );

            if (result.error) {
                console.error("Error linking existing media to client:", result.error);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error("Error linking existing media to client:", error);
        return false;
    }
}

/**
 * Server-side utility to get all media for a business
 * Replaces server action for API route usage
 */
export async function getMediasServer(businessId: string): Promise<Media[]> {
    try {
        const { data, error } = await serverFetchByBusiness("media", businessId);

        if (error) {
            console.error("Error fetching medias:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as Media[];
        }

        return data as unknown as Media[];
    } catch (err) {
        console.error("Error in getMediasServer:", err);
        return [];
    }
}

/**
 * Server-side utility to get a media by ID
 * Replaces server action for API route usage
 */
export async function getMediaByIdServer(businessId: string, id: string): Promise<Media | null> {
    try {
        const { data, error } = await serverFetchByBusiness("media", businessId, "*", {
            filter: { id: id }
        });

        if (error) {
            console.error("Error fetching media by ID:", error);
            return null;
        }

        if (data && data[0]) {
            return data[0] as unknown as Media;
        }

        return null;
    } catch (err) {
        console.error("Error in getMediaByIdServer:", err);
        return null;
    }
}

/**
 * Server-side utility to create a media record
 * Replaces server action for API route usage
 */
export async function createMediaServer(businessId: string, userId: string, media: MediaInsert): Promise<Media | null> {
    try {
        const mediaWithTimestamp = {
            ...media,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await serverInsertWithBusiness(
            "media",
            mediaWithTimestamp,
            businessId,
            userId
        );

        if (error) {
            console.error("Error creating media:", error);
            return null;
        }

        return data as unknown as Media;
    } catch (err) {
        console.error("Error in createMediaServer:", err);
        return null;
    }
}

/**
 * Server-side utility to update a media record
 * Replaces server action for API route usage
 */
export async function updateMediaServer(businessId: string, userId: string, id: string, media: MediaUpdate): Promise<Media | null> {
    try {
        const mediaWithTimestamp = {
            ...media,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await serverUpdateWithBusinessCheck(
            "media",
            id,
            mediaWithTimestamp,
            businessId,
            userId
        );

        if (error) {
            console.error("Error updating media:", error);
            return null;
        }

        return data as unknown as Media;
    } catch (err) {
        console.error("Error in updateMediaServer:", err);
        return null;
    }
}

/**
 * Server-side utility to delete a media record
 * Replaces server action for API route usage
 */
export async function deleteMediaServer(businessId: string, id: string): Promise<boolean> {
    try {
        const { error } = await serverDeleteWithBusinessCheck("media", id, businessId);

        if (error) {
            console.error("Error deleting media:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteMediaServer:", err);
        return false;
    }
}

/**
 * Server-side utility to search media
 * Replaces server action for API route usage
 */
export async function searchMediasServer(businessId: string, query: string): Promise<Media[]> {
    try {
        const { data, error } = await serverFetchByBusiness("media", businessId, "*", {
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
    } catch (err) {
        console.error("Error in searchMediasServer:", err);
        return [];
    }
}
