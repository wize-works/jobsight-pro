"use client"

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { useRouter, usePathname } from "next/navigation"
import { getUserBusiness } from "@/lib/actions/business-client"
import { getUserBusiness as getServerUserBusiness } from "@/app/actions/business"
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
    const { user, isLoading: isKindeLoading } = useKindeBrowserClient()
    const router = useRouter()
    const pathname = usePathname()
    const { toast } = useToast()

    // Check if we're in a registration flow
    const isRegistrationFlow = pathname === '/register' || pathname === '/onboarding'    // Function to fetch business data using client action with server fallback
    const fetchBusinessData = async (userId: string) => {
        try {
            console.log("🔍 Fetching business data for user:", userId);

            // Try client action first (offline-first)
            let business = await getUserBusiness(userId);

            // If client action returns null, fallback to server action
            if (!business) {
                console.log("⚠️ Client action returned null, trying server action...");
                business = await getServerUserBusiness(userId);

                // If server action succeeded, we should sync this data to IndexedDB
                if (business) {
                    console.log("✅ Server action found business, syncing to offline storage");
                }
            } else {
                console.log("✅ Client action found business from offline storage");
            }

            if (!business) {
                console.log("❌ No business found for user");
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
            }

            // Business found successfully
            console.log("🎉 Business found:", business.name, "ID:", business.id);
            setBusinessId(business.id)
            setBusinessData(business as Business)
            localStorage.setItem("businessId", business.id)

            // Use setTimeout to ensure state update happens after current call stack
            setTimeout(() => {
                setLoading(false)
            }, 0)
        } catch (err) {
            console.error("💥 Error fetching business data:", err)
            console.error("💥 Full error details:", JSON.stringify(err, null, 2))
            setError(err instanceof Error ? err.message : "Unknown error fetching business data")

            if (!isRegistrationFlow) {
                toast.error({
                    title: "Error",
                    description: "Failed to load business data. Please try refreshing the page.",
                })
            }
            setLoading(false);
        }
    }

    // Function to load business data
    const loadBusinessData = async () => {
        console.log("🚀 Starting loadBusinessData, isKindeLoading:", isKindeLoading, "user:", user?.id);

        if (isKindeLoading) {
            console.log("⏳ Kinde still loading, waiting...");
            return
        }

        setLoading(true)
        setError(null)

        try {
            // If no user and not in registration flow, finish loading
            if (!user) {
                console.log("❌ No user found, finishing loading");
                setLoading(false)
                return
            }

            console.log("👤 User found:", user.id, "checking for stored business...");

            // Try to get from localStorage first
            const storedBusinessId = localStorage.getItem("businessId")
            console.log("💾 Stored business ID:", storedBusinessId);

            if (storedBusinessId && user) {
                console.log("✅ Found stored business ID, verifying...");
                // Verify the stored business ID is still valid by fetching it
                await fetchBusinessData(user.id)
                return
            }

            // No stored business ID, fetch user's business
            console.log("🔄 No stored business ID, fetching from server...");
            await fetchBusinessData(user.id)
        } catch (err) {
            console.error("💥 Error in loadBusinessData:", err);
            setError(err instanceof Error ? err.message : "Unknown error loading business data")
            setLoading(false) // Only set loading false on error
        }
    }

    // Load business data when user changes or on initial load
    useEffect(() => {
        loadBusinessData()
    }, [user, isKindeLoading, isRegistrationFlow])

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
