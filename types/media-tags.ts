import type { Database } from "@/types/supabase";

export type MediaTag = Database["public"]["Tables"]["media_tags"]["Row"];
export type MediaTagInsert = Database["public"]["Tables"]["media_tags"]["Insert"];
export type MediaTagUpdate = Database["public"]["Tables"]["media_tags"]["Update"];