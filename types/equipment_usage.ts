import type { Database } from "@/types/supabase";

export type EquipmentUsage = Database["public"]["Tables"]["equipment_usage"]["Row"];
export type EquipmentUsageInsert = Database["public"]["Tables"]["equipment_usage"]["Insert"];
export type EquipmentUsageUpdate = Database["public"]["Tables"]["equipment_usage"]["Update"];