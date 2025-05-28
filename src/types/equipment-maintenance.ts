import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type EquipmentMaintenance = Database["public"]["Tables"]["equipment_maintenance"]["Row"];
export type EquipmentMaintenanceInsert = Database["public"]["Tables"]["equipment_maintenance"]["Insert"];
export type EquipmentMaintenanceUpdate = Database["public"]["Tables"]["equipment_maintenance"]["Update"];

export type EquipmentMaintenanceStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type EquipmentMaintenanceType = "routine" | "repair" | "inspection" | "upgrade" | "other";

export const maintenanceTypeOptions = createOptions<EquipmentMaintenanceType>({
    "routine": { label: "Routine", badge: "badge-primary" },
    "repair": { label: "Repair", badge: "badge-secondary" },
    "inspection": { label: "Inspection", badge: "badge-info" },
    "upgrade": { label: "Upgrade", badge: "badge-success" },
    "other": { label: "Other", badge: "badge-neutral" },
});

export const maintenanceStatusOptions = createOptions<EquipmentMaintenanceStatus>({
    "scheduled": { label: "Scheduled", badge: "badge-info" },
    "in_progress": { label: "In Progress", badge: "badge-warning" },
    "completed": { label: "Completed", badge: "badge-success" },
    "cancelled": { label: "Cancelled", badge: "badge-error" },
});