"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { initializeAuthState } from '@/app/actions/client/business';

/**
 * Hook to initialize business client actions with Clerk auth state
 * This should be called once in your app layout or main provider component
 * to ensure offline business actions have access to the authenticated user
 */
export function useBusinessAuthInitializer() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (isLoaded) {
            // Initialize auth state for business client actions
            initializeAuthState(user ? { id: user.id } : null);
        }
    }, [user, isLoaded]);

    // Return auth state for debugging or conditional rendering
    return {
        isInitialized: isLoaded,
        hasUser: !!user,
        userId: user?.id || null,
    };
}
