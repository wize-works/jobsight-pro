import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export type ProjectWithDetails = Project & {
    client_name: string;
}

export type ProjectStatus = "all" | "bidding" | "planning" | "planned" | "active" | "in_progress" | "completed" | "on_hold" | "cancelled";
export type ProjectType = "all" | "construction" | "maintenance" | "inspection" | "other";

export const projectStatusOptions = createOptions<ProjectStatus>({
    all: { label: "All Status", badge: "badge-neutral" },
    bidding: { label: "Bidding", badge: "badge-accent" },
    planning: { label: "Planning", badge: "badge-secondary" },
    planned: { label: "Planned", badge: "badge-info" },
    active: { label: "Active", badge: "badge-success" },
    in_progress: { label: "In Progress", badge: "badge-warning" },
    completed: { label: "Completed", badge: "badge-primary" },
    on_hold: { label: "On Hold", badge: "badge-warning" },
    cancelled: { label: "Cancelled", badge: "badge-error" }
});

export const projectTypeOptions = createOptions<ProjectType>({
    all: { label: "All Types", badge: "badge-neutral" },
    construction: { label: "Construction", badge: "badge-primary" },
    maintenance: { label: "Maintenance", badge: "badge-secondary" },
    inspection: { label: "Inspection", badge: "badge-info" },
    other: { label: "Other", badge: "badge-neutral" }
});