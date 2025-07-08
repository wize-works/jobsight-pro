'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export interface UserSetupStatus {
    needsSetup: boolean;
    isLoading: boolean;
    error: string | null;
    isBusinessOwner: boolean;
    businessSetupPending: boolean;
}

export function useUserSetup() {
    const { isLoaded, user } = useUser();
    const [setupStatus, setSetupStatus] = useState<UserSetupStatus>({
        needsSetup: false,
        isLoading: true,
        error: null,
        isBusinessOwner: false,
        businessSetupPending: false,
    });

    const checkSetupStatus = async () => {
        if (!isLoaded || !user) {
            console.log('[useUserSetup] User not loaded yet, skipping check');
            setSetupStatus({
                needsSetup: false,
                isLoading: false,
                error: null,
                isBusinessOwner: false,
                businessSetupPending: false,
            });
            return;
        }

        try {
            console.log('[useUserSetup] Checking setup status for user:', user.id);
            setSetupStatus(prev => ({ ...prev, isLoading: true, error: null }));

            // Add cache-busting query parameter
            const cacheBuster = Date.now();
            const response = await fetch(`/api/setup-user?t=${cacheBuster}`, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            console.log('[useUserSetup] API response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('[useUserSetup] API result:', result);

            setSetupStatus({
                needsSetup: result.needsSetup,
                isLoading: false,
                error: null,
                isBusinessOwner: result.isBusinessOwner || false,
                businessSetupPending: result.businessSetupPending || false,
            });

        } catch (error) {
            console.error('[useUserSetup] Error checking setup status:', error);
            setSetupStatus({
                needsSetup: false,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to check setup status',
                isBusinessOwner: false,
                businessSetupPending: false,
            });
        }
    };

    const markSetupComplete = () => {
        setSetupStatus(prev => ({
            ...prev,
            needsSetup: false,
            businessSetupPending: false,
        }));
        
        // Force a re-check after a short delay to ensure the UI updates properly
        setTimeout(() => {
            checkSetupStatus();
        }, 100);
    };

    useEffect(() => {
        console.log('[useUserSetup] Effect triggered, isLoaded:', isLoaded, 'user:', user?.id);
        checkSetupStatus();
    }, [isLoaded, user]);

    return {
        ...setupStatus,
        checkSetupStatus,
        markSetupComplete,
    };
}
