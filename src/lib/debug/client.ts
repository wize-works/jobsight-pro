/**
 * Client-side function for debug cache and crews
 * Uses API route for proper Next.js 15 patterns
 */
export async function debugCacheAndCrewsClient(): Promise<{
    success: boolean;
    message: string;
    crews: any[];
    error: string | null;
}> {
    try {
        const response = await fetch('/api/debug/cache-crews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in debug cache and crews:', error);
        return {
            success: false,
            message: 'Error occurred during debug operation',
            crews: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
