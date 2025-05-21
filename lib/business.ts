import { createServerClient, getSupabaseBrowserClient } from "./supabase"
import type { Database } from "@/types/supabase"

export type Business = Database["public"]["Tables"]["businesses"]["Row"]
export type BusinessInsert = Database["public"]["Tables"]["businesses"]["Insert"]
export type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"]

// Get business by ID
export async function getBusiness(businessId: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  return await supabase.from("businesses").select("*").eq("id", businessId).single()
}

// Update business
export async function updateBusiness(businessId: string, data: BusinessUpdate) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  // Add updated_at timestamp
  const updatedData = {
    ...data,
    updated_at: new Date().toISOString(),
  }

  return await supabase.from("businesses").update(updatedData).eq("id", businessId).select().single()
}

// Server-side functions
export async function serverGetBusiness(businessId: string) {
  const supabase = createServerClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  return await supabase.from("businesses").select("*").eq("id", businessId).single()
}

export async function serverUpdateBusiness(businessId: string, data: BusinessUpdate) {
  const supabase = createServerClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  // Add updated_at timestamp
  const updatedData = {
    ...data,
    updated_at: new Date().toISOString(),
  }

  return await supabase.from("businesses").update(updatedData).eq("id", businessId).select().single()
}
