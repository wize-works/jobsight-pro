import { headers } from 'next/headers';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
}

/**
 * Get the nonce from request headers (set by middleware)
 */
export async function getNonce(): Promise<string | undefined> {
    const headersList = await headers();
    return headersList.get('x-nonce') || undefined;
}

/**
 * Create CSP header value with nonce
 */
export function createCSPWithNonce(nonce: string): string {
    return [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' https://www.clarity.ms https://c.clarity.ms https://kit.fontawesome.com https://browser.sentry-cdn.com`,
        `connect-src 'self' https://www.clarity.ms https://c.clarity.ms https://dc.clarity.ms https://sentry.io https://*.sentry.io https://*.stwwmediaprodwu301.blob.core.windows.net`,
        "img-src 'self' data: https: blob: https://www.clarity.ms",
        `style-src 'self' 'unsafe-inline' https://kit.fontawesome.com`,
        "font-src 'self' https://kit.fontawesome.com",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "worker-src 'self' blob:",
    ].join('; ');
}
