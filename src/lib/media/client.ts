import { Media } from '@/types/media';

/**
 * Client-side utility to fetch media from API
 * Replaces direct server action calls
 */
export async function getMediasClient(): Promise<Media[]> {
    try {
        const response = await fetch('/api/media');
        if (!response.ok) {
            throw new Error('Failed to fetch media');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching media:', error);
        return [];
    }
}

/**
 * Client-side utility to search media from API
 * Replaces direct server action calls
 */
export async function searchMediasClient(query: string): Promise<Media[]> {
    try {
        const response = await fetch(`/api/media?search=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Failed to search media');
        }
        return await response.json();
    } catch (error) {
        console.error('Error searching media:', error);
        return [];
    }
}
