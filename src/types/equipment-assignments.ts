import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type EquipmentAssignment = Database["public"]["Tables"]["equipment_assignments"]["Row"];
export type EquipmentAssignmentInsert = Database["public"]["Tables"]["equipment_assignments"]["Insert"];
export type EquipmentAssignmentUpdate = Database["public"]["Tables"]["equipment_assignments"]["Update"];

export type EquipmentAssignmentWithDetails = EquipmentAssignment & {
    project_name?: string | null;
    crew_name?: string | null;
};

export type EquipmentAssignmentWithEquipmentDetails = EquipmentAssignment & {
    equipment_name?: string | null;
    equipment_model?: string | null;
    equipment_type?: string | null;
    equipment_status?: string | null;
};

export type EquipmentAssignmentStatus = "assigned" | "available" | "maintenance" | "repair" | "retired";

export const assignmentStatusOptions = createOptions<EquipmentAssignmentStatus>({
    assigned: { label: "Assigned", badge: "badge-primary" },
    available: { label: "Available", badge: "badge-success" },
    maintenance: { label: "Maintenance", badge: "badge-warning" },
    repair: { label: "Repair", badge: "badge-error" },
    retired: { label: "Retired", badge: "badge-neutral" },
});