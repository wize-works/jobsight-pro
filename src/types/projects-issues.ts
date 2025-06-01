import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type ProjectIssue = Database["public"]["Tables"]["project_issues"]["Row"];
export type ProjectIssueInsert = Database["public"]["Tables"]["project_issues"]["Insert"];
export type ProjectIssueUpdate = Database["public"]["Tables"]["project_issues"]["Update"];

export type ProjectIssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type ProjectIssuePriority = "low" | "medium" | "high" | "critical";

export const projectIssueStatusOptions = createOptions<ProjectIssueStatus>({
    open: { label: "Open", badge: "badge-accent" },
    in_progress: { label: "In Progress", badge: "badge-info" },
    resolved: { label: "Resolved", badge: "badge-success" },
    closed: { label: "Closed", badge: "badge-secondary" }
});

export const projectIssuePriorityOptions = createOptions<ProjectIssuePriority>({
    low: { label: "Low", badge: "badge-success" },
    medium: { label: "Medium", badge: "badge-info" },
    high: { label: "High", badge: "badge-warning" },
    critical: { label: "Critical", badge: "badge-error" }
});

export type ProjectIssueWithDetails = ProjectIssue & {
    assigned_to_name: string;
    project_name: string;
};