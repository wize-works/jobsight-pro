'use client';

/**
 * Client-side chunk loading error handler
 * Handles dynamic import failures when offline
 */

let isHandlerRegistered = false;

export function registerChunkErrorHandler() {
    if (isHandlerRegistered || typeof window === 'undefined') return;

    isHandlerRegistered = true;

    // Handle unhandled chunk loading errors
    window.addEventListener('error', (event) => {
        const isChunkError = event.filename?.includes('_next/static/chunks/') ||
            event.message?.includes('Loading chunk') ||
            event.message?.includes('Failed to load chunk');

        if (isChunkError) {
            console.warn('Chunk loading failed, likely due to offline mode:', event.message);

            // Try to reload the page as a fallback
            if (confirm('A resource failed to load. Reload the page to try again?')) {
                window.location.reload();
            }

            // Prevent the error from propagating
            event.preventDefault();
            return false;
        }
    });

    // Handle unhandled promise rejections from dynamic imports
    window.addEventListener('unhandledrejection', (event) => {
        const isChunkError = event.reason?.message?.includes('Loading chunk') ||
            event.reason?.message?.includes('Failed to load chunk') ||
            event.reason?.message?.includes('_next/static');

        if (isChunkError) {
            console.warn('Dynamic import failed, likely due to offline mode:', event.reason);

            // Show a user-friendly message
            const message = 'Some features are unavailable offline. Your data is safe and will sync when connection is restored.';

            // Try to show a toast notification if available
            try {
                // This will work if the toast system is loaded
                (window as any).__showToast?.('warning', message);
            } catch {
                // Fallback to console log
                console.info(message);
            }

            // Prevent the unhandled rejection from showing in console
            event.preventDefault();
        }
    });

    console.log('✅ Chunk error handler registered');
}

// Auto-register when the module loads on client
if (typeof window !== 'undefined') {
    registerChunkErrorHandler();
}
