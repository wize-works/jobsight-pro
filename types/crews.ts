import type { Database } from "@/types/supabase";

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