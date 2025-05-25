import type { Database } from "@/types/supabase";

export type ProjectMilestone = Database["public"]["Tables"]["project_milestones"]["Row"];
export type ProjectMilestoneInsert = Database["public"]["Tables"]["project_milestones"]["Insert"];
export type ProjectMilestoneUpdate = Database["public"]["Tables"]["project_milestones"]["Update"];