"use client"

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react"
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from "next/navigation"
import { getUserBusiness } from "@/app/actions/business"
import { useToast } from "@/hooks/use-toast"
import type { Business } from "@/types/business";

type BusinessContextType = {
    businessId: string
    business: Business
    setBusinessId: (id: string) => void
    loading: boolean
    error: string | null
    refreshBusiness: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType>({
    businessId: "",
    business: {} as Business,
    setBusinessId: () => { },
    loading: true,
    error: null,
    refreshBusiness: async () => { },
})

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [businessId, setBusinessId] = useState<string>("")
    const [business, setBusinessData] = useState<Business>({} as Business)
    const [subscription, setSubscription] = useState<string>("") // Adjust type as needed
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const pathname = usePathname()
    const { toast } = useToast()

    // Check if we're in a registration flow
    const isRegistrationFlow = pathname === '/register' || pathname === '/onboarding'    // Function to fetch business data using server action
    const fetchBusinessData = async (userId: string) => {
        try {
            const response = await getUserBusiness(userId);

            if (!response) {
                setLoading(false);
                // User is valid but has no business
                if (!isRegistrationFlow) {
                    router.push('/register')
                    toast.info({
                        title: "Business setup required",
                        description: "Please complete your business setup",
                    })
                }
                return
            } if ('success' in response && !response.success) {
                console.log("❌ Business auth error:", response.error);
                setLoading(false);
                // If there's an error with authentication
                if (!isRegistrationFlow) {
                    toast.error({
                        title: "Error",
                        description: response.error,
                    })
                    console.error("Business auth error:", response.error)
                    router.push(response.redirect)
                }
                return
            } if ('id' in response) {
                // Batch all state updates together
                setBusinessId(response.id)
                setBusinessData(response as Business)
                localStorage.setItem("businessId", response.id)

                // Use setTimeout to ensure state update happens after current call stack
                setTimeout(() => {
                    setLoading(false)
                }, 0)
            } else {
                console.log("❌ Response doesn't have ID, redirecting to register");
                setLoading(false);
                router.push('/register');
                toast.warning({
                    title: "No Business Found",
                    description: "Please register your business to continue.",
                });
            }
        } catch (err) {
            console.error("💥 Error fetching business data:", err)
            setError(err instanceof Error ? err.message : "Unknown error fetching business data")

            if (!isRegistrationFlow) {
                toast.error({
                    title: "Error",
                    description: "Failed to load business data",
                })
            }
        }
    }

    // Function to load business data
    const loadBusinessData = async () => {
        if (!isLoaded) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            // If no user and not in registration flow, finish loading
            if (!user) {
                setLoading(false)
                return
            }            // Try to get from localStorage first
            const storedBusinessId = localStorage.getItem("businessId")

            if (storedBusinessId && user) {
                // Verify the stored business ID is still valid by fetching it
                await fetchBusinessData(user.id)
                return
            }

            // Fetch user's business using server action
            await fetchBusinessData(user.id)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error loading business data")
            setLoading(false) // Only set loading false on error
        }
    }

    // Load business data when user changes or on initial load
    useEffect(() => {
        loadBusinessData()
    }, [user?.id, isLoaded, isRegistrationFlow])

    // Update business ID in storage
    const setBusinessIdWithStorage = (id: string) => {
        setBusinessId(id)
        localStorage.setItem("businessId", id)
    }    // Function to manually refresh business data
    const refreshBusiness = useCallback(async () => {
        if (user) {
            await fetchBusinessData(user.id)
        }
    }, [user])

    // Memoize context value to ensure proper re-renders
    const contextValue = useMemo(() => ({
        businessId,
        business,
        setBusinessId: setBusinessIdWithStorage,
        loading,
        error,
        refreshBusiness,
    }), [businessId, business, loading, error, refreshBusiness]);

    return (
        <BusinessContext.Provider value={contextValue}>
            {children}
        </BusinessContext.Provider>
    )
}

export function useBusiness() {
    return useContext(BusinessContext)
}
