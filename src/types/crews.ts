import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Crew = Database["public"]["Tables"]["crews"]["Row"];
export type CrewInsert = Database["public"]["Tables"]["crews"]["Insert"];
export type CrewUpdate = Database["public"]["Tables"]["crews"]["Update"];

export type CrewStatus = "active" | "inactive" | "on_hold" | "archived";
export type CrewType = "construction" | "maintenance" | "cleaning" | "security" | "other";

export type CrewWithDetails = Crew & {
    leader: string;
    member_count: number;
    current_project?: string | null;
    current_project_id?: string | null;
    active_projects: number;
    total_hours: number;
};

export type CrewWithStats = Crew & {
    leader: string;
    members: number;
    current_project: string;
    current_project_id: string;
};

export const crewStatusOptions = createOptions<CrewStatus>({
    "active": { label: "Active", badge: "badge-success" },
    "inactive": { label: "Inactive", badge: "badge-secondary" },
    "on_hold": { label: "On Hold", badge: "badge-warning" },
    "archived": { label: "Archived", badge: "badge-error" }
});

export const crewTypeOptions = createOptions<CrewType>({
    "construction": { label: "Construction", badge: "badge-primary" },
    "maintenance": { label: "Maintenance", badge: "badge-secondary" },
    "cleaning": { label: "Cleaning", badge: "badge-success" },
    "security": { label: "Security", badge: "badge-warning" },
    "other": { label: "Other", badge: "badge-neutral" }
});