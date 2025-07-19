import { Media, MediaInsert, MediaType } from '@/types/media';

interface UploadUrlResponse {
    uploadUrl: string;
    fileUrl: string;
    fileName: string;
}

export async function generateUploadUrlClient(
    type: MediaType,
    filename: string
): Promise<UploadUrlResponse | null> {
    try {
        const response = await fetch('/api/media/upload-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, filename }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to generate upload URL:', errorData.error || response.statusText);
            return null;
        }

        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Error generating upload URL:', error);
        return null;
    }
}

export async function createMediaClient(mediaData: Omit<MediaInsert, 'business_id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>): Promise<Media | null> {
    try {
        const response = await fetch('/api/media', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mediaData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to create media:', errorData.error || response.statusText);
            return null;
        }

        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Error creating media:', error);
        return null;
    }
}
