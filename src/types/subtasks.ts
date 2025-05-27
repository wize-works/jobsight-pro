import type { Database } from "@/types/supabase";

export type Subtask = Database["public"]["Tables"]["subtasks"]["Row"];
export type SubtaskInsert = Database["public"]["Tables"]["subtasks"]["Insert"];
export type SubtaskUpdate = Database["public"]["Tables"]["subtasks"]["Update"];