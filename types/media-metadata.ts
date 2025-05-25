import type { Database } from "@/types/supabase";

export type MediaMetadata = Database["public"]["Tables"]["media_metadata"]["Row"];
export type MediaMetadataInsert = Database["public"]["Tables"]["media_metadata"]["Insert"];
export type MediaMetadataUpdate = Database["public"]["Tables"]["media_metadata"]["Update"];