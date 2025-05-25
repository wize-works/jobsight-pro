import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "./db";
import { createServerClient } from "../lib/supabase";
import type { EquipmentInsert, EquipmentUpdate } from "@/types/equipment";

// Fetch all equipment for a business
export async function getEquipment(businessId: string) {
    return await fetchByBusiness("equipment", businessId, "*", {
        orderBy: { column: "name", ascending: true },
    });
}

// Fetch a single equipment by ID
export async function getEquipmentById(id: string, businessId: string) {
    const { data, error } = await fetchByBusiness("equipment", businessId, "*", {
        filter: { id },
    });

    return {
        data: data?.[0] || null,
        error,
    };
}

// Create a new equipment
export async function createEquipment(equipment: Omit<EquipmentInsert, "business_id">, businessId: string) {
    return await insertWithBusiness("equipment", equipment, businessId);
}

// Update an existing equipment
export async function updateEquipment(id: string, equipment: EquipmentUpdate, businessId: string) {
    return await updateWithBusinessCheck("equipment", id, equipment, businessId);
}

// Delete an equipment
export async function deleteEquipment(id: string, businessId: string) {
    return await deleteWithBusinessCheck("equipment", id, businessId);
}

// Get equipment by status
export async function getEquipmentByStatus(status: string, businessId: string) {
    return await fetchByBusiness("equipment", businessId, "*", {
        filter: { status },
        orderBy: { column: "name", ascending: true },
    });
}

// Get equipment by type
export async function getEquipmentByType(type: string, businessId: string) {
    return await fetchByBusiness("equipment", businessId, "*", {
        filter: { type },
        orderBy: { column: "name", ascending: true },
    });
}

// Search equipment by name, make, or model
export async function searchEquipment(query: string, businessId: string) {
    const supabase = createServerClient();
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") };
    }

    return await supabase
        .from("equipment")
        .select("*")
        .eq("business_id", businessId)
        .or(`name.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%`)
        .order("name");
}
