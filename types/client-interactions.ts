import type { Database } from "@/types/supabase";

export type ClientInteraction = Database["public"]["Tables"]["client_interactions"]["Row"];
export type ClientInteractionInsert = Database["public"]["Tables"]["client_interactions"]["Insert"];
export type ClientInteractionUpdate = Database["public"]["Tables"]["client_interactions"]["Update"];