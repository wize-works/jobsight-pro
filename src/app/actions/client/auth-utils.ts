"use client";

/**
 * Client Actions Auth Utilities
 * 
 * This file provides shared authentication state for client-side actions.
 * It initializes global variables that client action files will use.
 */

// Initialize global variables to prevent "not defined" errors
if (typeof global !== 'undefined') {
    // Use hasOwnProperty to check if the property exists without triggering a "not defined" error
    if (!Object.prototype.hasOwnProperty.call(global, 'currentClerkUser')) {
        global.currentClerkUser = null;
    }
    
    if (!Object.prototype.hasOwnProperty.call(global, 'authStateInitialized')) {
        global.authStateInitialized = false;
    }
    
    if (!Object.prototype.hasOwnProperty.call(global, 'currentBusinessId')) {
        global.currentBusinessId = null;
    }
}

// Safer initialization function that handles global scope errors
export function initializeAuthState(clerkUser: { id: string } | null) {
    if (typeof global !== 'undefined') {
        try {
            global.currentClerkUser = clerkUser;
            global.authStateInitialized = true;
        } catch (e) {
            console.error("Error initializing global auth state:", e);
        }
    }

    // Cache the auth_id for offline use
    if (typeof window !== 'undefined') {
        if (clerkUser?.id) {
            window.localStorage.setItem('cached_auth_id', clerkUser.id);
        } else {
            // Clear cached auth when user logs out
            window.localStorage.removeItem('cached_auth_id');
        }
    }
}

// Check if we're online
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

// Get current authenticated user ID safely
export async function getCurrentUserId(): Promise<string | null> {
    try {
        // First priority: Use initialized Clerk user state (when online and available)
        if (typeof global !== 'undefined' && 
            global.authStateInitialized && 
            global.currentClerkUser?.id) {
            return global.currentClerkUser.id;
        }

        // Second priority: Get from cached auth_id (for offline scenarios)
        if (typeof window !== 'undefined') {
            const cachedAuthId = window.localStorage.getItem('cached_auth_id');
            if (cachedAuthId) {
                return cachedAuthId;
            }
        }
    } catch (e) {
        console.error("Error getting current user ID:", e);
    }

    // If no auth state available, return null (user needs to authenticate)
    return null;
}

// Define the global auth state types
declare global {
    var currentClerkUser: { id: string } | null;
    var authStateInitialized: boolean;
    var currentBusinessId: string | null;
}
