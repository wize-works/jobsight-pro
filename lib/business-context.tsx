"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { getUserBusiness } from "@/app/actions/business"
import type { Business } from "./business"

type BusinessContextType = {
    businessId: string | null
    businessData: Business | null
    setBusinessId: (id: string) => void
    loading: boolean
    error: string | null
    refreshBusiness: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType>({
    businessId: null,
    businessData: null,
    setBusinessId: () => { },
    loading: true,
    error: null,
    refreshBusiness: async () => { },
})

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [businessId, setBusinessId] = useState<string | null>(null)
    const [businessData, setBusinessData] = useState<Business | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user, isLoading: isKindeLoading } = useKindeBrowserClient()

    // Function to fetch business data using server action
    const fetchBusinessData = async (userId: string) => {
        try {
            const data = await getUserBusiness(userId)

            if (data) {
                setBusinessId(data.id)
                setBusinessData(data as Business)
                localStorage.setItem("businessId", data.id)
            }
        } catch (err) {
            console.error("Error fetching business data:", err)
            setError(err instanceof Error ? err.message : "Unknown error fetching business data")
        }
    }

    // Function to load business data
    const loadBusinessData = async () => {
        if (isKindeLoading) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Try to get from localStorage first
            const storedBusinessId = localStorage.getItem("businessId")

            if (storedBusinessId && user) {
                // Verify the stored business ID is still valid by fetching it
                await fetchBusinessData(user.id)
                setLoading(false)
                return
            }

            // If not in localStorage and user is logged in, try to fetch from API
            if (!user) {
                setLoading(false)
                return
            }

            // Fetch user's business using server action
            await fetchBusinessData(user.id)
        } catch (err) {
            console.error("Error loading business data:", err)
            setError(err instanceof Error ? err.message : "Unknown error loading business data")
        } finally {
            setLoading(false)
        }
    }

    // Load business data when user changes or on initial load
    useEffect(() => {
        loadBusinessData()
    }, [user, isKindeLoading])

    // Update business ID in storage
    const setBusinessIdWithStorage = (id: string) => {
        setBusinessId(id)
        localStorage.setItem("businessId", id)
    }

    // Function to manually refresh business data
    const refreshBusiness = async () => {
        if (user) {
            await fetchBusinessData(user.id)
        }
    }

    return (
        <BusinessContext.Provider
            value={{
                businessId,
                businessData,
                setBusinessId: setBusinessIdWithStorage,
                loading,
                error,
                refreshBusiness,
            }}
        >
            {children}
        </BusinessContext.Provider>
    )
}

export function useBusiness() {
    return useContext(BusinessContext)
}
