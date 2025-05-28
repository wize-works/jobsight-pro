"use client"

import { useCallback, useEffect, useState } from 'react'
import { redirect, useRouter } from 'next/navigation'
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { toast } from "@/hooks/use-toast"
import type { ComponentType } from 'react'
import { getUserBusiness } from "@/app/actions/business"
import type { Business } from "@/types/business"

export type BusinessState = {
    businessId: string | null;
    businessData: Business | null;
    loading: boolean;
    error: string | null;
    refreshBusiness: () => Promise<void>;
}

// Hook for direct use in components
export function useWithBusiness(): BusinessState {
    const router = useRouter()
    const { user, isLoading: isAuthLoading } = useKindeBrowserClient()
    const [state, setState] = useState<Omit<BusinessState, "refreshBusiness">>({
        businessId: null,
        businessData: null,
        loading: true,
        error: null
    })

    const checkBusiness = useCallback(async () => {
        // Don't redirect if auth is still loading
        if (isAuthLoading) {
            return;
        }

        if (!user?.id) {
            console.warn('User ID is not available after auth load, redirecting to home');
            setState(prev => ({ ...prev, loading: false }))
            toast.error({
                description: "Authentication required",
            });
            router.push('/');
            return;
        }

        try {
            const response = await getUserBusiness(user.id)

            if (!response || 'error' in response) {
                setState({
                    businessId: null,
                    businessData: null,
                    loading: false,
                    error: (response && 'error' in response) ? response.error : "Authentication required"
                })
                toast({
                    description: (response && 'error' in response) ? response.error : "Authentication required",
                    variant: "error"
                })
                console.error('No business found or error:', response)
                router.push('/')
                return
            }

            setState({
                businessId: response.id,
                businessData: response,
                loading: false,
                error: null
            })
        } catch (error) {
            console.error('Error checking business:', error)
            setState({
                businessId: null,
                businessData: null,
                loading: false,
                error: "Failed to verify business access"
            })
            toast({
                description: "Failed to verify business access",
                variant: "error"
            })
            console.error('Redirecting to home due to error:', error)
            router.push('/')
        }
    }, [user?.id, router, isAuthLoading])

    useEffect(() => {
        checkBusiness()
    }, [checkBusiness])

    return {
        ...state,
        refreshBusiness: checkBusiness
    }
}

// HOC for wrapping components
export function withBusiness<P extends object>(
    Component: ComponentType<P>
) {
    return function WithBusinessWrapper(props: P) {
        useWithBusiness(); // Use the hook in the HOC
        return <Component {...props} />;
    }
}
