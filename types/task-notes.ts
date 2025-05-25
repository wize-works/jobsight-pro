import type { Database } from "@/types/supabase";

export type TaskNote = Database["public"]["Tables"]["task_notes"]["Row"];
export type TaskNoteInsert = Database["public"]["Tables"]["task_notes"]["Insert"];
export type TaskNoteUpdate = Database["public"]["Tables"]["task_notes"]["Update"];