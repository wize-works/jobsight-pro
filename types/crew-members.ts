import type { Database } from "@/types/supabase";

export type CrewMember = Database["public"]["Tables"]["crew_members"]["Row"];
export type CrewMemberInsert = Database["public"]["Tables"]["crew_members"]["Insert"];
export type CrewMemberUpdate = Database["public"]["Tables"]["crew_members"]["Update"];