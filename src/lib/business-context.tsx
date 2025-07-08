"use client"

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react"
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

    // Use refs to prevent excessive fetches
    const isLoadingRef = useRef(false)
    const lastFetchTimeRef = useRef(0)
    const FETCH_THROTTLE_MS = 2000 // Minimum time between fetches (2 seconds)

    // Check if we're in a registration flow
    const isRegistrationFlow = pathname === '/sign-up'    // Function to fetch business data using server action
    const fetchBusinessData = async (userId: string) => {
        try {
            const response = await getUserBusiness(userId);

            if (!response) {
                setLoading(false);
                isLoadingRef.current = false;
                // User is valid but has no business
                if (!isRegistrationFlow) {
                    router.push('/sign-up')
                    toast.info({
                        title: "Business setup required",
                        description: "Please complete your business setup",
                    })
                }
                return
            }

            if ('success' in response && !response.success) {
                setLoading(false);
                isLoadingRef.current = false;
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
            }

            if ('id' in response) {
                // Batch all state updates together
                setBusinessId(response.id)
                setBusinessData(response as Business)
                if (typeof window !== 'undefined') {
                    localStorage.setItem("businessId", response.id)

                    // Update global state for client actions
                    if (typeof global !== 'undefined') {
                        global.currentBusinessId = response.id;
                    }
                }

                // Set loading to false
                setLoading(false);
                isLoadingRef.current = false;
            } else {
                console.log("❌ Response doesn't have ID, redirecting to register");
                setLoading(false);
                isLoadingRef.current = false;
                router.push('/sign-up');
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
        // Don't attempt to load if Clerk hasn't loaded yet
        if (!isLoaded) {
            return;
        }

        // Check if we're already loading or if we've fetched recently
        const now = Date.now();
        if (isLoadingRef.current || (now - lastFetchTimeRef.current < FETCH_THROTTLE_MS)) {
            console.log("Skipping business fetch - throttled or already loading");
            return;
        }

        // Set loading state and refs
        setLoading(true);
        isLoadingRef.current = true;
        lastFetchTimeRef.current = now;
        setError(null);

        try {
            // If no user and not in registration flow, finish loading
            if (!user) {
                setLoading(false);
                isLoadingRef.current = false;
                return;
            }

            // Try to get from localStorage first (only on client side)
            const storedBusinessId = typeof window !== 'undefined' ? localStorage.getItem("businessId") : null;

            if (storedBusinessId && user) {
                // Verify the stored business ID is still valid by fetching it
                await fetchBusinessData(user.id);
                return;
            }

            // Fetch user's business using server action
            await fetchBusinessData(user.id);
        } catch (err) {
            console.error("Error in loadBusinessData:", err);
            setError(err instanceof Error ? err.message : "Unknown error loading business data");
            setLoading(false); // Ensure loading is set to false on error
        } finally {
            isLoadingRef.current = false;
        }
    }

    // Load business data when user changes or on initial load
    useEffect(() => {
        // Skip loading during SSR/build time when Clerk is not available
        if (typeof window === 'undefined') {
            setLoading(false);
            return;
        }

        // Only attempt to load business data when Clerk has fully loaded the user
        if (isLoaded) {
            loadBusinessData();
        }
    }, [user?.id, isLoaded]);

    // Update business ID in storage
    const setBusinessIdWithStorage = (id: string) => {
        setBusinessId(id)
        if (typeof window !== 'undefined') {
            localStorage.setItem("businessId", id)
        }
    }    // Function to manually refresh business data
    const refreshBusiness = useCallback(async () => {
        // Apply throttling to refreshBusiness as well
        const now = Date.now();
        if (isLoadingRef.current || (now - lastFetchTimeRef.current < FETCH_THROTTLE_MS)) {
            console.log("Skipping business refresh - throttled or already loading");
            return;
        }

        if (user) {
            // Set refs for throttling
            isLoadingRef.current = true;
            lastFetchTimeRef.current = now;

            try {
                await fetchBusinessData(user.id);
            } finally {
                isLoadingRef.current = false;
            }
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
