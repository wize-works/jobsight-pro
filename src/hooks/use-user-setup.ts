'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export interface UserSetupStatus {
    needsSetup: boolean;
    isLoading: boolean;
    error: string | null;
}

export function useUserSetup() {
    const { isLoaded, user } = useUser();
    const [setupStatus, setSetupStatus] = useState<UserSetupStatus>({
        needsSetup: false,
        isLoading: true,
        error: null,
    });

    const checkSetupStatus = async () => {
        if (!isLoaded || !user) {
            setSetupStatus({
                needsSetup: false,
                isLoading: false,
                error: null,
            });
            return;
        }

        try {
            setSetupStatus(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await fetch('/api/setup-user', {
                method: 'GET',
            });
            console.log('Checking setup status for user:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            setSetupStatus({
                needsSetup: result.needsSetup,
                isLoading: false,
                error: null,
            });

        } catch (error) {
            console.error('Error checking setup status:', error);
            setSetupStatus({
                needsSetup: false,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to check setup status',
            });
        }
    };

    const markSetupComplete = () => {
        setSetupStatus(prev => ({
            ...prev,
            needsSetup: false,
        }));
    };

    useEffect(() => {
        checkSetupStatus();
    }, [isLoaded, user]);

    return {
        ...setupStatus,
        checkSetupStatus,
        markSetupComplete,
    };
}
