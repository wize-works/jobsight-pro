import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type ProjectIssue = Database["public"]["Tables"]["project_issues"]["Row"];
export type ProjectIssueInsert = Database["public"]["Tables"]["project_issues"]["Insert"];
export type ProjectIssueUpdate = Database["public"]["Tables"]["project_issues"]["Update"];

export type ProjectIssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type ProjectIssuePriority = "low" | "medium" | "high" | "critical";

export const projectIssueStatusOptions = createOptions<ProjectIssueStatus>({
    open: { label: "Open", badge: "badge-primary" },
    in_progress: { label: "In Progress", badge: "badge-warning" },
    resolved: { label: "Resolved", badge: "badge-success" },
    closed: { label: "Closed", badge: "badge-secondary" }
});

export const projectIssuePriorityOptions = createOptions<ProjectIssuePriority>({
    low: { label: "Low", badge: "badge-success" },
    medium: { label: "Medium", badge: "badge-warning" },
    high: { label: "High", badge: "badge-error" },
    critical: { label: "Critical", badge: "badge-danger" }
});