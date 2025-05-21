"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { getSupabaseBrowserClient } from "./supabase"

type BusinessContextType = {
  businessId: string | null
  setBusinessId: (id: string) => void
  loading: boolean
}

const BusinessContext = createContext<BusinessContextType>({
  businessId: null,
  setBusinessId: () => {},
  loading: true,
})

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, isLoading: isKindeLoading } = useKindeBrowserClient()

  useEffect(() => {
    // Load business ID from localStorage or fetch from API
    const loadBusinessId = async () => {
      if (isKindeLoading) {
        return
      }

      try {
        // Try to get from localStorage first
        const storedBusinessId = localStorage.getItem("businessId")

        if (storedBusinessId) {
          setBusinessId(storedBusinessId)
          setLoading(false)
          return
        }

        // If not in localStorage and user is logged in, try to fetch from API
        if (!user) {
          setLoading(false)
          return
        }

        const supabase = getSupabaseBrowserClient()
        if (!supabase) {
          console.error("Supabase client not initialized")
          setLoading(false)
          return
        }

        // Fetch user's business
        const { data: userBusinesses, error } = await supabase
          .from("user_businesses")
          .select("business_id")
          .eq("user_id", user.id)
          .single()

        if (error) {
          console.error("Error fetching user business:", error)
          setLoading(false)
          return
        }

        if (userBusinesses?.business_id) {
          setBusinessId(userBusinesses.business_id)
          localStorage.setItem("businessId", userBusinesses.business_id)
        }
      } catch (error) {
        console.error("Error loading business ID:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBusinessId()
  }, [user, isKindeLoading])

  const setBusinessIdWithStorage = (id: string) => {
    setBusinessId(id)
    localStorage.setItem("businessId", id)
  }

  return (
    <BusinessContext.Provider value={{ businessId, setBusinessId: setBusinessIdWithStorage, loading }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  return useContext(BusinessContext)
}
