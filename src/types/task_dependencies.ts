import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type TaskDependency = Database["public"]["Tables"]["task_dependencies"]["Row"];
export type TaskDependencyInsert = Database["public"]["Tables"]["task_dependencies"]["Insert"];
export type TaskDependencyUpdate = Database["public"]["Tables"]["task_dependencies"]["Update"];

export type TaskDependencyType = "predecessor" | "successor";

export const taskDependencyTypeOptions = createOptions<TaskDependencyType>({
    predecessor: { label: "Predecessor", badge: "badge-warning" },
    successor: { label: "Successor", badge: "badge-info" }
});