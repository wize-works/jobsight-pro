"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getSupabaseBrowserClient } from "./supabase"
import type { SupabaseClient } from "@supabase/supabase-js"

type SupabaseContextType = {
  supabase: SupabaseClient | null
  isLoading: boolean
  isConnected: boolean
  error: string | null
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isLoading: true,
  isConnected: false,
  error: null,
})

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        const client = getSupabaseBrowserClient()

        if (!client) {
          setError("Supabase client could not be initialized. Check your environment variables.")
          setIsLoading(false)
          return
        }

        // Test connection
        const { data, error: testError } = await client.from("_test_connection").select("*").limit(1).maybeSingle()

        if (testError && testError.code !== "PGRST116") {
          // PGRST116 means relation doesn't exist, which is fine for testing connection
          throw testError
        }

        setSupabase(client)
        setIsConnected(true)
      } catch (err: any) {
        console.error("Supabase connection error:", err)
        setError(err.message || "Failed to connect to Supabase")
      } finally {
        setIsLoading(false)
      }
    }

    initializeSupabase()
  }, [])

  return (
    <SupabaseContext.Provider value={{ supabase, isLoading, isConnected, error }}>{children}</SupabaseContext.Provider>
  )
}

export const useSupabase = () => useContext(SupabaseContext)
