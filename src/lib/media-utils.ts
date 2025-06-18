/**
 * Utility functions for handling media URLs and CORS issues
 */

/**
 * Converts an Azure Blob Storage URL to use the local proxy in development
 * to avoid CORS issues. In production, returns the original URL.
 */
export function getProxiedMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // In development, proxy through Next.js to avoid CORS
    if (process.env.NODE_ENV === 'development') {
        // Replace the Azure Blob Storage domain with our local proxy
        return url.replace('https://stwwmediaprodwu301.blob.core.windows.net/', '/api/media/');
    }

    // In production, return the original URL
    return url;
}

/**
 * Get the original Azure Blob Storage URL from a potentially proxied URL
 */
export function getOriginalMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // If it's a local proxy URL, convert back to Azure URL
    if (url.startsWith('/api/media/')) {
        return url.replace('/api/media/', 'https://stwwmediaprodwu301.blob.core.windows.net/');
    }

    // Otherwise return as-is
    return url;
}
