
"use client"

import { useCallback, useEffect, useState } from 'react'
import { redirect, useRouter, usePathname } from 'next/navigation'
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
    const pathname = usePathname()
    const { user, isLoading: isAuthLoading } = useKindeBrowserClient()
    const [state, setState] = useState<Omit<BusinessState, "refreshBusiness">>({
        businessId: null,
        businessData: null,
        loading: true,
        error: null
    })

    // Check if we're in a registration flow
    const isRegistrationFlow = pathname === '/register' || pathname === '/onboarding'

    const checkBusiness = useCallback(async () => {
        // Don't redirect if auth is still loading
        if (isAuthLoading) {
            return;
        }

        if (!user?.id) {
            if (!isRegistrationFlow) {
                console.warn('User ID is not available after auth load, redirecting to home');
                setState(prev => ({ ...prev, loading: false }))
                toast({
                    title: "Authentication required",
                    variant: "destructive",
                });
                router.push('/');
            }
            return;
        }

        try {
            const response = await getUserBusiness(user.id)

            if (!response || 'error' in response) {
                setState({
                    businessId: null,
                    businessData: null,
                    loading: false,
                    error: (response && 'error' in response) ? response.error : "No business found"
                })
                
                // Only redirect if not in registration flow
                if (!isRegistrationFlow) {
                    toast({
                        title: "Business setup required",
                        description: "Please complete your business setup",
                    });
                    console.error('No business found, redirecting to register')
                    router.push('/register')
                }
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
            
            // Only redirect if not in registration flow
            if (!isRegistrationFlow) {
                toast({
                    title: "Error",
                    description: "Failed to verify business access",
                    variant: "destructive",
                })
                console.error('Redirecting to register due to error:', error)
                router.push('/register')
            }
        }
    }, [user?.id, router, isAuthLoading, isRegistrationFlow])

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
