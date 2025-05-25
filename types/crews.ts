import type { Database } from "@/types/supabase";

export type Crew = Database["public"]["Tables"]["crews"]["Row"];
export type CrewInsert = Database["public"]["Tables"]["crews"]["Insert"];
export type CrewUpdate = Database["public"]["Tables"]["crews"]["Update"];

export type CrewWithDetails = Crew & {
    leader: string;
    member_count: number;
    current_project?: string | null;
    current_project_id?: string | null;
};

export type CrewWithStats = Crew & {
    leader: string;
    members: number;
    current_project: string;
    current_project_id: string;
};