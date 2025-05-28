import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type ProjectMilestone = Database["public"]["Tables"]["project_milestones"]["Row"];
export type ProjectMilestoneInsert = Database["public"]["Tables"]["project_milestones"]["Insert"];
export type ProjectMilestoneUpdate = Database["public"]["Tables"]["project_milestones"]["Update"];

export type ProjectMilestoneStatus = "planned" | "in_progress" | "completed" | "delayed" | "cancelled";

export const projectMilestoneStatusOptions = createOptions<ProjectMilestoneStatus>({
    planned: { label: "Planned", badge: "badge-info" },
    in_progress: { label: "In Progress", badge: "badge-warning" },
    completed: { label: "Completed", badge: "badge-success" },
    delayed: { label: "Delayed", badge: "badge-error" },
    cancelled: { label: "Cancelled", badge: "badge-secondary" }
});