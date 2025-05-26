import type { Database } from "@/types/supabase";

export type EquipmentAssignment = Database["public"]["Tables"]["equipment_assignments"]["Row"];
export type EquipmentAssignmentInsert = Database["public"]["Tables"]["equipment_assignments"]["Insert"];
export type EquipmentAssignmentUpdate = Database["public"]["Tables"]["equipment_assignments"]["Update"];

export type EquipmentAssignmentStatus = "assigned" | "available" | "maintenance" | "repair" | "retired";
export type EquipmentAssignmentWithDetails = EquipmentAssignment & {
    project_name?: string | null;
    crew_name?: string | null;
};