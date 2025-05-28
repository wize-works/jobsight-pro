import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type ProjectStatus = "planned" | "active" | "completed" | "on_hold" | "cancelled";
export type ProjectType = "construction" | "maintenance" | "inspection" | "other";

export const projectStatusOptions = createOptions<ProjectStatus>({
    planned: { label: "Planned", badge: "badge-info" },
    active: { label: "Active", badge: "badge-success" },
    completed: { label: "Completed", badge: "badge-primary" },
    on_hold: { label: "On Hold", badge: "badge-warning" },
    cancelled: { label: "Cancelled", badge: "badge-error" }
});

export const projectTypeOptions = createOptions<ProjectType>({
    construction: { label: "Construction", badge: "badge-primary" },
    maintenance: { label: "Maintenance", badge: "badge-secondary" },
    inspection: { label: "Inspection", badge: "badge-info" },
    other: { label: "Other", badge: "badge-neutral" }
});