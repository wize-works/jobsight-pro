"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useBusiness } from '@/lib/business-context';
import { getUserByAuthId } from '@/app/actions/users';
import type { UserRole } from '@/types/users';

export interface UserRoleHookReturn {
    userRole: UserRole | null;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to get the current user's role within their business context
 * Returns the user's role (admin, manager, member) for dashboard personalization
 */
export function useUserRole(): UserRoleHookReturn {
    const { user: clerkUser, isLoaded } = useUser();
    const { businessId, loading: businessLoading } = useBusiness();
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Reset state when dependencies change
        if (!isLoaded || businessLoading || !clerkUser?.id || !businessId) {
            setUserRole(null);
            setLoading(!isLoaded || businessLoading);
            setError(null);
            return;
        }

        const fetchUserRole = async () => {
            setLoading(true);
            setError(null);

            try {
                const userData = await getUserByAuthId(businessId, clerkUser.id);

                if (userData && 'role' in userData && userData.role) {
                    setUserRole(userData.role as UserRole);
                } else {
                    // Default to member if no role is found
                    setUserRole('member');
                    console.warn('No role found for user, defaulting to member');
                }
            } catch (err) {
                console.error('Error fetching user role:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch user role');
                // Default to member on error to prevent blocking the dashboard
                setUserRole('member');
            } finally {
                setLoading(false);
            }
        };

        fetchUserRole();
    }, [clerkUser?.id, businessId, isLoaded, businessLoading]);

    return {
        userRole,
        loading,
        error
    };
}
