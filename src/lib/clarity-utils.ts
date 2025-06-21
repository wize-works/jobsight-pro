/**
 * Microsoft Clarity utilities for debugging and validation
 */

declare global {
    interface Window {
        clarity?: {
            [key: string]: any;
        };
    }
}

export const clarityUtils = {
    /**
     * Check if Microsoft Clarity is loaded and working
     */
    isLoaded: (): boolean => {
        return typeof window !== 'undefined' &&
            typeof window.clarity !== 'undefined' &&
            window.clarity !== null;
    },

    /**
     * Get the current Clarity session ID if available
     */
    getSessionId: (): string | null => {
        if (!clarityUtils.isLoaded()) return null;

        try {
            // Microsoft Clarity exposes session ID through their global object
            return window.clarity?.id || null;
        } catch (error) {
            console.warn('Failed to get Clarity session ID:', error);
            return null;
        }
    },

    /**
     * Test if Clarity can send events
     */
    testConnection: (): boolean => {
        if (!clarityUtils.isLoaded()) {
            console.warn('Microsoft Clarity is not loaded');
            return false;
        }

        try {
            // Try to send a test event
            if (window.clarity && typeof window.clarity.event === 'function') {
                window.clarity.event('test_connection');
                console.log('Microsoft Clarity test event sent successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Microsoft Clarity test failed:', error);
            return false;
        }
    },

    /**
     * Debug information about Clarity status
     */
    getDebugInfo: () => {
        const info = {
            isLoaded: clarityUtils.isLoaded(),
            sessionId: clarityUtils.getSessionId(),
            hasGlobalObject: typeof window !== 'undefined' && 'clarity' in window,
            environmentId: process.env.NEXT_PUBLIC_CLARITY_ID || 'Not set',
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side',
            timestamp: new Date().toISOString()
        };

        console.log('Microsoft Clarity Debug Info:', info);
        return info;
    }
};

// Export for use in components
export default clarityUtils;
