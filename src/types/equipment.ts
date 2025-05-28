import type { Database } from "@/types/supabase";
import { EquipmentAssignment } from "./equipment-assignments";
import { createOptions } from "@/utils/options";

export type Equipment = Database["public"]["Tables"]["equipment"]["Row"];
export type EquipmentInsert = Database["public"]["Tables"]["equipment"]["Insert"];
export type EquipmentUpdate = Database["public"]["Tables"]["equipment"]["Update"];

export type EquipmentWithAssignment = Equipment & EquipmentAssignment;
export type EquipmentWithAssignments = EquipmentWithAssignment[];

export type EquipmentWithDetails = Equipment & {
    assigned_to?: string | null
}

export type EquipmentStatus = "in_use" | "available" | "maintenance" | "repair" | "retired";
export type EquipmentType = "heavy" | "medium" | "small" | "tool" | "electronic" | "other";

export const equipmentStatusOptions = createOptions<EquipmentStatus>({
    "in_use": { label: "In Use", badge: "badge-primary" },
    "available": { label: "Available", badge: "badge-success" },
    "maintenance": { label: "Maintenance", badge: "badge-warning" },
    "repair": { label: "Under Repair", badge: "badge-error" },
    "retired": { label: "Retired", badge: "badge-neutral" }
});

export const equipmentTypeOptions = createOptions<EquipmentType>({
    "heavy": { label: "Heavy Equipment", badge: "badge-primary" },
    "medium": { label: "Medium Equipment", badge: "badge-secondary" },
    "small": { label: "Small Equipment", badge: "badge-success" },
    "tool": { label: "Tools", badge: "badge-warning" },
    "electronic": { label: "Electronic Equipment", badge: "badge-info" },
    "other": { label: "Other", badge: "badge-neutral" }
});