import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type TaskStatus = "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const taskStatusOptions = createOptions<TaskStatus>({
    not_started: { label: "Not Started", badge: "badge-secondary" },
    in_progress: { label: "In Progress", badge: "badge-warning" },
    completed: { label: "Completed", badge: "badge-success" },
    on_hold: { label: "On Hold", badge: "badge-info" },
    cancelled: { label: "Cancelled", badge: "badge-error" }
});

export const taskPriorityOptions = createOptions<TaskPriority>({
    low: { label: "Low", badge: "badge-secondary" },
    medium: { label: "Medium", badge: "badge-warning" },
    high: { label: "High", badge: "badge-danger" },
    urgent: { label: "Urgent", badge: "badge-error" }
});