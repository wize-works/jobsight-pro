import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Subtask = Database["public"]["Tables"]["subtasks"]["Row"];
export type SubtaskInsert = Database["public"]["Tables"]["subtasks"]["Insert"];
export type SubtaskUpdate = Database["public"]["Tables"]["subtasks"]["Update"];

export type SubtaskStatus = "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";

export const subtaskStatusOptions = createOptions<SubtaskStatus>({
    not_started: { label: "Not Started", badge: "badge-secondary" },
    in_progress: { label: "In Progress", badge: "badge-warning" },
    completed: { label: "Completed", badge: "badge-success" },
    on_hold: { label: "On Hold", badge: "badge-info" },
    cancelled: { label: "Cancelled", badge: "badge-error" }
});