"use client";

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { initializeAuthState } from '@/app/actions/client/business';

/**
 * Component to initialize global auth state used by client actions
 * Place this near the root of your app to ensure auth state is initialized
 * before any client action is called.
 */
export default function AuthStateInitializer() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (isLoaded) {
            // Initialize global variables safely
            if (typeof window !== 'undefined' && typeof global !== 'undefined') {
                try {
                    // Safely initialize auth state globals
                    if (!Object.prototype.hasOwnProperty.call(global, 'currentClerkUser')) {
                        global.currentClerkUser = null;
                    }

                    if (!Object.prototype.hasOwnProperty.call(global, 'authStateInitialized')) {
                        global.authStateInitialized = false;
                    }

                    if (!Object.prototype.hasOwnProperty.call(global, 'currentBusinessId')) {
                        global.currentBusinessId = null;
                    }

                    // Set current auth state
                    global.currentClerkUser = user;
                    global.authStateInitialized = true;

                    // Set business ID if available in localStorage
                    const businessId = localStorage.getItem('businessId');
                    if (businessId) {
                        global.currentBusinessId = businessId;
                    }

                    // Also call the specific init function for backward compatibility
                    initializeAuthState(user);

                    console.log("✅ Auth state initialized in AuthStateInitializer");
                } catch (error) {
                    console.error("❌ Error initializing auth state:", error);
                }
            }
        }
    }, [user, isLoaded]);

    // This component doesn't render anything
    return null;
}

/**
 * Types for global auth variables
 */
declare global {
    var currentClerkUser: { id: string } | null;
    var authStateInitialized: boolean;
    var currentBusinessId: string | null;
}
