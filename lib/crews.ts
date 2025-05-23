import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "./db";
import { createServerClient } from "../lib/supabase";
import type { CrewInsert, CrewUpdate } from "@/types/crews";

// Fetch all crews for a business
export async function getCrews(businessId: string) {
    return await fetchByBusiness("crews", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });
}

// Fetch a single crew by ID
export async function getCrewById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("crews", businessId, "*", {
        filter: { id },
    })

    return {
        data: data?.[0] || null,
        error,
    }
}

// Create a new crew
export async function createCrew(crew: Omit<CrewInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("crews", crew, businessId)
}

// Update an existing crew
export async function updateCrew(id: string, crew: CrewUpdate, businessId: string) {
    return await updateWithBusinessCheck("crews", id, crew, businessId)
}

// Delete a crew
export async function deleteCrew(id: string, businessId: string) {
    return await deleteWithBusinessCheck("crews", id, businessId)
}

// Get crews by status
export async function getCrewsByStatus(status: string, businessId: string) {
    return await fetchByBusiness("crews", businessId, "*", {
        filter: { status },
        orderBy: { column: "name", ascending: true },
    })
}

// Get crews by project
export async function getCrewsByProject(projectId: string, businessId: string) {
    const supabase = createServerClient()
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") }
    }

    return await supabase
        .from("crews")
        .select("*")
        .eq("business_id", businessId)
        .eq("current_project", projectId)
        .order("name")
}

// Search crews by name or specialty
export async function searchCrews(query: string, businessId: string) {
    const supabase = createServerClient()
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") }
    }

    return await supabase
        .from("crews")
        .select("*")
        .eq("business_id", businessId)
        .or(`name.ilike.%${query}%,specialty.ilike.%${query}%`)
        .order("name")
}
