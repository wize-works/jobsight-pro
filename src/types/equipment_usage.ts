import type { Database } from "@/types/supabase";

export type EquipmentUsage = Database["public"]["Tables"]["equipment_usage"]["Row"];
export type EquipmentUsageInsert = Database["public"]["Tables"]["equipment_usage"]["Insert"];
export type EquipmentUsageUpdate = Database["public"]["Tables"]["equipment_usage"]["Update"];

export type EquipmentUsageWithDetails = EquipmentUsage & {
    project_name?: string;
    crew_name?: string;
}

// export type EquipmentUsageStatus = "active" | "inactive" | "maintenance" | "retired";
// export type Equipment