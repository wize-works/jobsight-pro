import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "./db"
import type { Database } from "@/types/supabase"
import { createServerClient } from "@/lib/supabase"

export type Client = Database["public"]["Tables"]["clients"]["Row"]
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"]
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"]

// Fetch all clients for a business
export async function getClients(businessId: string) {
    return await fetchByBusiness("clients", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    })
}

// Fetch a single client by ID
export async function getClientById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("clients", businessId, "*", {
        filter: { id },
    })

    return {
        data: data?.[0] || null,
        error,
    }
}

// Create a new client
export async function createClient(client: Omit<ClientInsert, "business_id">, businessId: string, userId?: string) {
    return await insertWithBusiness("clients", client, businessId, { userId });
}

// Update an existing client
export async function updateClient(id: string, client: ClientUpdate, businessId: string, userId?: string) {
    return await updateWithBusinessCheck("clients", id, client, businessId, { userId });
}

// Delete a client
export async function deleteClient(id: string, businessId: string) {
    return await deleteWithBusinessCheck("clients", id, businessId);
}

// Search clients by name, contact name, or email
export async function searchClients(query: string, businessId: string) {
    const supabase = createServerClient()
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") }
    }

    return await supabase
        .from("clients")
        .select("*")
        .eq("business_id", businessId)
        .or(`name.ilike.%${query}%,contact_name.ilike.%${query}%,contact_email.ilike.%${query}%`)
        .order("name")
}

// Get clients by status
export async function getClientsByStatus(status: string, businessId: string) {
    return await fetchByBusiness("clients", businessId, "*", {
        filter: { status },
        orderBy: { column: "name", ascending: true },
    })
}

// Get client statistics
export async function getClientStatistics(businessId: string) {
    const supabase = createServerClient()
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") }
    }

    // Get total clients
    const { data: totalData, error: totalError } = await supabase
        .from("clients")
        .select("id", { count: "exact" })
        .eq("business_id", businessId)

    if (totalError) {
        return { data: null, error: totalError }
    }

    // Get active clients
    const { data: activeData, error: activeError } = await supabase
        .from("clients")
        .select("id", { count: "exact" })
        .eq("business_id", businessId)
        .eq("status", "active")

    if (activeError) {
        return { data: null, error: activeError }
    }

    // Get prospect clients
    const { data: prospectData, error: prospectError } = await supabase
        .from("clients")
        .select("id", { count: "exact" })
        .eq("business_id", businessId)
        .eq("status", "prospect")

    if (prospectError) {
        return { data: null, error: prospectError }
    }

    // Get inactive clients
    const { data: inactiveData, error: inactiveError } = await supabase
        .from("clients")
        .select("id", { count: "exact" })
        .eq("business_id", businessId)
        .eq("status", "inactive")

    if (inactiveError) {
        return { data: null, error: inactiveError }
    }

    return {
        data: {
            total: totalData.count || 0,
            active: activeData.count || 0,
            prospect: prospectData.count || 0,
            inactive: inactiveData.count || 0,
        },
        error: null,
    }
}
