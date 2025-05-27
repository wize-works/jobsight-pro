import type { Database } from "@/types/supabase";

export type TaskDependency = Database["public"]["Tables"]["task_dependencies"]["Row"];
export type TaskDependencyInsert = Database["public"]["Tables"]["task_dependencies"]["Insert"];
export type TaskDependencyUpdate = Database["public"]["Tables"]["task_dependencies"]["Update"];