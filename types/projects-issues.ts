import type { Database } from "@/types/supabase";

export type ProjectIssue = Database["public"]["Tables"]["project_issues"]["Row"];
export type ProjectIssueInsert = Database["public"]["Tables"]["project_issues"]["Insert"];
export type ProjectIssueUpdate = Database["public"]["Tables"]["project_issues"]["Update"];