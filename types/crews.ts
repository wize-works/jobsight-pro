import type { Database } from "@/types/supabase";

export type Crew = Database["public"]["Tables"]["crews"]["Row"];
export type CrewInsert = Database["public"]["Tables"]["crews"]["Insert"];
export type CrewUpdate = Database["public"]["Tables"]["crews"]["Update"];

export type CrewWithLeader = Crew & {
    leader: string;
    current_project: string;
    current_project_id: string;
};

export type CrewWithStats = Crew & {
    leader: string;
    members: number;
    current_project: string;
    current_project_id: string;
};