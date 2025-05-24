import type { Database } from "@/types/supabase";

export type ProjectCrew = Database["public"]["Tables"]["project_crews"]["Row"];
export type ProjectCrewInsert = Database["public"]["Tables"]["project_crews"]["Insert"];
export type ProjectCrewUpdate = Database["public"]["Tables"]["project_crews"]["Update"];