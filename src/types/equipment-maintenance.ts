import type { Database } from "@/types/supabase";

export type EquipmentMaintenance = Database["public"]["Tables"]["equipment_maintenance"]["Row"];
export type EquipmentMaintenanceInsert = Database["public"]["Tables"]["equipment_maintenance"]["Insert"];
export type EquipmentMaintenanceUpdate = Database["public"]["Tables"]["equipment_maintenance"]["Update"];