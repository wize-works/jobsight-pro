import type { Database } from "@/types/supabase";

export type CrewMemberAssignment = Database["public"]["Tables"]["crew_member_assignments"]["Row"];
export type CrewMemberAssignmentInsert = Database["public"]["Tables"]["crew_member_assignments"]["Insert"];
export type CrewMemberAssignmentUpdate = Database["public"]["Tables"]["crew_member_assignments"]["Update"];