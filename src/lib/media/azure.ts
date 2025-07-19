import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    SASProtocol,
} from '@azure/storage-blob';
import { MediaType } from '@/types/media';

const account = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;
const endpoint = process.env.AZURE_STORAGE_ENDPOINT;

const credentials = new StorageSharedKeyCredential(account || "", accountKey || "");
const blobServiceClient = new BlobServiceClient(endpoint || "", credentials);

/**
 * Server-side utility to generate Azure blob upload URL
 * Replaces server action for API route usage
 */
export async function generateAzureUploadUrl(type: MediaType, filename: string): Promise<{ uploadUrl: string; fileUrl: string; fileName: string } | null> {
    try {
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
            fileName: safeFilename
        };
    } catch (error) {
        console.error('Error generating Azure upload URL:', error);
        return null;
    }
}
